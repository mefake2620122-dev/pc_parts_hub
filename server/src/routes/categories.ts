import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { supabaseService } from '../supabase.js';

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
    const categories = await supabaseService.getCategories();
    res.json({ categories: categories || [] });
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
    const cat = await supabaseService.createCategory({
      name: name.trim(),
      slug,
      icon,
      description,
      sort_order: Number(sort_order) || 0,
      image
    });

    res.status(201).json({ category: cat });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create category' });
  }
});

// PUT /api/categories/:id
router.put('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const numId = parseInt(id, 10);
  const { name, icon, description, sort_order, image } = req.body;

  const updateData: any = {};
  if (name !== undefined) {
    updateData.name = name.trim();
    updateData.slug = slugify(name);
  }
  if (icon !== undefined) updateData.icon = icon;
  if (description !== undefined) updateData.description = description;
  if (sort_order !== undefined) updateData.sort_order = Number(sort_order) || 0;
  if (image !== undefined) updateData.image = image;

  try {
    const cat = await supabaseService.updateCategory(numId, updateData);
    res.json({ category: cat });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update category' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const numId = parseInt(id, 10);

  try {
    const result = await supabaseService.deleteCategory(numId);
    if (!result.success) {
      res.status(400).json({ error: 'Failed to delete category' });
      return;
    }
    res.json({ success: true, message: 'Category deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete category' });
  }
});

export default router;
