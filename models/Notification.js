import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Announcement', 'Task', 'Submission', 'Feedback', 'Assignment', 'General'],
    default: 'General'
  },
  targetRole: {
    type: String,
    enum: ['Admin', 'HOD', 'Supervisor', 'Team Leader', 'Team Member', 'General']
  },
  link: {
    type: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

notificationSchema.pre('save', async function() {
  if (!this.targetRole) {
    try {
      const User = mongoose.model('User');
      const recipientUser = await User.findById(this.recipient);
      if (recipientUser) {
        const roles = recipientUser.role ? recipientUser.role.split(',').map(r => r.trim()) : [];
        if (roles.length === 1) {
          this.targetRole = roles[0];
        } else if (roles.length > 1) {
          // Recipient has multiple roles (e.g. HOD, Supervisor)
          const msg = (this.message || "").toLowerCase();
          const title = (this.title || "").toLowerCase();
          const link = (this.link || "").toLowerCase();
          
          if (link.includes('supervisor') || msg.includes('supervisor') || title.includes('supervisor')) {
            this.targetRole = 'Supervisor';
          } else if (link.includes('hod') || msg.includes('hod') || title.includes('department') || msg.includes('department') || title.includes('escalated')) {
            this.targetRole = 'HOD';
          } else if (roles.includes('Supervisor') && (link.includes('submission') || title.includes('submission') || link.includes('assignment') || title.includes('assignment'))) {
            this.targetRole = 'Supervisor';
          } else if (roles.includes('HOD')) {
            this.targetRole = 'HOD';
          } else {
            this.targetRole = roles[0];
          }
        }
      }
    } catch (err) {
      console.error("Error in notification targetRole auto-resolution pre-save hook:", err);
    }
  }
});

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
