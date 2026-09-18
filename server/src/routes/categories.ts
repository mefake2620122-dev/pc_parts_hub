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

// GET /api/categories - Public listing with live product counts
router.get('/', (req: Request, res: Response): void => {
  const categories = db.prepare(`
    SELECT c.*,
           COUNT(p.id) as total_products,
           SUM(CASE WHEN p.stock_status = 'IN_STOCK' THEN 1 ELSE 0 END) as in_stock_count
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id
    WHERE c.is_active = 1
    GROUP BY c.id
    ORDER BY c.sort_order ASC, c.name ASC
  `).all();

  res.json({ categories });
});

// ADMIN ROUTES

// POST /api/categories
router.post('/', requireAdmin, (req: Request, res: Response): void => {
  const { name, icon = 'Box', description = '', sort_order = 0, image = '' } = req.body;
  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Category name is required' });
    return;
  }

  const slug = slugify(name);
  const existing = db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug);
  if (existing) {
    res.status(400).json({ error: 'Category with this name or slug already exists' });
    return;
  }

  const result = db.prepare(`
    INSERT INTO categories (name, slug, icon, description, sort_order, image)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name.trim(), slug, icon, description.trim(), Number(sort_order), image);

  res.status(201).json({ success: true, id: result.lastInsertRowid, slug });
});

// PUT /api/categories/:id
router.put('/:id', requireAdmin, (req: Request, res: Response): void => {
  const { id } = req.params;
  const { name, icon, description, sort_order, image, is_active } = req.body;

  const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }

  db.prepare(`
    UPDATE categories SET
      name = COALESCE(?, name),
      icon = COALESCE(?, icon),
      description = COALESCE(?, description),
      sort_order = COALESCE(?, sort_order),
      image = COALESCE(?, image),
      is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(name, icon, description, sort_order !== undefined ? Number(sort_order) : null, image, is_active !== undefined ? Number(is_active) : null, id);

  res.json({ success: true, message: 'Category updated' });
});

// DELETE /api/categories/:id
router.delete('/:id', requireAdmin, (req: Request, res: Response): void => {
  const { id } = req.params;
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ?').get(id) as { count: number };

  if (productCount.count > 0) {
    res.status(400).json({
      error: `Cannot delete category: ${productCount.count} products still belong to this category. Please reassign or delete them first.`
    });
    return;
  }

  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  res.json({ success: true, message: 'Category deleted' });
});

export default router;
