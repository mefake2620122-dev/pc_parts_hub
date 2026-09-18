import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// POST /api/enquiries - Track WhatsApp / Call click
router.post('/', (req: Request, res: Response): void => {
  const { product_id, product_name, type } = req.body;
  const ip = req.ip || req.socket.remoteAddress || '';

  if (!type || !['WHATSAPP', 'CALL'].includes(type)) {
    res.status(400).json({ error: 'Valid type (WHATSAPP or CALL) required' });
    return;
  }

  db.prepare(`
    INSERT INTO enquiries (product_id, product_name, type, ip_hash)
    VALUES (?, ?, ?, ?)
  `).run(product_id || null, product_name || '', type, ip.slice(0, 16));

  res.json({ success: true });
});

// GET /api/admin/dashboard - High-level metrics
router.get('/dashboard', requireAdmin, (req: Request, res: Response): void => {
  const totalProducts = (db.prepare('SELECT COUNT(*) as count FROM products').get() as any).count;
  const inStock = (db.prepare("SELECT COUNT(*) as count FROM products WHERE stock_status = 'IN_STOCK'").get() as any).count;
  const lowStock = (db.prepare("SELECT COUNT(*) as count FROM products WHERE stock_status = 'LOW_STOCK'").get() as any).count;
  const soldOut = (db.prepare("SELECT COUNT(*) as count FROM products WHERE stock_status = 'SOLD_OUT'").get() as any).count;
  const categoriesCount = (db.prepare('SELECT COUNT(*) as count FROM categories').get() as any).count;
  const combosCount = (db.prepare('SELECT COUNT(*) as count FROM combos').get() as any).count;
  const whatsappClicks = (db.prepare("SELECT COUNT(*) as count FROM enquiries WHERE type = 'WHATSAPP'").get() as any).count;
  const callClicks = (db.prepare("SELECT COUNT(*) as count FROM enquiries WHERE type = 'CALL'").get() as any).count;

  const recentProducts = db.prepare(`
    SELECT p.id, p.product_code, p.name, p.price, p.stock_status, p.condition, c.name as category_name
    FROM products p
    JOIN categories c ON p.category_id = c.id
    ORDER BY p.id DESC
    LIMIT 6
  `).all();

  const recentEnquiries = db.prepare(`
    SELECT e.*, p.slug as product_slug
    FROM enquiries e
    LEFT JOIN products p ON e.product_id = p.id
    ORDER BY e.id DESC
    LIMIT 8
  `).all();

  res.json({
    metrics: {
      totalProducts,
      inStock,
      lowStock,
      soldOut,
      categoriesCount,
      combosCount,
      whatsappClicks,
      callClicks
    },
    recentProducts,
    recentEnquiries
  });
});

export default router;
