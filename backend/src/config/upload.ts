import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

const uploadDir = path.join(__dirname, '../../uploads/logos');

// Ensure the directory exists (it's created at repo-setup time via
// .gitkeep, but this guards against a fresh clone where uploads/ was
// removed by .gitignore rules).
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `logo-${Date.now()}${ext}`);
  },
});

// Mimetype alone is client-supplied and trivially spoofable — a request
// can claim "image/png" for any file. Requiring the file extension to
// independently agree with the claimed mimetype closes the easy case of
// slipping an executable/script past this filter under a fake
// Content-Type.
const allowedTypes: Record<string, string[]> = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
  'image/svg+xml': ['.svg'],
};

// Thrown from fileFilter, which runs before postLogo's own try/catch —
// caught by name in errorHandler.middleware.ts so a rejected upload
// still gets a clean 400 instead of falling through to a generic 500.
export class InvalidFileTypeError extends Error {
  constructor() {
    super('Only PNG, JPEG, WEBP or SVG images are allowed for the logo.');
    this.name = 'InvalidFileTypeError';
  }
}

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = allowedTypes[file.mimetype];

  if (allowedExtensions && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new InvalidFileTypeError());
  }
};

export const logoUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});
