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

// Generate next product code based on category
function generateProductCode(categorySlug: string): string {
  const prefix = (categorySlug.slice(0, 3) || 'PRD').toUpperCase();
  try {
    const latest = db
      .prepare('SELECT product_code FROM products WHERE product_code LIKE ? ORDER BY id DESC LIMIT 1')
      .get(`${prefix}-%`) as { product_code: string } | undefined;

    if (!latest) {
      return `${prefix}-001`;
    }
    const match = latest.product_code.match(/-(\d+)$/);
    if (match) {
      const nextNum = parseInt(match[1], 10) + 1;
      return `${prefix}-${String(nextNum).padStart(3, '0')}`;
    }
  } catch {}
  return `${prefix}-${Date.now().toString().slice(-4)}`;
}

// GET /api/products (Public Listing with search & multi-filter)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const {
    q,
    category,
    brand,
    condition,
    stock_status,
    min_price,
    max_price,
    featured,
    new_arrival,
    sort,
    limit = 50,
    page = 1
  } = req.query;

  try {
    if (isSupabaseConfigured()) {
      const result = await supabaseService.getProducts({
        q: typeof q === 'string' ? q : undefined,
        category: typeof category === 'string' ? category : undefined,
        brand: typeof brand === 'string' ? brand : undefined,
        condition: typeof condition === 'string' ? condition : undefined,
        stock_status: typeof stock_status === 'string' ? stock_status : undefined,
        min_price: min_price && !isNaN(Number(min_price)) ? Number(min_price) : undefined,
        max_price: max_price && !isNaN(Number(max_price)) ? Number(max_price) : undefined,
        featured: featured === '1' || featured === 'true',
        new_arrival: new_arrival === '1' || new_arrival === 'true',
        sort: typeof sort === 'string' ? sort : undefined,
        limit: Number(limit),
        page: Number(page)
      });

      if (result && result.products.length > 0) {
        res.json(result);
        return;
      }
    }

    let query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug,
             (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (q && typeof q === 'string' && q.trim()) {
      const tokens = q.trim().split(/\s+/).filter(Boolean);
      for (const token of tokens) {
        query += ` AND (
          p.name LIKE ? OR p.brand LIKE ? OR p.model LIKE ? OR
          p.product_code LIKE ? OR p.description LIKE ? OR p.specifications LIKE ? OR
          c.name LIKE ? OR c.slug LIKE ?
        )`;
        const searchPattern = `%${token}%`;
        params.push(
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern
        );
      }
    }

    if (category && typeof category === 'string' && category !== 'all') {
      query += ` AND c.slug = ?`;
      params.push(category);
    }

    if (brand && typeof brand === 'string' && brand !== 'all') {
      query += ` AND p.brand = ?`;
      params.push(brand);
    }

    if (condition && typeof condition === 'string' && condition !== 'all') {
      query += ` AND p.condition = ?`;
      params.push(condition);
    }

    if (stock_status && typeof stock_status === 'string' && stock_status !== 'all') {
      query += ` AND p.stock_status = ?`;
      params.push(stock_status);
    }

    if (min_price && !isNaN(Number(min_price))) {
      query += ` AND p.price >= ?`;
      params.push(Number(min_price));
    }

    if (max_price && !isNaN(Number(max_price))) {
      query += ` AND p.price <= ?`;
      params.push(Number(max_price));
    }

    if (featured === '1' || featured === 'true') {
      query += ` AND p.is_featured = 1`;
    }

    if (new_arrival === '1' || new_arrival === 'true') {
      query += ` AND p.is_new_arrival = 1`;
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        query += ` ORDER BY p.price ASC`;
        break;
      case 'price_desc':
        query += ` ORDER BY p.price DESC`;
        break;
      case 'name':
        query += ` ORDER BY p.name ASC`;
        break;
      case 'newest':
      default:
        query += ` ORDER BY p.id DESC`;
        break;
    }

    const parsedLimit = Math.max(1, Math.min(100, Number(limit)));
    const parsedPage = Math.max(1, Number(page));
    const offset = (parsedPage - 1) * parsedLimit;

    query += ` LIMIT ? OFFSET ?`;
    params.push(parsedLimit, offset);

    const products = db.prepare(query).all(...params) as any[];

    const enriched = products.map(p => {
      let specs = {};
      try {
        specs = JSON.parse(p.specifications || '{}');
      } catch (e) {}
      return {
        ...p,
        specifications: specs,
        primary_image: p.primary_image || 'https://placehold.co/800x600/12151e/ffffff?text=PC+Part'
      };
    });

    res.json({
      products: enriched,
      page: parsedPage,
      limit: parsedLimit,
      count: enriched.length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch products' });
  }
});

// GET /api/products/filters - Available filter options based on current stock
router.get('/filters', async (req: Request, res: Response): Promise<void> => {
  try {
    if (isSupabaseConfigured()) {
      const filters = await supabaseService.getFilters();
      res.json(filters);
      return;
    }

    const brands = db.prepare("SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL AND brand != '' ORDER BY brand ASC").all().map((r: any) => r.brand);
    const conditions = db.prepare('SELECT DISTINCT condition FROM products WHERE condition IS NOT NULL ORDER BY condition ASC').all().map((r: any) => r.condition);
    const priceRange = db.prepare('SELECT MIN(price) as min, MAX(price) as max FROM products').get() as { min: number; max: number };

    res.json({
      brands,
      conditions,
      min_price: priceRange?.min || 0,
      max_price: priceRange?.max || 100000
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch filters' });
  }
});

// GET /api/products/:identifier (slug or id)
router.get('/:identifier', async (req: Request, res: Response): Promise<void> => {
  const { identifier } = req.params;

  try {
    if (isSupabaseConfigured()) {
      const product = await supabaseService.getProduct(identifier);
      if (product) {
        res.json(product);
        return;
      }
    }

    const product = db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ? OR p.id = ?
      LIMIT 1
    `).get(identifier, isNaN(Number(identifier)) ? -1 : Number(identifier)) as any;

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const images = db.prepare(`
      SELECT id, image_url, is_primary, sort_order
      FROM product_images
      WHERE product_id = ?
      ORDER BY is_primary DESC, sort_order ASC
    `).all(product.id);

    let specs = {};
    try {
      specs = JSON.parse(product.specifications || '{}');
    } catch (e) {}

    res.json({
      ...product,
      specifications: specs,
      images: images.length ? images : [{ id: 0, image_url: 'https://placehold.co/800x600/12151e/ffffff?text=PC+Part', is_primary: 1 }]
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch product' });
  }
});

// ADMIN ROUTES

// POST /api/products (Create Product)
router.post('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const {
    name,
    category_id,
    brand,
    model = '',
    price,
    condition,
    stock_status = 'IN_STOCK',
    quantity = 1,
    description = '',
    specifications = {},
    is_featured = 0,
    is_new_arrival = 1,
    product_code,
    images = []
  } = req.body;

  if (!name || !category_id || price === undefined || !condition) {
    res.status(400).json({ error: 'Name, category_id, price, and condition are required' });
    return;
  }

  let catSlug = 'prd';
  try {
    const cat = db.prepare('SELECT slug FROM categories WHERE id = ?').get(category_id) as { slug: string } | undefined;
    if (cat?.slug) catSlug = cat.slug;
  } catch {}

  const code = product_code?.trim() || generateProductCode(catSlug);
  let baseSlug = slugify(name);
  let finalSlug = baseSlug;

  const specsJson = typeof specifications === 'string' ? specifications : JSON.stringify(specifications);

  try {
    if (isSupabaseConfigured()) {
      const created = await supabaseService.createProduct({
        product_code: code,
        name: name.trim(),
        slug: finalSlug,
        category_id: Number(category_id),
        brand: brand.trim(),
        model: model.trim(),
        price: Number(price),
        condition,
        stock_status,
        quantity: Number(quantity),
        description: description.trim(),
        specifications: typeof specifications === 'object' ? specifications : JSON.parse(specsJson || '{}'),
        is_featured: is_featured ? 1 : 0,
        is_new_arrival: is_new_arrival ? 1 : 0
      }, Array.isArray(images) ? images : []);

      res.status(201).json({
        success: true,
        id: created.id,
        slug: created.slug,
        product_code: code
      });
      return;
    }

    let counter = 1;
    while (db.prepare('SELECT id FROM products WHERE slug = ?').get(finalSlug)) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const insertStmt = db.prepare(`
      INSERT INTO products (
        product_code, name, slug, category_id, brand, model, price,
        condition, stock_status, quantity, description, specifications,
        is_featured, is_new_arrival, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const result = insertStmt.run(
      code,
      name.trim(),
      finalSlug,
      category_id,
      brand.trim(),
      model.trim(),
      Number(price),
      condition,
      stock_status,
      Number(quantity),
      description.trim(),
      specsJson,
      is_featured ? 1 : 0,
      is_new_arrival ? 1 : 0
    );

    const newProductId = result.lastInsertRowid;

    const insertImage = db.prepare('INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?)');
    if (Array.isArray(images) && images.length > 0) {
      images.forEach((img: string, idx: number) => {
        insertImage.run(newProductId, img, idx === 0 ? 1 : 0, idx);
      });
    }

    res.status(201).json({
      success: true,
      id: newProductId,
      slug: finalSlug,
      product_code: code
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create product' });
  }
});

// PUT /api/products/:id (Update Product)
router.put('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const numId = Number(id);
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
    is_featured,
    is_new_arrival,
    product_code,
    images
  } = req.body;

  try {
    if (isSupabaseConfigured()) {
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (category_id !== undefined) updateData.category_id = Number(category_id);
      if (brand !== undefined) updateData.brand = brand;
      if (model !== undefined) updateData.model = model;
      if (price !== undefined) updateData.price = Number(price);
      if (condition !== undefined) updateData.condition = condition;
      if (stock_status !== undefined) updateData.stock_status = stock_status;
      if (quantity !== undefined) updateData.quantity = Number(quantity);
      if (description !== undefined) updateData.description = description;
      if (specifications !== undefined) {
        updateData.specifications = typeof specifications === 'string' ? JSON.parse(specifications || '{}') : specifications;
      }
      if (is_featured !== undefined) updateData.is_featured = is_featured ? 1 : 0;
      if (is_new_arrival !== undefined) updateData.is_new_arrival = is_new_arrival ? 1 : 0;
      if (product_code !== undefined) updateData.product_code = product_code;

      await supabaseService.updateProduct(numId, updateData, images);
      res.json({ success: true, message: 'Product updated successfully' });
      return;
    }

    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
    if (!existing) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const specsJson = typeof specifications === 'string' ? specifications : JSON.stringify(specifications || {});

    db.prepare(`
      UPDATE products SET
        product_code = COALESCE(?, product_code),
        name = COALESCE(?, name),
        category_id = COALESCE(?, category_id),
        brand = COALESCE(?, brand),
        model = COALESCE(?, model),
        price = COALESCE(?, price),
        condition = COALESCE(?, condition),
        stock_status = COALESCE(?, stock_status),
        quantity = COALESCE(?, quantity),
        description = COALESCE(?, description),
        specifications = ?,
        is_featured = COALESCE(?, is_featured),
        is_new_arrival = COALESCE(?, is_new_arrival),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      product_code,
      name,
      category_id,
      brand,
      model,
      price !== undefined ? Number(price) : null,
      condition,
      stock_status,
      quantity !== undefined ? Number(quantity) : null,
      description,
      specsJson,
      is_featured !== undefined ? (is_featured ? 1 : 0) : null,
      is_new_arrival !== undefined ? (is_new_arrival ? 1 : 0) : null,
      id
    );

    if (Array.isArray(images)) {
      db.prepare('DELETE FROM product_images WHERE product_id = ?').run(id);
      const insertImage = db.prepare('INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?)');
      images.forEach((img: string, idx: number) => {
        insertImage.run(id, img, idx === 0 ? 1 : 0, idx);
      });
    }

    res.json({ success: true, message: 'Product updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update product' });
  }
});

// PATCH /api/products/:id/stock (Quick stock toggle)
router.patch('/:id/stock', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const numId = Number(id);
  const { stock_status } = req.body;

  if (!['IN_STOCK', 'LOW_STOCK', 'SOLD_OUT'].includes(stock_status)) {
    res.status(400).json({ error: 'Invalid stock status' });
    return;
  }

  try {
    if (isSupabaseConfigured()) {
      await supabaseService.updateStock(numId, stock_status);
      res.json({ success: true, stock_status });
      return;
    }

    db.prepare('UPDATE products SET stock_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(stock_status, id);
    res.json({ success: true, stock_status });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update stock status' });
  }
});

// POST /api/products/:id/duplicate (Duplicate product)
router.post('/:id/duplicate', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const numId = Number(id);

  try {
    if (isSupabaseConfigured()) {
      const original = await supabaseService.getProduct(numId);
      if (!original) {
        res.status(404).json({ error: 'Original product not found' });
        return;
      }

      const newCode = `${original.product_code}-COPY`;
      const newName = `${original.name} (Copy)`;
      const newSlug = slugify(`${newName}-${Date.now().toString().slice(-4)}`);

      const created = await supabaseService.createProduct({
        product_code: newCode,
        name: newName,
        slug: newSlug,
        category_id: original.category_id,
        brand: original.brand,
        model: original.model,
        price: original.price,
        condition: original.condition,
        stock_status: 'IN_STOCK',
        quantity: original.quantity,
        description: original.description,
        specifications: original.specifications,
        is_featured: 0,
        is_new_arrival: 1
      }, (original.images || []).map((img: any) => img.image_url));

      res.status(201).json({ success: true, id: created.id, slug: newSlug, product_code: newCode });
      return;
    }

    const original = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;

    if (!original) {
      res.status(404).json({ error: 'Original product not found' });
      return;
    }

    const cat = db.prepare('SELECT slug FROM categories WHERE id = ?').get(original.category_id) as { slug: string };
    const newCode = generateProductCode(cat.slug);
    const newName = `${original.name} (Copy)`;
    let baseSlug = slugify(newName);
    let finalSlug = baseSlug;
    let counter = 1;
    while (db.prepare('SELECT id FROM products WHERE slug = ?').get(finalSlug)) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const result = db.prepare(`
      INSERT INTO products (
        product_code, name, slug, category_id, brand, model, price,
        condition, stock_status, quantity, description, specifications,
        is_featured, is_new_arrival, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, CURRENT_TIMESTAMP)
    `).run(
      newCode,
      newName,
      finalSlug,
      original.category_id,
      original.brand,
      original.model,
      original.price,
      original.condition,
      'IN_STOCK',
      original.quantity,
      original.description,
      original.specifications
    );

    const newId = result.lastInsertRowid;
    const originalImages = db.prepare('SELECT image_url, is_primary, sort_order FROM product_images WHERE product_id = ?').all(id) as any[];
    const insertImage = db.prepare('INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?)');
    for (const img of originalImages) {
      insertImage.run(newId, img.image_url, img.is_primary, img.sort_order);
    }

    res.status(201).json({ success: true, id: newId, slug: finalSlug, product_code: newCode });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to duplicate product' });
  }
});

// DELETE /api/products/:id (Delete product)
router.delete('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const numId = Number(id);

  try {
    if (isSupabaseConfigured()) {
      await supabaseService.deleteProduct(numId);
      res.json({ success: true, message: 'Product deleted' });
      return;
    }

    db.prepare('DELETE FROM product_images WHERE product_id = ?').run(id);
    const result = db.prepare('DELETE FROM products WHERE id = ?').run(id);

    if (result.changes === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ success: true, message: 'Product deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete product' });
  }
});

export default router;
