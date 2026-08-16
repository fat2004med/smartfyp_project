import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teamLeader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  hod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['Proposed', 'Active', 'Approved', 'Completed', 'Rejected', 'Published'],
    default: 'Proposed'
  },
  semester: { type: Number, enum: [7, 8], default: 7 },
  currentPhase: { type: String, enum: ['Proposal', 'Analysis', 'Design', 'Implementation', 'Final'], default: 'Proposal' },
  isApprovedBySupervisor: {
    type: Boolean,
    default: false
  },
  isApprovedByHOD: {
    type: Boolean,
    default: false
  },
  isApprovedByAdmin: {
    type: Boolean,
    default: false
  },
  academicYear: {
    type: String,
    required: false,
    default: () => new Date().getFullYear().toString()
  },
  year: Number,
  batch: {
    type: String,
    required: false,
    default: () => `${new Date().getFullYear()}-${new Date().getFullYear() + 4}`
  },
  description: {
    type: String,
    required: false,
    default: 'No description'
  },
  tags: [String],
  abstract: String,
  outcomes: String,
  isPublic: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  teamName: String,
  technologies: [String],
  duration: String,
  grade: String,
  score: Number,
  githubLink: String,
  fileUrl: String,
  liveLink: String,
  isLiveLinkPublic: {
    type: Boolean,
    default: false
  },
  feedback: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    role: String,
    createdAt: { type: Date, default: Date.now }
  }],
  finalDocumentations: [{
    submissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission' },
    title: String,
    semester: Number,
    fileUrl: String,
    links: [String],
    submittedBy: String,
    status: String,
    approvals: [
      {
        role: String,
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: String,
        timestamp: Date
      }
    ],
    approvedBySupervisorAt: { type: Date, default: Date.now },
    history: [
      {
        fileUrl: String,
        links: [String],
        submittedAt: { type: Date },
        version: Number,
        comment: String
      }
    ]
  }],
  startDate: Date,
  endDate: Date
}, {
  timestamps: true
});

const Project = mongoose.model('Project', projectSchema);
export default Project;
