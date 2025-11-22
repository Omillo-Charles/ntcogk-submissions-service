import express from 'express';
import multer from 'multer';
import {
  createSubmission,
  getAllSubmissions,
  getSubmissionById,
  getSubmissionsByEmail,
  downloadFile,
  updateSubmissionStatus,
  deleteSubmission,
  getSubmissionStats,
} from '../controllers/submissionController.js';
import { validateSubmission, validateStatusUpdate, sanitizeInput } from '../middlewares/validator.js';
import { submissionRateLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// Configure multer for file uploads (store in memory for GridFS upload)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, JPG, PNG are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Public routes
router.post(
  '/submissions',
  submissionRateLimiter,
  upload.array('files', 10),
  sanitizeInput,
  validateSubmission,
  createSubmission
);

router.get('/submissions', getAllSubmissions);
router.get('/submissions/stats', getSubmissionStats);
router.get('/submissions/:id', getSubmissionById);
router.get('/submissions/email/:email', getSubmissionsByEmail);
router.get('/submissions/files/:fileId', downloadFile);

// Admin routes (add authentication middleware later if needed)
router.patch('/submissions/:id/status', validateStatusUpdate, updateSubmissionStatus);
router.delete('/submissions/:id', deleteSubmission);

export default router;
