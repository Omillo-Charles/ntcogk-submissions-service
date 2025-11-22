import mongoose from 'mongoose';
import config from '../config/env.js';

// MongoDB connection options
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  retryWrites: true,
  w: 'majority',
};

// Connect to MongoDB
export const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    const conn = await mongoose.connect(config.database.mongoUri, options);
    
    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
    console.log(`✓ Database: ${conn.connection.name}`);
    
    // Initialize GridFS bucket for file storage
    const bucket = new mongoose.mongo.GridFSBucket(conn.connection.db, {
      bucketName: 'submissions',
    });
    
    console.log('✓ GridFS bucket initialized for file storage');
    
    return conn;
  } catch (error) {
    console.error('✗ MongoDB Connection Error:', error.message);
    console.error('Please check:');
    console.error('1. Your internet connection');
    console.error('2. MongoDB Atlas IP whitelist (add 0.0.0.0/0 for testing)');
    console.error('3. Database credentials in .env file');
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
    process.exit(1);
  }
});

// Helper function to get GridFS bucket
export const getGridFSBucket = () => {
  if (!mongoose.connection.db) {
    throw new Error('MongoDB connection not established');
  }
  
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'submissions',
  });
};

export default { connectDB, getGridFSBucket };
