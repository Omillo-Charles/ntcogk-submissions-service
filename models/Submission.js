import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  // Personal Information
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  position: {
    type: String,
    required: [true, 'Position/Title is required'],
    trim: true,
  },

  // Church Information
  branch: {
    type: String,
    required: [true, 'Branch/Church name is required'],
    trim: true,
  },
  region: {
    type: String,
    required: [true, 'Region is required'],
    enum: [
      'nairobi',
      'central',
      'coast',
      'eastern',
      'nyanza',
      'rift-valley',
      'western',
    ],
  },

  // Submission Details
  submissionType: {
    type: String,
    required: [true, 'Submission type is required'],
    enum: [
      'Monthly Report',
      'Financial Statement',
      'Event Proposal',
      'Ministry Update',
      'Building/Property Documents',
      'Membership Records',
      'Pastoral Credentials',
      'Other Documents',
    ],
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  urgency: {
    type: String,
    required: true,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },

  // File Information (stored in GridFS)
  files: [
    {
      fileName: {
        type: String,
        required: true,
      },
      fileId: {
        type: String,
        required: true,
      },
      fileSize: {
        type: Number,
        required: true,
      },
      fileType: {
        type: String,
        required: true,
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  // Status and Tracking
  status: {
    type: String,
    enum: ['pending', 'under-review', 'approved', 'rejected', 'requires-action'],
    default: 'pending',
  },
  reviewedBy: {
    type: String,
    trim: true,
  },
  reviewedAt: {
    type: Date,
  },
  reviewNotes: {
    type: String,
    trim: true,
  },

  // Metadata
  submissionId: {
    type: String,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
}, {
  timestamps: true,
});

// Generate unique submission ID before validation
submissionSchema.pre('validate', function (next) {
  if (!this.submissionId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.submissionId = `SUB-${year}${month}-${random}`;
  }
  next();
});

// Indexes for faster queries
submissionSchema.index({ email: 1, createdAt: -1 });
submissionSchema.index({ region: 1, status: 1 });
submissionSchema.index({ submissionId: 1 }, { unique: true });
submissionSchema.index({ urgency: 1, status: 1 });

// Virtual for urgency display
submissionSchema.virtual('urgencyDisplay').get(function () {
  const urgencyMap = {
    low: 'Low Priority',
    normal: 'Normal',
    high: 'High Priority',
    urgent: 'Urgent',
  };
  return urgencyMap[this.urgency] || this.urgency;
});

// Virtual for region display
submissionSchema.virtual('regionDisplay').get(function () {
  const regionMap = {
    nairobi: 'Nairobi Region',
    central: 'Central Region',
    coast: 'Coast Region',
    eastern: 'Eastern Region',
    nyanza: 'Nyanza Region',
    'rift-valley': 'Rift Valley Region',
    western: 'Western Region',
  };
  return regionMap[this.region] || this.region;
});

// Ensure virtuals are included in JSON
submissionSchema.set('toJSON', { virtuals: true });
submissionSchema.set('toObject', { virtuals: true });

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;
