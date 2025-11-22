import Submission from '../models/Submission.js';
import mongoose from 'mongoose';
import { Readable } from 'stream';
import { getGridFSBucket } from '../database/mongodb.js';
import { sendUserConfirmationEmail, sendAdminNotificationEmail } from '../utils/emailService.js';

// Helper function to upload file to MongoDB GridFS
const uploadFileToGridFS = async (file, submissionId) => {
  try {
    const bucket = getGridFSBucket();
    const timestamp = Date.now();
    const fileName = `${submissionId}/${timestamp}-${file.originalname}`;
    
    // Create readable stream from buffer
    const readableStream = Readable.from(file.buffer);
    
    // Upload to GridFS
    const uploadStream = bucket.openUploadStream(fileName, {
      metadata: {
        originalName: file.originalname,
        contentType: file.mimetype,
        submissionId: submissionId,
        uploadedAt: new Date(),
      },
    });

    return new Promise((resolve, reject) => {
      readableStream.pipe(uploadStream)
        .on('error', (error) => {
          console.error('GridFS upload error:', error);
          reject(error);
        })
        .on('finish', () => {
          resolve({
            fileName: file.originalname,
            fileId: uploadStream.id.toString(),
            fileSize: file.size,
            fileType: file.mimetype,
          });
        });
    });
  } catch (error) {
    console.error('Error uploading to GridFS:', error);
    throw error;
  }
};

// Create new submission
export const createSubmission = async (req, res) => {
  try {
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
      urgency,
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !phone || !position || !branch || !region || 
        !submissionType || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided',
      });
    }

    // Create submission document
    const submission = new Submission({
      fullName,
      email,
      phone,
      position,
      branch,
      region,
      submissionType,
      subject,
      description,
      urgency: urgency || 'normal',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    // Save to get the submission ID
    await submission.save();

    // Upload files to GridFS if any
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => 
        uploadFileToGridFS(file, submission.submissionId)
      );
      
      const uploadedFiles = await Promise.all(uploadPromises);
      submission.files = uploadedFiles;
      await submission.save();
    }

    // Send confirmation email to user (non-blocking)
    sendUserConfirmationEmail(submission).catch(err => {
      console.error('Failed to send user confirmation email:', err);
    });

    // Send notification email to admin (non-blocking)
    sendAdminNotificationEmail(submission).catch(err => {
      console.error('Failed to send admin notification email:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Submission created successfully',
      data: {
        submissionId: submission.submissionId,
        submission,
      },
    });

  } catch (error) {
    console.error('Error creating submission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create submission',
      error: error.message,
    });
  }
};

// Get all submissions (with filters)
export const getAllSubmissions = async (req, res) => {
  try {
    const {
      status,
      region,
      urgency,
      submissionType,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (region) filter.region = region;
    if (urgency) filter.urgency = urgency;
    if (submissionType) filter.submissionType = submissionType;

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOrder = order === 'asc' ? 1 : -1;

    // Get submissions
    const submissions = await Submission.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Submission.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        submissions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
    });

  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch submissions',
      error: error.message,
    });
  }
};

// Get submission by ID
export const getSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await Submission.findOne({
      $or: [{ _id: id }, { submissionId: id }],
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found',
      });
    }

    res.status(200).json({
      success: true,
      data: submission,
    });

  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch submission',
      error: error.message,
    });
  }
};

// Get submissions by email
export const getSubmissionsByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    const submissions = await Submission.find({ email })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        email,
        count: submissions.length,
        submissions,
      },
    });

  } catch (error) {
    console.error('Error fetching submissions by email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch submissions',
      error: error.message,
    });
  }
};

// Download file from GridFS
export const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const bucket = getGridFSBucket();
    const objectId = new mongoose.Types.ObjectId(fileId);

    // Get file metadata
    const files = await bucket.find({ _id: objectId }).toArray();
    
    if (!files || files.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    const file = files[0];

    // Set response headers
    res.set({
      'Content-Type': file.metadata.contentType,
      'Content-Disposition': `attachment; filename="${file.metadata.originalName}"`,
      'Content-Length': file.length,
    });

    // Stream file to response
    const downloadStream = bucket.openDownloadStream(objectId);
    downloadStream.pipe(res);

  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file',
      error: error.message,
    });
  }
};

// Update submission status
export const updateSubmissionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewedBy, reviewNotes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const submission = await Submission.findOne({
      $or: [{ _id: id }, { submissionId: id }],
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found',
      });
    }

    submission.status = status;
    if (reviewedBy) submission.reviewedBy = reviewedBy;
    if (reviewNotes) submission.reviewNotes = reviewNotes;
    submission.reviewedAt = new Date();

    await submission.save();

    res.status(200).json({
      success: true,
      message: 'Submission status updated successfully',
      data: submission,
    });

  } catch (error) {
    console.error('Error updating submission status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update submission status',
      error: error.message,
    });
  }
};

// Delete submission
export const deleteSubmission = async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await Submission.findOne({
      $or: [{ _id: id }, { submissionId: id }],
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found',
      });
    }

    // Delete files from GridFS
    if (submission.files && submission.files.length > 0) {
      const bucket = getGridFSBucket();
      
      const deletePromises = submission.files.map(file => {
        return bucket.delete(new mongoose.Types.ObjectId(file.fileId)).catch(err => {
          console.error(`Error deleting file ${file.fileName}:`, err);
        });
      });

      await Promise.all(deletePromises);
    }

    // Delete submission from MongoDB
    await Submission.deleteOne({ _id: submission._id });

    res.status(200).json({
      success: true,
      message: 'Submission deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete submission',
      error: error.message,
    });
  }
};

// Get submission statistics
export const getSubmissionStats = async (req, res) => {
  try {
    const totalSubmissions = await Submission.countDocuments();
    const pendingSubmissions = await Submission.countDocuments({ status: 'pending' });
    const underReviewSubmissions = await Submission.countDocuments({ status: 'under-review' });
    const approvedSubmissions = await Submission.countDocuments({ status: 'approved' });
    const urgentSubmissions = await Submission.countDocuments({ urgency: 'urgent' });

    // Submissions by region
    const byRegion = await Submission.aggregate([
      { $group: { _id: '$region', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Submissions by type
    const byType = await Submission.aggregate([
      { $group: { _id: '$submissionType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalSubmissions,
        pending: pendingSubmissions,
        underReview: underReviewSubmissions,
        approved: approvedSubmissions,
        urgent: urgentSubmissions,
        byRegion,
        byType,
      },
    });

  } catch (error) {
    console.error('Error fetching submission stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch submission statistics',
      error: error.message,
    });
  }
};

export default {
  createSubmission,
  getAllSubmissions,
  getSubmissionById,
  getSubmissionsByEmail,
  downloadFile,
  updateSubmissionStatus,
  deleteSubmission,
  getSubmissionStats,
};
