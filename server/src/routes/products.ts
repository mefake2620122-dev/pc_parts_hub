import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { supabaseService, getSupabase } from '../supabase.js';

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

// Generate next product code via Supabase
async function generateProductCode(categorySlug: string): Promise<string> {
  const prefix = (categorySlug.slice(0, 3) || 'PRD').toUpperCase();
  const client = getSupabase();
  if (client) {
    try {
      const { data } = await client
        .from('products')
        .select('product_code')
        .like('product_code', `${prefix}-%`)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) return `${prefix}-001`;
      const match = data.product_code?.match(/-(\d+)$/);
      if (match) {
        const nextNum = parseInt(match[1], 10) + 1;
        return `${prefix}-${String(nextNum).padStart(3, '0')}`;
      }
    } catch {}
  }
  return `${prefix}-${Date.now().toString().slice(-4)}`;
}

// GET /api/products - Advanced filter, search, sort, pagination
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const {
    category,
    brand,
    condition,
    min_price,
    max_price,
    stock,
    search,
    sort,
    page = '1',
    limit = '12',
    featured,
    new_arrival
  } = req.query;

  try {
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 12));

    const result = await supabaseService.getProducts({
      category: category as string,
      brand: brand as string,
      condition: condition as string,
      min_price: min_price ? Number(min_price) : undefined,
      max_price: max_price ? Number(max_price) : undefined,
      stock_status: stock as string,
      q: search as string,
      sort: sort as string,
      page: pageNum,
      limit: limitNum,
      featured: featured !== undefined ? featured === 'true' || featured === '1' : undefined,
      new_arrival: new_arrival !== undefined ? new_arrival === 'true' || new_arrival === '1' : undefined
    });

    const totalPages = Math.ceil(result.count / limitNum);

    res.json({
      products: result.products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: result.count,
        pages: totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch products' });
  }
});

// GET /api/products/filters - Dynamic brand, condition, and price ranges
router.get('/filters', async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = await supabaseService.getFilters();
    res.json(filters);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch filter options' });
  }
});

