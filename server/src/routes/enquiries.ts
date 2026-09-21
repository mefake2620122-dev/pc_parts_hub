import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { supabaseService } from '../supabase.js';

const router = Router();

// POST /api/enquiries - Track WhatsApp / Call click
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { product_id, product_name, type } = req.body;
  const ip = req.ip || req.socket.remoteAddress || '';

  if (!type || !['WHATSAPP', 'CALL'].includes(type)) {
    res.status(400).json({ error: 'Valid type (WHATSAPP or CALL) required' });
    return;
  }

  try {
    await supabaseService.trackEnquiry(product_id || null, product_name || '', type, ip.slice(0, 16));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to track enquiry' });
  }
});

// GET /api/admin/dashboard - High-level metrics from Supabase
router.get('/dashboard', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const dashboard = await supabaseService.getDashboardMetrics();
    res.json(dashboard || {
      counts: { totalProducts: 0, inStock: 0, lowStock: 0, soldOut: 0, categoriesCount: 0, combosCount: 0, whatsappClicks: 0, callClicks: 0 },
      recentProducts: [],
      recentEnquiries: []
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch dashboard metrics' });
  }
});

export default router;
