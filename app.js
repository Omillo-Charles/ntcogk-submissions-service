import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import config from './config/env.js';
import { connectDB } from './database/mongodb.js';
import submissionRoutes from './routes/submissionRoutes.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { requestLogger } from './middlewares/logger.js';
import { rateLimiter } from './middlewares/rateLimiter.js';

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://ntcogk.org', 
        'https://www.ntcogk.org',
        'https://submissions.ntcogk.org',
        'https://ntcogk.vercel.app',
        'https://ntcogk-submissions.vercel.app'
      ] 
    : [
        'http://localhost:3000', 
        'http://localhost:3001',
        'http://localhost:3002'
      ],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(requestLogger);

// Rate limiting
app.use('/api', rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'NTCOG Kenya Submissions API is running',
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv,
  });
});

// API root endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'NTCOG Kenya Submissions API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      submissions: {
        create: 'POST /api/submissions',
        getAll: 'GET /api/submissions',
        getById: 'GET /api/submissions/:id',
        getByEmail: 'GET /api/submissions/email/:email',
        downloadFile: 'GET /api/submissions/files/:fileId',
        updateStatus: 'PATCH /api/submissions/:id/status',
        delete: 'DELETE /api/submissions/:id',
        stats: 'GET /api/submissions/stats',
      },
    },
    documentation: 'Visit /api/submissions for submission endpoints',
  });
});

// API routes
app.use('/api', submissionRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = config.server.port;

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${config.server.nodeEnv}`);
  console.log(`✓ API URL: http://localhost:${PORT}/api`);
  console.log(`✓ Health Check: http://localhost:${PORT}/health`);
  console.log('='.repeat(50));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

export default app;