// GET /api/products/:identifier - Slug or numeric ID detail
router.get('/:identifier', async (req: Request, res: Response): Promise<void> => {
  const { identifier } = req.params;

  try {
    const product = await supabaseService.getProduct(identifier);
    if (product) {
      res.json({ product });
      return;
    }
    res.status(404).json({ error: 'Product not found' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch product details' });
  }
});

// ADMIN PRODUCT MANAGEMENT ROUTES

// POST /api/products - Create new product
router.post('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const {
    name,
    category_id,
    brand = 'Generic',
    model = '',
    price,
    condition = 'Excellent',
    stock_status = 'IN_STOCK',
    quantity = 1,
    description = '',
    specifications = {},
    images = [],
    is_featured = false,
    is_new_arrival = true,
    benchmark_score = '',
    warranty_info = '7 Days Testing Warranty',
    custom_badge = ''
  } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Product name is required' });
    return;
  }
  if (!category_id) {
    res.status(400).json({ error: 'Category is required' });
    return;
  }
  if (price === undefined || isNaN(Number(price))) {
    res.status(400).json({ error: 'Valid price is required' });
    return;
  }

  const client = getSupabase();
  if (!client) {
    res.status(500).json({ error: 'Supabase client is not available' });
    return;
  }

  const { data: category } = await client
    .from('categories')
    .select('name, slug')
    .eq('id', category_id)
    .maybeSingle();

  const product_code = await generateProductCode(category?.slug || 'PRD');

  let baseSlug = slugify(name);
  let finalSlug = baseSlug;
  let counter = 1;
  while (true) {
    const { data: existing } = await client
      .from('products')
      .select('id')
      .eq('slug', finalSlug)
      .maybeSingle();

    if (!existing) break;
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  try {
    const created = await supabaseService.createProduct({
      product_code,
      name: name.trim(),
      slug: finalSlug,
      category_id: Number(category_id),
      brand: brand.trim(),
      model: model.trim(),
      price: Number(price),
      condition,
      stock_status,
      quantity: Number(quantity) || 1,
      description: description.trim(),
      specifications: typeof specifications === 'object' ? specifications : {},
      is_featured: is_featured ? 1 : 0,
      is_new_arrival: is_new_arrival ? 1 : 0,
      benchmark_score: benchmark_score.trim(),
      warranty_info: warranty_info.trim(),
      custom_badge: custom_badge.trim()
    }, images);

    res.status(201).json({ product: created });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create product' });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const numId = parseInt(id, 10);

  const {
    name,
    category_id,
    brand,
    model,
    price,
    condition,
    stock_status,
    quantity,
    description,
    specifications,
    images,
    is_featured,
    is_new_arrival,
    benchmark_score,
    warranty_info,
    custom_badge
  } = req.body;

  const updateData: any = {};
  if (name !== undefined) updateData.name = name.trim();
  if (category_id !== undefined) updateData.category_id = Number(category_id);
  if (brand !== undefined) updateData.brand = brand.trim();
  if (model !== undefined) updateData.model = model.trim();
  if (price !== undefined) updateData.price = Number(price);
  if (condition !== undefined) updateData.condition = condition;
  if (stock_status !== undefined) updateData.stock_status = stock_status;
  if (quantity !== undefined) updateData.quantity = Number(quantity);
  if (description !== undefined) updateData.description = description.trim();
  if (specifications !== undefined) {
    updateData.specifications = typeof specifications === 'object' ? specifications : {};
  }
  if (is_featured !== undefined) updateData.is_featured = is_featured ? 1 : 0;
  if (is_new_arrival !== undefined) updateData.is_new_arrival = is_new_arrival ? 1 : 0;
  if (benchmark_score !== undefined) updateData.benchmark_score = benchmark_score.trim();
  if (warranty_info !== undefined) updateData.warranty_info = warranty_info.trim();
  if (custom_badge !== undefined) updateData.custom_badge = custom_badge.trim();

  try {
    const updated = await supabaseService.updateProduct(numId, updateData, images);
    res.json({ product: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update product' });
  }
});

// PATCH /api/products/:id/stock - Quick toggle stock status
router.patch('/:id/stock', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const numId = parseInt(id, 10);
  const { stock_status } = req.body;

  if (!stock_status || !['IN_STOCK', 'LOW_STOCK', 'SOLD_OUT'].includes(stock_status)) {
    res.status(400).json({ error: 'Valid stock_status (IN_STOCK, LOW_STOCK, SOLD_OUT) required' });
    return;
  }

  try {
    await supabaseService.updateStock(numId, stock_status);
    res.json({ success: true, message: 'Stock status updated' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update stock status' });
  }
});

// POST /api/products/:id/duplicate - Duplicate product
router.post('/:id/duplicate', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const numId = parseInt(id, 10);

  try {
    const original = await supabaseService.getProduct(numId);
    if (!original) {
      res.status(404).json({ error: 'Product to duplicate not found' });
      return;
    }

    const dupName = `${original.name} (Copy)`;
    const newCode = await generateProductCode(original.category_slug || 'PRD');
    const newSlug = `${slugify(dupName)}-${Date.now().toString().slice(-4)}`;

    const imagesToCopy = (original.product_images || []).map((img: any) => ({
      image_url: img.image_url,
      is_primary: img.is_primary ? 1 : 0
    }));

    const created = await supabaseService.createProduct({
      product_code: newCode,
      name: dupName,
      slug: newSlug,
      category_id: original.category_id,
      brand: original.brand,
      model: original.model,
      price: original.price,
      condition: original.condition,
      stock_status: original.stock_status,
      quantity: original.quantity,
      description: original.description,
      specifications: original.specifications || {},
      is_featured: 0,
      is_new_arrival: 1,
      benchmark_score: original.benchmark_score || '',
      warranty_info: original.warranty_info || '',
      custom_badge: original.custom_badge || ''
    }, imagesToCopy);

    res.status(201).json({ product: created });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to duplicate product' });
  }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const numId = parseInt(id, 10);

  try {
    await supabaseService.deleteProduct(numId);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete product' });
  }
});

export default router;
