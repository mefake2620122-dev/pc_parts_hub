import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { getSupabase, supabaseService } from '../supabase.js';

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

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// GET /api/import/sample-csv - Download template
router.get('/sample-csv', requireAdmin, (req: Request, res: Response): void => {
  const sample = `Product Name,Category,Brand,Model,Price,Condition,Stock,Quantity,Description,Image URL
NVIDIA GeForce RTX 3080 10GB,gpu,NVIDIA,Founders Edition,34999,Like New,IN_STOCK,2,Tested with 3DMark Time Spy. Excellent thermals under load.,https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1000&q=80
AMD Ryzen 7 5700X 8-Core,cpu,AMD,Ryzen 7 5700X,13500,Like New,IN_STOCK,3,Clean pins. Tested with Cinebench R23. 65W TDP.,https://images.unsplash.com/photo-1555617981-dac3880eac6e?auto=format&fit=crop&w=1000&q=80
Corsair Vengeance LPX 16GB DDR4,ram,Corsair,LPX Black,2400,Excellent,IN_STOCK,5,Tested with MemTest86 4 passes.,https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=1000&q=80`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="pc-part-hub-import-sample.csv"');
  res.send(sample);
});

// POST /api/import/preview - Validate and preview CSV rows
router.post('/preview', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { csvContent } = req.body;
  if (!csvContent || typeof csvContent !== 'string') {
    res.status(400).json({ error: 'csvContent string is required' });
    return;
  }

  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    res.status(400).json({ error: 'CSV must contain a header row and at least one data row' });
    return;
  }

  const client = getSupabase();
  if (!client) {
    res.status(500).json({ error: 'Supabase is not configured' });
    return;
  }

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const { data: categories } = await client.from('categories').select('id, name, slug');
  const catList = categories || [];

  const catMap = new Map<string, number>();
  catList.forEach(c => {
    catMap.set(c.slug.toLowerCase(), c.id);
    catMap.set(c.name.toLowerCase(), c.id);
    catMap.set(c.slug.split('-')[0].toLowerCase(), c.id);
  });

  const validRows: any[] = [];
  const invalidRows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] || '';
    });

    const name = rowObj['productname'] || rowObj['name'] || values[0] || '';
    const rawCategory = (rowObj['category'] || values[1] || '').toLowerCase().trim();
    const brand = rowObj['brand'] || values[2] || 'Generic';
    const model = rowObj['model'] || values[3] || '';
    const rawPrice = rowObj['price'] || values[4] || '0';
    const condition = rowObj['condition'] || values[5] || 'Excellent';
    const stock = (rowObj['stock'] || rowObj['stockstatus'] || values[6] || 'IN_STOCK').toUpperCase();
    const qty = parseInt(rowObj['quantity'] || rowObj['qty'] || values[7] || '1', 10);
    const description = rowObj['description'] || values[8] || '';
    const imageUrl = rowObj['imageurl'] || rowObj['image'] || values[9] || '';

    const price = parseFloat(rawPrice.replace(/[^0-9.]/g, ''));
    const categoryId = catMap.get(rawCategory) || catList[0]?.id;

    const rowErrors: string[] = [];
    if (!name.trim()) rowErrors.push('Product name is required');
    if (isNaN(price) || price < 0) rowErrors.push('Price must be a valid positive number');

    const normalizedStock = ['IN_STOCK', 'LOW_STOCK', 'SOLD_OUT'].includes(stock) ? stock : 'IN_STOCK';
    const normalizedCondition = ['Like New', 'Excellent', 'Good', 'Fair'].includes(condition) ? condition : 'Excellent';

    if (rowErrors.length > 0) {
      invalidRows.push({
        line: i + 1,
        raw: lines[i],
        errors: rowErrors
      });
    } else {
      validRows.push({
        name: name.trim(),
        category_id: categoryId,
        category_name: catList.find(c => c.id === categoryId)?.name || 'Components',
        brand: brand.trim(),
        model: model.trim(),
        price,
        condition: normalizedCondition,
        stock_status: normalizedStock,
        quantity: isNaN(qty) ? 1 : qty,
        description: description.trim(),
        image_url: imageUrl.trim()
      });
    }
  }

  res.json({
    total: lines.length - 1,
    validCount: validRows.length,
    invalidCount: invalidRows.length,
    validRows,
    invalidRows
  });
});

// POST /api/import/confirm - Batch insert valid rows into Supabase
router.post('/confirm', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    res.status(400).json({ error: 'No rows to import' });
    return;
  }

  const client = getSupabase();
  if (!client) {
    res.status(500).json({ error: 'Supabase client is not available' });
    return;
  }

  let insertedCount = 0;
  for (const r of rows) {
    const code = `IMP-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 900 + 100)}`;
    let baseSlug = slugify(r.name);
    let finalSlug = `${baseSlug}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const { data: prodData, error: prodErr } = await client
      .from('products')
      .insert([{
        product_code: code,
        name: r.name,
        slug: finalSlug,
        category_id: r.category_id,
        brand: r.brand || 'Generic',
        model: r.model || '',
        price: Number(r.price),
        condition: r.condition || 'Excellent',
        stock_status: r.stock_status || 'IN_STOCK',
        quantity: Number(r.quantity) || 1,
        description: r.description || '',
        specifications: {},
        is_featured: 0,
        is_new_arrival: 1
      }])
      .select('id')
      .single();

    if (!prodErr && prodData) {
      if (r.image_url) {
        await client.from('product_images').insert([{
          product_id: prodData.id,
          image_url: r.image_url,
          is_primary: 1,
          sort_order: 0
        }]);
      }
      insertedCount++;
    }
  }

  res.json({ success: true, count: insertedCount });
});

export default router;
