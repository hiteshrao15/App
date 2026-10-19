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

const storage = multer.diskStorage({
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
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP allowed.'));
    }
  },
});

router.post('/:category', (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return next(new AppError(400, 'UPLOAD_ERROR', err.message));
    }
    if (err) {
      return next(new AppError(400, 'UPLOAD_ERROR', err.message));
    }
    if (!req.file) {
      return next(new AppError(400, 'NO_FILE', 'No file uploaded'));
    }

    const fileUrl = `/uploads/${req.params.category}/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename });
  });
});

export default router;
