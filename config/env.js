import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 5501,
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // MongoDB Configuration
  database: {
    mongoUri: process.env.MONGO_URI,
  },

  // Email Configuration
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === '465',
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
};

// Validate required environment variables
const validateConfig = () => {
  const required = {
    'MONGO_URI': config.database.mongoUri,
    'EMAIL_HOST': config.email.host,
    'EMAIL_USER': config.email.user,
    'EMAIL_PASS': config.email.pass,
    'JWT_SECRET': config.jwt.secret,
  };

  const missing = Object.entries(required)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Validate on load
try {
  validateConfig();
  console.log('✓ Environment configuration loaded successfully');
} catch (error) {
  console.error('✗ Environment configuration error:', error.message);
  process.exit(1);
}

export default config;
