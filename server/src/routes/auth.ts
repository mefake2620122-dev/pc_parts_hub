import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { generateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { supabaseService } from '../supabase.js';

const router = Router();

// POST /api/auth/login - Secure Admin Login via Supabase
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const cleanUsername = String(username).trim();
  const cleanPassword = String(password);

  try {
    const admin = await supabaseService.getAdminByUsername(cleanUsername);

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
    const admin = await supabaseService.getAdminById(req.admin!.id);

    if (!admin) {
      res.status(401).json({ error: 'Admin not found or token invalid' });
      return;
    }

    res.json({
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Authentication check failed' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current and new password are required' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters long' });
    return;
  }

  try {
    const admin = await supabaseService.getAdminById(req.admin!.id);

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
    await supabaseService.updateAdminPassword(req.admin!.id, newHash);
    try {
      await supabaseService.deleteOtherAdmins(req.admin!.id);
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

  if (!currentPassword) {
    res.status(400).json({ error: 'Current password is required to verify identity' });
    return;
  }

  try {
    const admin = await supabaseService.getAdminById(req.admin!.id);

    if (!admin) {
      res.status(404).json({ error: 'Admin account not found' });
      return;
    }

    const isCurrentValid = bcrypt.compareSync(currentPassword, admin.password_hash);
    if (!isCurrentValid) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }

    if (admin.username.toLowerCase() === trimmed.toLowerCase()) {
      res.status(400).json({ error: 'New username must be different from current username' });
      return;
    }

    const existing = await supabaseService.getAdminByUsername(trimmed);
    if (existing && existing.id !== req.admin!.id) {
      res.status(400).json({ error: 'This username is already taken' });
      return;
    }

    await supabaseService.updateAdminUsername(req.admin!.id, trimmed);
    try {
      await supabaseService.deleteOtherAdmins(req.admin!.id);
    } catch {}

    const token = generateToken({ id: req.admin!.id, username: trimmed, name: req.admin!.name });

    res.json({
      success: true,
      message: `Admin username updated to "${trimmed}"`,
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
