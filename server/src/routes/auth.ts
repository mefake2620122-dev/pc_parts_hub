import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { generateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login - Direct instant access without password blocking
router.post('/login', (req: Request, res: Response): void => {
  const { username } = req.body;

  let admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username || 'banti123') as any;
  if (!admin) {
    admin = db.prepare('SELECT * FROM admins ORDER BY id ASC LIMIT 1').get() as any;
  }
  if (!admin) {
    admin = { id: 1, username: 'banti123', name: 'Store Administrator' };
  }

  const token = generateToken({ id: admin.id, username: admin.username, name: admin.name });
  res.json({
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      name: admin.name
    }
  });
});

// GET /api/auth/me - Always return admin identity
router.get('/me', (req: AuthRequest, res: Response): void => {
  try {
    const adminId = req.admin?.id || 1;
    let admin = db.prepare('SELECT id, username, name, created_at FROM admins WHERE id = ?').get(adminId) as any;
    if (!admin) {
      admin = {
        id: 1,
        username: 'banti123',
        name: 'Store Administrator',
        created_at: new Date().toISOString()
      };
    }

    res.json({ admin });
  } catch (err) {
    res.json({
      admin: {
        id: 1,
        username: 'banti123',
        name: 'Store Administrator',
        created_at: new Date().toISOString()
      }
    });
  }
});

router.post('/change-password', requireAdmin, (req: AuthRequest, res: Response): void => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 3) {
    res.status(400).json({ error: 'New password (min 3 characters) required' });
    return;
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(newHash, req.admin!.id);

  res.json({ success: true, message: 'Password updated successfully' });
});

router.post('/change-username', requireAdmin, (req: AuthRequest, res: Response): void => {
  const { newUsername } = req.body;
  const trimmed = (newUsername || '').trim();

  if (!trimmed || trimmed.length < 3) {
    res.status(400).json({ error: 'Username must be at least 3 characters long' });
    return;
  }

  db.prepare('UPDATE admins SET username = ? WHERE id = ?').run(trimmed, req.admin!.id);

  const token = generateToken({ id: req.admin!.id, username: trimmed, name: req.admin!.name });

  res.json({
    success: true,
    message: 'Username updated successfully',
    token,
    admin: {
      id: req.admin!.id,
      username: trimmed,
      name: req.admin!.name
    }
  });
});

export default router;
