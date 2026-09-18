import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { generateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.post('/login', (req: Request, res: Response): void => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username) as {
    id: number;
    username: string;
    password_hash: string;
    name: string;
  } | undefined;

  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
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

router.get('/me', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const admin = db.prepare('SELECT id, username, name, created_at FROM admins WHERE id = ?').get(req.admin!.id) as {
      id: number;
      username: string;
      name: string;
      created_at: string;
    } | undefined;

    if (!admin) {
      res.status(404).json({ error: 'Admin account not found' });
      return;
    }

    res.json({
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        created_at: admin.created_at
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin profile' });
  }
});

router.post('/change-password', requireAdmin, (req: AuthRequest, res: Response): void => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'Valid current password and new password (min 6 characters) required' });
    return;
  }

  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin!.id) as {
    id: number;
    password_hash: string;
  };

  if (!bcrypt.compareSync(currentPassword, admin.password_hash)) {
    res.status(400).json({ error: 'Incorrect current password' });
    return;
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(newHash, req.admin!.id);

  res.json({ success: true, message: 'Password updated successfully' });
});

router.post('/change-username', requireAdmin, (req: AuthRequest, res: Response): void => {
  const { newUsername, currentPassword } = req.body;
  const trimmed = (newUsername || '').trim();

  if (!trimmed || trimmed.length < 3) {
    res.status(400).json({ error: 'Username must be at least 3 characters long' });
    return;
  }

  if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
    res.status(400).json({ error: 'Username can only contain letters, numbers, dots, hyphens, and underscores' });
    return;
  }

  if (!currentPassword) {
    res.status(400).json({ error: 'Current password is required to change username' });
    return;
  }

  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin!.id) as {
    id: number;
    username: string;
    password_hash: string;
    name: string;
  } | undefined;

  if (!admin) {
    res.status(404).json({ error: 'Admin account not found' });
    return;
  }

  if (!bcrypt.compareSync(currentPassword, admin.password_hash)) {
    res.status(400).json({ error: 'Incorrect current password' });
    return;
  }

  const existing = db.prepare('SELECT id FROM admins WHERE username = ? AND id != ?').get(trimmed, admin.id);
  if (existing) {
    res.status(400).json({ error: 'This username is already in use' });
    return;
  }

  db.prepare('UPDATE admins SET username = ? WHERE id = ?').run(trimmed, admin.id);

  const token = generateToken({ id: admin.id, username: trimmed, name: admin.name });

  res.json({
    success: true,
    message: 'Username updated successfully',
    token,
    admin: {
      id: admin.id,
      username: trimmed,
      name: admin.name
    }
  });
});

export default router;
