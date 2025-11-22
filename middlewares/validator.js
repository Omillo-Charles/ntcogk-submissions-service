// Validate submission data
export const validateSubmission = (req, res, next) => {
  const {
    fullName,
    email,
    phone,
    position,
    branch,
    region,
    submissionType,
    subject,
    description,
  } = req.body;

  const errors = [];

  // Required fields validation
  if (!fullName || fullName.trim().length === 0) {
    errors.push('Full name is required');
  }

  if (!email || !isValidEmail(email)) {
    errors.push('Valid email address is required');
  }

  if (!phone || phone.trim().length === 0) {
    errors.push('Phone number is required');
  }

  if (!position || position.trim().length === 0) {
    errors.push('Position/Title is required');
  }

  if (!branch || branch.trim().length === 0) {
    errors.push('Branch/Church name is required');
  }

  if (!region) {
    errors.push('Region is required');
  }

  if (!submissionType) {
    errors.push('Submission type is required');
  }

  if (!subject || subject.trim().length === 0) {
    errors.push('Subject is required');
  }

  if (!description || description.trim().length === 0) {
    errors.push('Description is required');
  }

  // Length validations
  if (fullName && fullName.length > 100) {
    errors.push('Full name must not exceed 100 characters');
  }

  if (subject && subject.length > 200) {
    errors.push('Subject must not exceed 200 characters');
  }

  if (description && description.length > 5000) {
    errors.push('Description must not exceed 5000 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate status update
export const validateStatusUpdate = (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'under-review', 'approved', 'rejected', 'requires-action'];

  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'Status is required',
    });
  }

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
    });
  }

  next();
};

// Sanitize input to prevent XSS
export const sanitizeInput = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Remove potentially dangerous characters
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .trim();
      }
    });
  }
  next();
};

export default {
  validateSubmission,
  validateStatusUpdate,
  sanitizeInput,
};
