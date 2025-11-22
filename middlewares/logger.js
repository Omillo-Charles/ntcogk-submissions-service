// Request logger middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    const resetColor = '\x1b[0m';
    
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ` +
      `${statusColor}${res.statusCode}${resetColor} - ${duration}ms`
    );
  });
  
  next();
};

// API response logger
export const responseLogger = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function (data) {
    // Log response data in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Response:', JSON.stringify(data, null, 2));
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

export default {
  requestLogger,
  responseLogger,
};
