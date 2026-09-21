import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import { isSupabaseConfigured, supabaseService } from '../supabase.js';

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
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    if (isSupabaseConfigured()) {
      const categories = await supabaseService.getCategories();
      if (categories && categories.length > 0) {
        res.json({ categories });
        return;
      }
    }

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
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch categories' });
  }
});

// ADMIN ROUTES

// POST /api/categories
router.post('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { name, icon = 'Box', description = '', sort_order = 0, image = '' } = req.body;
  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Category name is required' });
    return;
  }

  const slug = slugify(name);

  try {
    if (isSupabaseConfigured()) {
      const cat = await supabaseService.createCategory({
        name: name.trim(),
        slug,
        icon,
        description: description.trim(),
        sort_order: Number(sort_order),
        image
      });
      res.status(201).json({ success: true, id: cat.id, slug });
      return;
    }

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
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create category' });
  }
});

// PUT /api/categories/:id
router.put('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const numId = Number(id);
  const { name, icon, description, sort_order, image, is_active } = req.body;

  try {
    if (isSupabaseConfigured()) {
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (icon !== undefined) updateData.icon = icon;
      if (description !== undefined) updateData.description = description;
      if (sort_order !== undefined) updateData.sort_order = Number(sort_order);
      if (image !== undefined) updateData.image = image;
      if (is_active !== undefined) updateData.is_active = Number(is_active);

      await supabaseService.updateCategory(numId, updateData);
      res.json({ success: true, message: 'Category updated' });
      return;
    }

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
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update category' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const numId = Number(id);

  try {
    if (isSupabaseConfigured()) {
      const result = await supabaseService.deleteCategory(numId);
      if (!result.success) {
        if (result.productCount) {
          res.status(400).json({
            error: `Cannot delete category: ${result.productCount} products still belong to this category. Please reassign or delete them first.`
          });
          return;
        }
        res.status(500).json({ error: 'Failed to delete category' });
        return;
      }
      res.json({ success: true, message: 'Category deleted' });
      return;
    }

    const productCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ?').get(id) as { count: number };

    if (productCount.count > 0) {
      res.status(400).json({
        error: `Cannot delete category: ${productCount.count} products still belong to this category. Please reassign or delete them first.`
      });
      return;
    }

    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete category' });
  }
});

export default router;
