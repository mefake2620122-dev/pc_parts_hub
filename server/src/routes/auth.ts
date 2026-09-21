import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { generateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { isSupabaseConfigured, supabaseService } from '../supabase.js';

const router = Router();

// POST /api/auth/login - Secure Admin Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const cleanUsername = String(username).trim();
  const cleanPassword = String(password);

  try {
    let admin: { id: number; username: string; password_hash: string; name: string } | null = null;

    if (isSupabaseConfigured()) {
      admin = await supabaseService.getAdminByUsername(cleanUsername);
    }

    if (!admin) {
      admin = db.prepare('SELECT * FROM admins WHERE username = ? COLLATE NOCASE').get(cleanUsername) as any;
    }

    if (!admin) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const isPasswordValid = bcrypt.compareSync(cleanPassword, admin.password_hash);

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
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// GET /api/auth/me - Check current admin session
router.get('/me', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let admin: any = null;
    if (isSupabaseConfigured()) {
      admin = await supabaseService.getAdminById(req.admin!.id);
    }
    if (!admin) {
      admin = db.prepare('SELECT id, username, name, created_at FROM admins WHERE id = ?').get(req.admin!.id);
    }

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
router.post('/change-password', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'Valid current password and new password (min 6 characters) required' });
    return;
  }

  try {
    let admin: any = null;
    if (isSupabaseConfigured()) {
      admin = await supabaseService.getAdminById(req.admin!.id);
    }
    if (!admin) {
      admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin!.id);
    }

    if (!admin) {
      res.status(404).json({ error: 'Admin account not found' });
      return;
    }

    const isCurrentValid = bcrypt.compareSync(currentPassword, admin.password_hash);

    if (!isCurrentValid) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }

    const newHash = bcrypt.hashSync(newPassword, 10);

    if (isSupabaseConfigured()) {
      await supabaseService.updateAdminPassword(req.admin!.id, newHash);
      try {
        await supabaseService.deleteOtherAdmins(req.admin!.id);
      } catch {}
    }
    try {
      db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(newHash, req.admin!.id);
      db.prepare('DELETE FROM admins WHERE id != ?').run(req.admin!.id);
    } catch {}

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update password' });
  }
});

// POST /api/auth/change-username
router.post('/change-username', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
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

  try {
    let admin: any = null;
    if (isSupabaseConfigured()) {
      admin = await supabaseService.getAdminById(req.admin!.id);
    }
    if (!admin) {
      admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin!.id);
    }

    if (!admin) {
      res.status(404).json({ error: 'Admin account not found' });
      return;
    }

    const isCurrentValid = bcrypt.compareSync(currentPassword, admin.password_hash);

    if (!isCurrentValid) {
      res.status(400).json({ error: 'Current password is required to change username' });
      return;
    }

    if (isSupabaseConfigured()) {
      const existing = await supabaseService.getAdminByUsername(trimmed);
      if (existing && existing.id !== req.admin!.id) {
        res.status(400).json({ error: 'This username is already in use' });
        return;
      }
      await supabaseService.updateAdminUsername(req.admin!.id, trimmed);
      try {
        await supabaseService.deleteOtherAdmins(req.admin!.id);
      } catch {}
    }

    try {
      const existingLocal = db.prepare('SELECT id FROM admins WHERE username = ? AND id != ?').get(trimmed, req.admin!.id);
      if (existingLocal) {
        res.status(400).json({ error: 'This username is already in use' });
        return;
      }
      db.prepare('UPDATE admins SET username = ? WHERE id = ?').run(trimmed, req.admin!.id);
      db.prepare('DELETE FROM admins WHERE id != ?').run(req.admin!.id);
    } catch {}

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
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update username' });
  }
});

export default router;
