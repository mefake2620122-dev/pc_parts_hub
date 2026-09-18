import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/settings - Public settings
router.get('/', (req: Request, res: Response): void => {
  const rows = db.prepare('SELECT key, value FROM site_settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  res.json({ settings });
});

// PUT /api/settings - Admin update settings
router.put('/', requireAdmin, (req: Request, res: Response): void => {
  const settings = req.body;
  if (!settings || typeof settings !== 'object') {
    res.status(400).json({ error: 'Settings object required' });
    return;
  }

  const upsert = db.prepare(`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `);

  const runTransaction = db.transaction((entries: [string, any][]) => {
    for (const [key, val] of entries) {
      if (typeof val === 'string' || typeof val === 'number') {
        upsert.run(key, String(val));
      }
    }
  });

  runTransaction(Object.entries(settings));
  res.json({ success: true, message: 'Settings updated successfully' });
});

// GET /api/settings/db-status - Database status & integrity
router.get('/db-status', requireAdmin, (req: Request, res: Response): void => {
  try {
    const integrityResult = db.pragma('integrity_check') as { integrity_check: string }[];
    const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
    const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
    const comboCount = db.prepare('SELECT COUNT(*) as count FROM combos').get() as { count: number };
    const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get() as { count: number };
    const adminRecord = db.prepare('SELECT id, username, name FROM admins ORDER BY id ASC LIMIT 1').get() as {
      id: number;
      username: string;
      name: string;
    } | undefined;

    res.json({
      status: 'connected',
      integrity: integrityResult[0]?.integrity_check === 'ok' ? 'HEALTHY' : 'CHECK_NEEDED',
      journalMode: 'WAL',
      engine: 'SQLite 3 (better-sqlite3)',
      databaseFile: 'server/data/pc_parts_hub.sqlite',
      counts: {
        products: productCount.count,
        categories: categoryCount.count,
        combos: comboCount.count,
        admins: adminCount.count
      },
      currentAdmin: adminRecord ? { id: adminRecord.id, username: adminRecord.username, name: adminRecord.name } : null
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message || 'Database query error' });
  }
});

export default router;
