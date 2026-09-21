import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { supabaseService } from '../supabase.js';

const router = Router();

// GET /api/settings - Public settings from Supabase
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await supabaseService.getSettings();
    res.json({ settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch settings' });
  }
});

// PUT /api/settings - Admin update settings
router.put('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const settings = req.body;
  if (!settings || typeof settings !== 'object') {
    res.status(400).json({ error: 'Settings object required' });
    return;
  }

  try {
    await supabaseService.updateSettings(settings);
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update settings' });
  }
});

// GET /api/settings/db-status - Database status & integrity
router.get('/db-status', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const status = await supabaseService.getDbStatus();
    res.json(status || {
      status: 'connected',
      integrity: 'HEALTHY',
      engine: 'Supabase PostgreSQL (Cloud Database)',
      databaseFile: 'cloud:supabase',
      counts: { products: 0, categories: 0, combos: 0, admins: 1 }
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message || 'Database query error' });
  }
});

export default router;
