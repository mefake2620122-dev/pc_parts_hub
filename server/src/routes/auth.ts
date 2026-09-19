import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { generateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login - Secure Admin Login
router.post('/login', (req: Request, res: Response): void => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const cleanUsername = String(username).trim();
  const cleanPassword = String(password);

  // Check admin record in database
  const admin = db.prepare('SELECT * FROM admins WHERE username = ? COLLATE NOCASE').get(cleanUsername) as {
    id: number;
    username: string;
    password_hash: string;
    name: string;
  } | undefined;

  const envMasterPassword = process.env.ADMIN_PASSWORD;
  const isMasterPasswordMatch = envMasterPassword && cleanPassword === envMasterPassword;

  if (!admin) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  const isPasswordValid = isMasterPasswordMatch || bcrypt.compareSync(cleanPassword, admin.password_hash);

  if (!isPasswordValid) {
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

// GET /api/auth/me - Check current admin session
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

    res.json({ admin });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify session' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', requireAdmin, (req: AuthRequest, res: Response): void => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'Valid current password and new password (min 6 characters) required' });
    return;
  }

  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin!.id) as {
    id: number;
    password_hash: string;
  } | undefined;

  if (!admin) {
    res.status(404).json({ error: 'Admin account not found' });
    return;
  }

  const envMasterPassword = process.env.ADMIN_PASSWORD;
  const isMasterMatch = envMasterPassword && currentPassword === envMasterPassword;
  const isCurrentValid = isMasterMatch || bcrypt.compareSync(currentPassword, admin.password_hash);

  if (!isCurrentValid) {
    res.status(400).json({ error: 'Current password is incorrect' });
    return;
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(newHash, req.admin!.id);

  res.json({ success: true, message: 'Password updated successfully' });
});

// POST /api/auth/change-username
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

  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin!.id) as {
    id: number;
    password_hash: string;
  } | undefined;

  if (!admin) {
    res.status(404).json({ error: 'Admin account not found' });
    return;
  }

  const envMasterPassword = process.env.ADMIN_PASSWORD;
  const isMasterMatch = envMasterPassword && currentPassword === envMasterPassword;
  const isCurrentValid = isMasterMatch || bcrypt.compareSync(currentPassword, admin.password_hash);

  if (!isCurrentValid) {
    res.status(400).json({ error: 'Current password is required to change username' });
    return;
  }

  const existing = db.prepare('SELECT id FROM admins WHERE username = ? AND id != ?').get(trimmed, req.admin!.id);
  if (existing) {
    res.status(400).json({ error: 'This username is already in use' });
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
