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

// GET /api/combos - Public combo listings
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const combos = await supabaseService.getCombos();
    res.json({ combos: combos || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch combos' });
  }
});

// GET /api/combos/:identifier
router.get('/:identifier', async (req: Request, res: Response): Promise<void> => {
  const { identifier } = req.params;

  try {
    const combo = await supabaseService.getCombo(identifier);
    if (combo) {
      res.json({ combo });
      return;
    }
    res.status(404).json({ error: 'Combo not found' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch combo' });
  }
});

// ADMIN ROUTES

// POST /api/combos
router.post('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const {
    name,
    tagline = '',
    description = '',
    original_price,
    combo_price,
    savings_text = '',
    image = '',
    badge = '',
    is_featured = false,
    items = []
  } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Combo name is required' });
    return;
  }
  if (!combo_price || isNaN(Number(combo_price))) {
    res.status(400).json({ error: 'Valid combo price is required' });
    return;
  }

  const slug = `${slugify(name)}-${Date.now().toString().slice(-4)}`;

  try {
    const created = await supabaseService.createCombo({
      name: name.trim(),
      slug,
      tagline: tagline.trim(),
      description: description.trim(),
      original_price: original_price ? Number(original_price) : Number(combo_price),
      combo_price: Number(combo_price),
      savings_text: savings_text.trim(),
      image: image.trim(),
      badge: badge.trim(),
      is_featured: is_featured ? 1 : 0
    }, items);

    res.status(201).json({ combo: created });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create combo' });
  }
});

// PUT /api/combos/:id
router.put('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const numId = parseInt(id, 10);
  const {
    name,
    tagline,
    description,
    original_price,
    combo_price,
    savings_text,
    image,
    badge,
    is_featured,
    items
  } = req.body;

  const updateData: any = {};
  if (name !== undefined) updateData.name = name.trim();
  if (tagline !== undefined) updateData.tagline = tagline.trim();
  if (description !== undefined) updateData.description = description.trim();
  if (original_price !== undefined) updateData.original_price = Number(original_price);
  if (combo_price !== undefined) updateData.combo_price = Number(combo_price);
  if (savings_text !== undefined) updateData.savings_text = savings_text.trim();
  if (image !== undefined) updateData.image = image.trim();
  if (badge !== undefined) updateData.badge = badge.trim();
  if (is_featured !== undefined) updateData.is_featured = is_featured ? 1 : 0;

  try {
    const updated = await supabaseService.updateCombo(numId, updateData, items);
    res.json({ combo: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update combo' });
  }
});

// DELETE /api/combos/:id
router.delete('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const numId = parseInt(id, 10);

  try {
    await supabaseService.deleteCombo(numId);
    res.json({ success: true, message: 'Combo deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete combo' });
  }
});

export default router;
