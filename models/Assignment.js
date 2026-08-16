import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  creatorRole: {
    type: String
  },
  publisherRole: {
    type: String
  },
  createdAsRole: {
    type: String
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  targetRole: {
    type: String
  },
  targetRoles: [{
    type: String,
    enum: ['Admin', 'HOD', 'Supervisor', 'Team Leader', 'Team Member']
  }],
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  templateUrl: {
    type: String
  },
  status: {
    type: String,
    enum: ['Pending', 'Submitted', 'Overdue', 'Graded'],
    default: 'Pending'
  },
  submissions: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    fileUrl: String,
    link: String,
    status: {
      type: String,
      enum: ['Submitted', 'Approved', 'Rejected'],
      default: 'Submitted'
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    feedback: String,
    grade: String
  }]
}, { timestamps: true });

const Assignment = mongoose.model('Assignment', assignmentSchema);
export default Assignment;
