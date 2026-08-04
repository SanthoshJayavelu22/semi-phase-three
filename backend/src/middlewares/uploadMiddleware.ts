import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

let storage;

const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  !process.env.CLOUDINARY_CLOUD_NAME.includes('your_cloudinary') &&
  process.env.CLOUDINARY_API_KEY && 
  !process.env.CLOUDINARY_API_KEY.includes('your_cloudinary') &&
  process.env.CLOUDINARY_API_SECRET &&
  !process.env.CLOUDINARY_API_SECRET.includes('your_cloudinary');

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: (req, file) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const base = path
        .basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9_-]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 40) || 'file';
      return {
        folder: 'semi_institutes',
        resource_type: 'auto',
        // NOTE: public_id must NOT include the file extension — Cloudinary
        // appends the format itself. Passing an extension here produces
        // double-extension URLs (e.g. ".../semi_institutes/file.pdf.pdf").
        public_id: `${base}-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      };
    },
  });
  console.log('Using Cloudinary for file uploads.');
} else {
  // Local fallback
  const uploadDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const base = path
        .basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9_-]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 40) || 'file';
      cb(null, `${base}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    }
  });
  console.log('Cloudinary not configured. Using local disk storage for file uploads.');
}

const memoryStorage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'image/webp'
];

const fileFilter = (req: any, file: any, cb: any) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: PDF, JPEG, PNG, WEBP`), false);
  }
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
  if (!allowedExts.includes(ext)) {
    return cb(new Error(`Invalid file extension: ${ext}`), false);
  }
  cb(null, true);
};

export const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter
});

export const uploadMemory = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter
});

export { cloudinary };
