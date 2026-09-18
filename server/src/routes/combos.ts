import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// GET /api/combos - Public combo listings
router.get('/', (req: Request, res: Response): void => {
  const combos = db.prepare(`
    SELECT * FROM combos ORDER BY is_featured DESC, id DESC
  `).all() as any[];

  const enriched = combos.map(c => {
    const items = db.prepare(`
      SELECT ci.id, ci.custom_label, p.id as product_id, p.name as product_name, p.price as product_price, p.slug as product_slug
      FROM combo_items ci
      LEFT JOIN products p ON ci.product_id = p.id
      WHERE ci.combo_id = ?
    `).all(c.id);

    return {
      ...c,
      items
    };
  });

  res.json({ combos: enriched });
});

// GET /api/combos/:identifier
router.get('/:identifier', (req: Request, res: Response): void => {
  const { identifier } = req.params;
  const combo = db.prepare(`
    SELECT * FROM combos WHERE slug = ? OR id = ? LIMIT 1
  `).get(identifier, isNaN(Number(identifier)) ? -1 : Number(identifier)) as any;

  if (!combo) {
    res.status(404).json({ error: 'Combo not found' });
    return;
  }

  const items = db.prepare(`
    SELECT ci.id, ci.custom_label, p.id as product_id, p.name as product_name, p.price as product_price, p.slug as product_slug, p.stock_status
    FROM combo_items ci
    LEFT JOIN products p ON ci.product_id = p.id
    WHERE ci.combo_id = ?
  `).all(combo.id);

  res.json({
    ...combo,
    items
  });
});

// ADMIN ROUTES

// POST /api/combos
router.post('/', requireAdmin, (req: Request, res: Response): void => {
  const { title, description = '', price, image = '', stock_status = 'IN_STOCK', is_featured = 0, items = [] } = req.body;

  if (!title || price === undefined) {
    res.status(400).json({ error: 'Title and price are required' });
    return;
  }

  let baseSlug = slugify(title);
  let finalSlug = baseSlug;
  let counter = 1;
  while (db.prepare('SELECT id FROM combos WHERE slug = ?').get(finalSlug)) {
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  const result = db.prepare(`
    INSERT INTO combos (title, slug, description, price, image, stock_status, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(title.trim(), finalSlug, description.trim(), Number(price), image, stock_status, is_featured ? 1 : 0);

  const comboId = result.lastInsertRowid;

  if (Array.isArray(items)) {
    const insertItem = db.prepare(`
      INSERT INTO combo_items (combo_id, product_id, custom_label)
      VALUES (?, ?, ?)
    `);
    for (const item of items) {
      if (typeof item === 'string') {
        insertItem.run(comboId, null, item);
      } else if (typeof item === 'object') {
        insertItem.run(comboId, item.product_id || null, item.custom_label || item.name || '');
      }
    }
  }

  res.status(201).json({ success: true, id: comboId, slug: finalSlug });
});

// PUT /api/combos/:id
router.put('/:id', requireAdmin, (req: Request, res: Response): void => {
  const { id } = req.params;
  const { title, description, price, image, stock_status, is_featured, items } = req.body;

  const existing = db.prepare('SELECT id FROM combos WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: 'Combo not found' });
    return;
  }

  db.prepare(`
    UPDATE combos SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      price = COALESCE(?, price),
      image = COALESCE(?, image),
      stock_status = COALESCE(?, stock_status),
      is_featured = COALESCE(?, is_featured)
    WHERE id = ?
  `).run(title, description, price !== undefined ? Number(price) : null, image, stock_status, is_featured !== undefined ? (is_featured ? 1 : 0) : null, id);

  if (Array.isArray(items)) {
    db.prepare('DELETE FROM combo_items WHERE combo_id = ?').run(id);
    const insertItem = db.prepare(`
      INSERT INTO combo_items (combo_id, product_id, custom_label)
      VALUES (?, ?, ?)
    `);
    for (const item of items) {
      if (typeof item === 'string') {
        insertItem.run(id, null, item);
      } else if (typeof item === 'object') {
        insertItem.run(id, item.product_id || null, item.custom_label || item.name || '');
      }
    }
  }

  res.json({ success: true, message: 'Combo updated' });
});

// DELETE /api/combos/:id
router.delete('/:id', requireAdmin, (req: Request, res: Response): void => {
  const { id } = req.params;
  db.prepare('DELETE FROM combo_items WHERE combo_id = ?').run(id);
  db.prepare('DELETE FROM combos WHERE id = ?').run(id);
  res.json({ success: true, message: 'Combo deleted' });
});

export default router;
