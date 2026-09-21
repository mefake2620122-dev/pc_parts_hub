import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { requireAdmin } from '../middleware/auth.js';
import { isSupabaseConfigured, supabaseService } from '../supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const uploadDir = isVercel ? '/tmp/uploads' : path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch {
    // Ignore in read-only environment
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
      } catch {}
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `part-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    if (allowed.test(ext) && allowed.test(mime)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WEBP, GIF) are allowed'));
    }
  }
});

const router = Router();

// POST /api/upload - Single or Multiple Image Upload
router.post('/', requireAdmin, upload.array('images', 10), async (req: Request, res: Response): Promise<void> => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'No files uploaded' });
    return;
  }

  const urls: string[] = [];

  for (const f of files) {
    let uploadedUrl: string | null = null;

    // 1. If Supabase is configured, upload directly to Supabase Storage bucket 'pc-parts-images'
    if (isSupabaseConfigured() && f.path && fs.existsSync(f.path)) {
      try {
        const fileBuffer = fs.readFileSync(f.path);
        uploadedUrl = await supabaseService.uploadImage(f.filename, fileBuffer, f.mimetype);
      } catch (err) {
        console.warn('Supabase image upload failed, falling back to local/data URL:', err);
      }
    }

    if (uploadedUrl) {
      urls.push(uploadedUrl);
      continue;
    }

    // 2. On Vercel, Base64 data URL ensures zero loss across serverless container restarts if Supabase storage is not ready
    if (isVercel && f.path && fs.existsSync(f.path)) {
      try {
        const fileData = fs.readFileSync(f.path);
        const base64 = fileData.toString('base64');
        urls.push(`data:${f.mimetype};base64,${base64}`);
        continue;
      } catch {
        urls.push(`/uploads/${f.filename}`);
        continue;
      }
    }

    // 3. Local disk fallback
    urls.push(`/uploads/${f.filename}`);
  }

  res.json({
    success: true,
    urls,
    count: urls.length
  });
});

export default router;
