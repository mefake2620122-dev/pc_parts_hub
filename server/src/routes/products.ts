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

// Generate next product code based on category
function generateProductCode(categorySlug: string): string {
  const prefix = (categorySlug.slice(0, 3) || 'PRD').toUpperCase();
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
  return `${prefix}-${Date.now().toString().slice(-4)}`;
}

// GET /api/products (Public Listing with search & multi-filter)
router.get('/', (req: Request, res: Response): void => {
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

  let query = `
    SELECT p.*, c.name as category_name, c.slug as category_slug,
           (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (q && typeof q === 'string' && q.trim()) {
    query += ` AND (
      p.name LIKE ? OR p.brand LIKE ? OR p.model LIKE ? OR
      p.product_code LIKE ? OR p.description LIKE ? OR p.specifications LIKE ?
    )`;
    const searchPattern = `%${q.trim()}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
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

  // Also parse specs and attach image fallback
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
});

// GET /api/products/filters - Available filter options based on current stock
router.get('/filters', (req: Request, res: Response): void => {
  const brands = db.prepare("SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL AND brand != '' ORDER BY brand ASC").all().map((r: any) => r.brand);
  const conditions = db.prepare('SELECT DISTINCT condition FROM products WHERE condition IS NOT NULL ORDER BY condition ASC').all().map((r: any) => r.condition);
  const priceRange = db.prepare('SELECT MIN(price) as min, MAX(price) as max FROM products').get() as { min: number; max: number };

  res.json({
    brands,
    conditions,
    min_price: priceRange?.min || 0,
    max_price: priceRange?.max || 100000
  });
});

// GET /api/products/:identifier (slug or id)
router.get('/:identifier', (req: Request, res: Response): void => {
  const { identifier } = req.params;

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
});

// ADMIN ROUTES

// POST /api/products (Create Product)
router.post('/', requireAdmin, (req: Request, res: Response): void => {
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

  const cat = db.prepare('SELECT slug FROM categories WHERE id = ?').get(category_id) as { slug: string } | undefined;
  if (!cat) {
    res.status(400).json({ error: 'Invalid category_id' });
    return;
  }

  const code = product_code?.trim() || generateProductCode(cat.slug);
  let baseSlug = slugify(name);
  let finalSlug = baseSlug;
  let counter = 1;
  while (db.prepare('SELECT id FROM products WHERE slug = ?').get(finalSlug)) {
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  const specsJson = typeof specifications === 'string' ? specifications : JSON.stringify(specifications);

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

  // Insert images
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
});

// PUT /api/products/:id (Update Product)
router.put('/:id', requireAdmin, (req: Request, res: Response): void => {
  const { id } = req.params;
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

  // Update images if provided
  if (Array.isArray(images)) {
    db.prepare('DELETE FROM product_images WHERE product_id = ?').run(id);
    const insertImage = db.prepare('INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?)');
    images.forEach((img: string, idx: number) => {
      insertImage.run(id, img, idx === 0 ? 1 : 0, idx);
    });
  }

  res.json({ success: true, message: 'Product updated successfully' });
});

// PATCH /api/products/:id/stock (Quick stock toggle)
router.patch('/:id/stock', requireAdmin, (req: Request, res: Response): void => {
  const { id } = req.params;
  const { stock_status } = req.body;

  if (!['IN_STOCK', 'LOW_STOCK', 'SOLD_OUT'].includes(stock_status)) {
    res.status(400).json({ error: 'Invalid stock status' });
    return;
  }

  db.prepare('UPDATE products SET stock_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(stock_status, id);
  res.json({ success: true, stock_status });
});

// POST /api/products/:id/duplicate (Duplicate product)
router.post('/:id/duplicate', requireAdmin, (req: Request, res: Response): void => {
  const { id } = req.params;
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
});

// DELETE /api/products/:id (Delete product)
router.delete('/:id', requireAdmin, (req: Request, res: Response): void => {
  const { id } = req.params;
  db.prepare('DELETE FROM product_images WHERE product_id = ?').run(id);
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  res.json({ success: true, message: 'Product deleted' });
});

export default router;
