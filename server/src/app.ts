import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { isSupabaseConfigured } from './supabase.js';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import comboRoutes from './routes/combos.js';
import settingsRoutes from './routes/settings.js';
import uploadRoutes from './routes/upload.js';
import importRoutes from './routes/import.js';
import enquiryRoutes from './routes/enquiries.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!isSupabaseConfigured()) {
  console.warn('⚠️  WARNING: Supabase is not configured! Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
} else {
  console.log('✅ Supabase PostgreSQL Database Connected');
}

export const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory (supports /tmp/uploads on Vercel)
const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const uploadDir = isVercel ? '/tmp/uploads' : path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (e) {
    // Ignore in read-only environment
  }
}
app.use('/uploads', express.static(uploadDir));
app.use('/api/uploads', express.static(uploadDir));

// Health check endpoints
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'PC Part Hub Backend API',
    platform: isVercel ? 'vercel-serverless' : 'node-server',
    time: new Date()
  });
});

// Mount routes with both '/api/' prefix and root '/' prefix for robust Vercel rewrite handling
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/products', productRoutes);
app.use('/products', productRoutes);

app.use('/api/categories', categoryRoutes);
app.use('/categories', categoryRoutes);

app.use('/api/combos', comboRoutes);
app.use('/combos', comboRoutes);

app.use('/api/settings', settingsRoutes);
app.use('/settings', settingsRoutes);

app.use('/api/upload', uploadRoutes);
app.use('/upload', uploadRoutes);

app.use('/api/import', importRoutes);
app.use('/import', importRoutes);

app.use('/api/enquiries', enquiryRoutes);
app.use('/enquiries', enquiryRoutes);

// Serve frontend in local node production if client/dist exists
const clientDist = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(clientDist, 'index.html'));
    }
  });
}

export default app;
