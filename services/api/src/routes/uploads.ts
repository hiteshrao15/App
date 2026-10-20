// =====================================================
// Uploads Routes — Secure file upload with validation
// =====================================================
import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Ensure upload directories exist
['products', 'stores', 'documents'].forEach(dir => {
  const fullPath = path.join(UPLOAD_DIR, dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
});

const localStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const category = req.params.category || 'products';
    const allowed = ['products', 'stores'];
    const dir = allowed.includes(category) ? category : 'products';
    cb(null, path.join(UPLOAD_DIR, dir));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage: localStorage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP allowed.'));
    }
  },
});

const remoteStorageConfigured = Boolean(
  process.env.SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY &&
  process.env.SUPABASE_STORAGE_BUCKET,
);

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    cb(null, ALLOWED_MIME_TYPES.includes(file.mimetype));
  },
});

async function uploadToSupabase(file: Express.Multer.File, category: string): Promise<string> {
  const baseUrl = process.env.SUPABASE_URL!;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET!;
  const objectPath = `${category}/${uuidv4()}${path.extname(file.originalname).toLowerCase()}`;
  const response = await fetch(
    `${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${objectPath}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        'Content-Type': file.mimetype,
        'x-upsert': 'false',
      },
      body: file.buffer,
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new AppError(502, 'STORAGE_UPLOAD_ERROR', `Supabase Storage upload failed: ${details}`);
  }

  const publicBaseUrl = process.env.SUPABASE_PUBLIC_BASE_URL ||
    `${baseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}`;
  return `${publicBaseUrl}/${objectPath}`;
}

router.post('/:category', (req: Request, res: Response, next: NextFunction) => {
  const uploadMiddleware = remoteStorageConfigured ? memoryUpload : upload;
  uploadMiddleware.single('file')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return next(new AppError(400, 'UPLOAD_ERROR', err.message));
    }
    if (err) {
      return next(new AppError(400, 'UPLOAD_ERROR', err.message));
    }
    if (!req.file) {
      return next(new AppError(400, 'NO_FILE', 'No file uploaded'));
    }

    try {
      if (remoteStorageConfigured) {
        const url = await uploadToSupabase(req.file, req.params.category);
        return res.json({ url, filename: path.basename(new URL(url).pathname) });
      }

      const fileUrl = `/uploads/${req.params.category}/${req.file.filename}`;
      return res.json({ url: fileUrl, filename: req.file.filename });
    } catch (storageError) {
      return next(storageError);
    }
  });
});

export default router;
