import Submission from "../models/Submission.js";
import Project from "../models/Project.js";
import { scanSubmissionPlagiarism } from "../utils/plagiarismChecker.js";
import Feedback from "../models/Feedback.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Department from "../models/Department.js";

export const getSubmissions = async (req, res) => {
  try {
    const { project } = req.query;
    const activeRole = req.activeRole || (req.user?.role ? req.user.role.split(',')[0].trim() : '');
    const { _id } = req.user;
    let query = {};

    if (project) {
      query.project = project;
    } else {
      if (activeRole === 'Admin') {
        query = {};
      } else if (activeRole === 'HOD') {
        let deptId = req.user.department?._id || req.user.department;
        if (!deptId) {
          const dept = await Department.findOne({ hod: _id });
          if (dept) deptId = dept._id;
        }
        if (deptId) {
          const deptProjects = await Project.find({ department: deptId });
          query.project = { $in: deptProjects.map(p => p._id) };
        } else {
          query.project = { $in: [] };
        }
      } else if (activeRole === 'Supervisor') {
        const supervisedProjects = await Project.find({ supervisor: _id });
        query.project = { $in: supervisedProjects.map(p => p._id) };
      } else {
        const userProject = await Project.findOne({ 
          $or: [{ members: _id }, { teamLeader: _id }] 
        });
        if (userProject) {
          query.project = userProject._id;
        } else {
          return res.json([]);
        }
      }
    }

    // Apply granular slot visibility based on who created the slot and the current role/status
    let roleFilter = {};
    if (activeRole === 'Team Member') {
      roleFilter = { submittedBy: _id };
    } else if (activeRole === 'Team Leader') {
      roleFilter = {
        $or: [
          { submittedBy: _id },
          { status: { $ne: 'Not Submitted' } }
        ]
      };
    } else if (activeRole === 'Supervisor') {
      roleFilter = {
        $or: [
          { submittedBy: _id },
          { status: { $in: ["Pending Supervisor", "Pending HOD", "Pending Admin", "Approved", "Rejected"] } }
        ]
      };
    } else if (activeRole === 'HOD') {
      roleFilter = {
        status: { $in: ["Pending HOD", "Pending Admin", "Approved", "Rejected"] },
        isFinalDocumentation: true
      };
    } else if (activeRole === 'Admin') {
      roleFilter = {
        status: { $in: ["Pending Admin", "Approved", "Rejected"] },
        isFinalDocumentation: true
      };
    }

    // Enforce strict data isolation combining the project query and status/role filter using $and
    const finalQuery = {
      $and: [
        query,
        roleFilter
      ]
    };

    const submissions = await Submission.find(finalQuery)
      .populate({
        path: "project",
        select: "title department supervisor teamLeader members academicYear batch",
        populate: [
          { path: "department", select: "name" },
          { path: "supervisor", select: "name" },
          { path: "teamLeader", select: "name" }
        ]
      })
      .populate("submittedBy", "name role")
      .populate({
        path: "feedbacks",
        populate: { path: "author", select: "name role" }
      })
      .populate({
        path: "history.feedbacks",
        populate: { path: "author", select: "name role" }
      })
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSubmissionById = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
       .populate("project")
       .populate("submittedBy", "name role")
      .populate({
        path: "feedbacks",
        populate: { path: "author", select: "name role" }
      })
      .populate({
        path: "history.feedbacks",
        populate: { path: "author", select: "name role" }
      });
    if (submission) {
      res.json(submission);
    } else {
      res.status(404).json({ message: "Submission not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const syncFinalDocumentation = async (projectId, submission) => {
  if (!submission.isFinalDocumentation) return;
  try {
    const project = await Project.findById(projectId);
    if (!project) return;

    const submitter = await User.findById(submission.submittedBy);
    const submittedByName = submitter ? submitter.name : "Unknown";

    const existingIndex = project.finalDocumentations.findIndex(
      doc => doc.submissionId.toString() === submission._id.toString()
    );

    const docData = {
      submissionId: submission._id,
      title: submission.title,
      semester: submission.semester,
      fileUrl: submission.fileUrl,
      links: submission.links,
      submittedBy: submittedByName,
      approvedBySupervisorAt: new Date(),
      status: submission.status,
      approvals: submission.approvals || [],
      history: submission.history.map(h => ({
        fileUrl: h.fileUrl,
        links: h.links,
        submittedAt: h.submittedAt,
        version: h.version,
        comment: h.comment
      }))
    };

    if (existingIndex > -1) {
      project.finalDocumentations[existingIndex] = {
        ...project.finalDocumentations[existingIndex].toObject(),
        ...docData
      };
    } else {
      project.finalDocumentations.push(docData);
    }

    // Automatically sync approval indicators in Project model so dashboards match immediately
    const isSupApproved = submission.approvals?.some(a => a.role === 'Supervisor' && a.status === 'Approved') || 
                          ['Pending HOD', 'Pending Admin', 'Approved'].includes(submission.status);

    const isHODApproved = submission.approvals?.some(a => a.role === 'HOD' && a.status === 'Approved') || 
                          ['Pending Admin', 'Approved'].includes(submission.status);

    const isAdminApproved = submission.approvals?.some(a => a.role === 'Admin' && a.status === 'Approved') || 
                            submission.status === 'Approved';

    project.isApprovedBySupervisor = isSupApproved;
    project.isApprovedByHOD = isHODApproved;
    project.isApprovedByAdmin = isAdminApproved;

    if (submission.status === 'Rejected') {
      project.status = 'Active';
    } else if (isAdminApproved) {
      project.status = 'Approved';
    } else if (isSupApproved || isHODApproved || ['Pending TL', 'Pending Supervisor', 'Pending HOD', 'Pending Admin'].includes(submission.status)) {
      project.status = 'Completed';
    }

    await project.save();
    console.log(`Synced final documentation and approval flags for project: ${project.title}`);
  } catch (error) {
    console.error("Error syncing final documentation:", error);
  }
};

export const createSubmission = async (req, res) => {
  try {
    let projectId = req.body.project;
    
    // If no project provided, try to find user's project
    if (!projectId) {
      const p = await Project.findOne({ 
        $or: [{ members: req.user._id }, { teamLeader: req.user._id }] 
      });
      if (!p) return res.status(404).json({ message: "You don't have an active project" });
      projectId = p._id;
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    let { links } = req.body;
    if (typeof links === "string") {
      try {
        links = JSON.parse(links);
      } catch (e) {
        links = [links];
      }
    }

    const fileUrl = req.file ? `/uploads/${req.file.filename}` : req.body.fileUrl;
    const linksArray = Array.isArray(links) ? links : (links ? [links] : []);

    // If it's an actual submission (with file or link), default to Pending TL or Pending Supervisor if TL is submitter
    let initialStatus = req.body.status;
    if (!initialStatus) {
      if (fileUrl || linksArray.length > 0) {
        if (project.teamLeader && project.teamLeader.toString() === req.user._id.toString()) {
          initialStatus = "Pending Supervisor";
        } else {
          initialStatus = "Pending TL";
        }
      } else {
        initialStatus = "Not Submitted";
      }
    }

    const submission = await Submission.create({
      ...req.body,
      isFinalDocumentation: req.body.isFinalDocumentation === 'true' || req.body.isFinalDocumentation === true,
      startDate: req.body.startDate || null,
      endDate: req.body.endDate || null,
      templateUrl: req.body.templateUrl || null,
      project: projectId,
      submittedBy: req.user._id,
      fileUrl,
      links: linksArray,
      status: initialStatus, 
      history: (fileUrl || linksArray.length > 0) ? [{
        fileUrl,
        links: linksArray,
        version: 1,
        comment: req.body.comment || "Initial submission"
      }] : []
    });

    if (submission.isFinalDocumentation && (fileUrl || linksArray.length > 0)) {
      await syncFinalDocumentation(projectId, submission);
    }

    // Notify Team Leader or Supervisor
    try {
      if (initialStatus === "Pending TL" && project.teamLeader) {
        await Notification.create({
          recipient: project.teamLeader,
          sender: req.user._id,
          title: "New Submissions Review",
          message: `A new work submission for project "${project.title}" needs review.`,
          type: "Submission",
          link: "/dashboard/team-leader/submissions",
          targetRole: "Team Leader"
        });
      } else if (initialStatus === "Pending Supervisor" && project.supervisor) {
        await Notification.create({
          recipient: project.supervisor,
          sender: req.user._id,
          title: "New Submissions Review",
          message: `A new team leader submission for project "${project.title}" needs review.`,
          type: "Submission",
          link: "/dashboard/supervisor/submissions",
          targetRole: "Supervisor"
        });
      }
    } catch (err) {
      console.error("Failed to send notification:", err);
    }

    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resubmitSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    const fileUrl = req.file ? `/uploads/${req.file.filename}` : req.body.fileUrl;
    let { links } = req.body;
    if (typeof links === "string") {
      try { links = JSON.parse(links); } catch (e) { links = [links]; }
    }
    const linksArray = Array.isArray(links) ? links : (links ? [links] : []);

    const isFirstTime = !submission.fileUrl || submission.status === 'Not Submitted';

    // Archive the previous active version's feedbacks and approvals inside the previous history record
    if (submission.history && submission.history.length > 0) {
      const lastHistIndex = submission.history.length - 1;
      submission.history[lastHistIndex].feedbacks = submission.feedbacks || [];
      submission.history[lastHistIndex].approvals = submission.approvals || [];
    }

    const newVersion = {
      fileUrl,
      links: linksArray,
      version: (submission.history ? submission.history.length : 0) + 1,
      comment: req.body.comment || (isFirstTime ? "Initial submission" : "Resubmission"),
      feedbacks: [],
      approvals: []
    };

    const project = await Project.findById(submission.project);
    let checkStatus = "Pending TL";
    if (project && project.teamLeader && project.teamLeader.toString() === req.user._id.toString()) {
      checkStatus = "Pending Supervisor";
    }

    submission.fileUrl = fileUrl;
    submission.links = linksArray;
    submission.status = checkStatus; // Back to initial review level
    submission.feedbacks = []; // Clean slate for new version
    submission.approvals = []; // Clean slate for new version
    submission.grade = undefined;
    submission.score = undefined;
    submission.history.push(newVersion);
    
    submission.markModified('feedbacks');
    submission.markModified('approvals');
    submission.markModified('history');
    
    await submission.save();

    if (submission.isFinalDocumentation) {
      await syncFinalDocumentation(submission.project, submission);
    }

    // Notify reviewer
    if (project) {
      const targetRecipient = (checkStatus === "Pending Supervisor") ? project.supervisor : project.teamLeader;
      if (targetRecipient) {
        const reviewerRole = (checkStatus === "Pending Supervisor") ? "Supervisor" : "Team Leader";
        if (isFirstTime) {
          await Notification.create({
            recipient: targetRecipient,
            sender: req.user._id,
            title: "New Submissions Review",
            message: checkStatus === "Pending Supervisor"
              ? `A new team leader submission for project "${project.title}" needs review.`
              : `A new work submission for project "${project.title}" needs review.`,
            type: "Submission",
            link: checkStatus === "Pending Supervisor" 
              ? "/dashboard/supervisor/submissions" 
              : "/dashboard/team-leader/submissions",
            targetRole: reviewerRole
          });
        } else {
          await Notification.create({
            recipient: targetRecipient,
            sender: req.user._id,
            title: "Submission Reworked",
            message: `Project "${project.title}" submission "${submission.title}" has been resubmitted.`,
            type: "Submission",
            link: checkStatus === "Pending Supervisor"
              ? "/dashboard/supervisor/submissions"
              : "/dashboard/team-leader/submissions",
            targetRole: reviewerRole
          });
        }
      }
    }

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id).populate("project");
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    // Determine the role for this approval.
    // If an HOD is the project supervisor and the submission is currently "Pending Supervisor", they are acting as the Supervisor.
    let approvalRole = req.activeRole || (req.user?.role ? req.user.role.split(',')[0].trim() : '');
    const isHODActingAsSupervisor = (approvalRole === "HOD" || approvalRole === "Supervisor" || req.user.role.includes("HOD")) && 
      submission.project && 
      submission.project.supervisor && 
      submission.project.supervisor.toString() === req.user._id.toString() && 
      submission.status === "Pending Supervisor";

    if (isHODActingAsSupervisor) {
      approvalRole = "Supervisor";
    }

    // Mark as approved at current level
    submission.approvals = submission.approvals.filter(a => a.role !== approvalRole);
    submission.approvals.push({
      role: approvalRole,
      approvedBy: req.user._id,
      status: "Approved",
      timestamp: new Date()
    });

    // Add grade and score if provided
    if (req.body.grade) submission.grade = req.body.grade;
    if (req.body.score) submission.score = req.body.score;

    // Add feedback if provided
    if (req.body.feedback) {
      const feedback = await Feedback.create({
        submission: submission._id,
        author: req.user._id,
        content: req.body.feedback,
        role: approvalRole,
        type: 'Review'
      });
      submission.feedbacks.push(feedback._id);
    }

    let message = `Your submission "${submission.title}" was approved by ${approvalRole}.`;
    let notifyTarget = submission.submittedBy;

    if (approvalRole === "Team Leader") {
      // Automatic progress to supervisor
      submission.status = "Pending Supervisor";
      notifyTarget = submission.project?.supervisor;
      message = `Team Leader approved "${submission.title}". It is now pending supervisor review.`;
    } else if (approvalRole === "Supervisor" || isHODActingAsSupervisor) {
      if (submission.isFinalDocumentation) {
        submission.status = "Pending HOD";
        const deptProject = await Project.findById(submission.project?._id).populate({
          path: 'department',
          populate: { path: 'hod' }
        });
        if (deptProject?.department?.hod) {
          notifyTarget = deptProject.department.hod._id || deptProject.department.hod;
        }
        message = `Supervisor approved final documentation "${submission.title}". It is now pending HOD review.`;
      } else {
        submission.status = "Approved";
        message = `Supervisor approved your submission "${submission.title}".`;
      }
    } else if (approvalRole === "HOD") {
      if (submission.isFinalDocumentation) {
        submission.status = "Pending Admin";
        const adminUser = await User.findOne({ role: "Admin" });
        if (adminUser) notifyTarget = adminUser._id;
        message = `HOD approved final documentation "${submission.title}". It is now pending Admin review.`;
      } else {
        submission.status = "Approved";
        message = `HOD approved your submission "${submission.title}".`;
      }
    } else if (approvalRole === "Admin") {
      submission.status = "Approved";
      message = `Admin approved your submission "${submission.title}".`;
    }

    await submission.save();

    if (submission.isFinalDocumentation) {
      await syncFinalDocumentation(submission.project?._id, submission);
    }

    if (notifyTarget) {
      const targetUser = await User.findById(notifyTarget);
      const targetRole = targetUser ? targetUser.role : "Team Leader";
      await Notification.create({
        recipient: notifyTarget,
        sender: req.user._id,
        title: "Submission Status Update",
        message,
        type: "Submission",
        link: "/submissions",
        targetRole: targetRole
      });
    }

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const forwardSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id).populate("project");
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    let nextStatus = "";
    let recipient = null;

    const activeRole = req.activeRole || (req.user?.role ? req.user.role.split(',')[0].trim() : '');
    const isHODActingAsSupervisor = (activeRole === "HOD" || activeRole === "Supervisor" || req.user.role.includes("HOD")) && 
      submission.project && 
      submission.project.supervisor && 
      submission.project.supervisor.toString() === req.user._id.toString() && 
      submission.status === "Pending Supervisor";

    if (activeRole === "Supervisor" || isHODActingAsSupervisor) {
      nextStatus = "Pending HOD";
      // Find HOD of project's department
      const deptProject = await Project.findById(submission.project._id).populate({
        path: 'department',
        populate: { path: 'hod' }
      });
      if (deptProject.department && deptProject.department.hod) {
        recipient = deptProject.department.hod._id || deptProject.department.hod;
      }
    } else if (activeRole === "HOD") {
      nextStatus = "Pending Admin";
      // Notify an Admin 
      const admin = await User.findOne({ role: "Admin" });
      if (admin) recipient = admin._id;
    }

    if (!nextStatus) return res.status(400).json({ message: "Invalid forwarding role or submission state" });

    submission.status = nextStatus;
    await submission.save();

    if (submission.isFinalDocumentation) {
      await syncFinalDocumentation(submission.project?._id, submission);
    }

    if (recipient) {
      await Notification.create({
        recipient,
        sender: req.user._id,
        title: "Submission Escalated",
        message: `Submission "${submission.title}" has been escalated to you for department verification.`,
        type: "Submission",
        link: "/submissions",
        targetRole: nextStatus === "Pending HOD" ? "HOD" : "Admin"
      });
    }

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    submission.status = "Rejected";
    
    // Add feedback if provided during rejection
    if (req.body.feedback) {
      const feedback = await Feedback.create({
        submission: submission._id,
        author: req.user._id,
        content: req.body.feedback,
        role: req.activeRole || (req.user?.role ? req.user.role.split(',')[0].trim() : ''),
        type: 'Review'
      });
      submission.feedbacks.push(feedback._id);
    }
    
    await submission.save();

    if (submission.isFinalDocumentation) {
      await syncFinalDocumentation(submission.project, submission);
    }

    // Notify submittor
    const targetUser = await User.findById(submission.submittedBy);
    const targetRole = targetUser ? targetUser.role : "Team Leader";
    await Notification.create({
      recipient: submission.submittedBy,
      sender: req.user._id,
      title: "Submission Rejected",
      message: `Your submission "${submission.title}" was rejected by ${req.activeRole || (req.user?.role ? req.user.role.split(',')[0].trim() : '')}. Please check feedback and resubmit.`,
      type: "Submission",
      link: "/submissions",
      targetRole: targetRole
    });

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addFeedback = async (req, res) => {
  try {
    const { content, rating, category } = req.body;
    const submissionId = req.params.id;

    const submission = await Submission.findById(submissionId);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    const feedback = await Feedback.create({
      submission: submissionId,
      author: req.user._id,
      content,
      rating,
      category,
      role: req.activeRole || (req.user?.role ? req.user.role.split(',')[0].trim() : '')
    });

    submission.feedbacks.push(feedback._id);
    await submission.save();

    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSubmissionStats = async (req, res) => {
  try {
    const stats = await Submission.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyFeedbacks = async (req, res) => {
  try {
    const { _id } = req.user;
    const activeRole = req.activeRole || (req.user?.role ? req.user.role.split(',')[0].trim() : '');

    let projectQuery = {};
    if (activeRole === 'Admin') {
      projectQuery = {};
    } else if (activeRole === 'HOD') {
      let deptId = req.user.department?._id || req.user.department;
      if (!deptId) {
        const dept = await Department.findOne({ hod: _id });
        if (dept) deptId = dept._id;
      }
      projectQuery = { department: deptId };
    } else if (activeRole === 'Supervisor') {
      projectQuery = { supervisor: _id };
    } else {
      projectQuery = { $or: [{ members: _id }, { teamLeader: _id }] };
    }

    const myProjects = await Project.find(projectQuery);
    const myProjectIds = myProjects.map(p => p._id);

    // Find all submissions associated with these projects
    const submissions = await Submission.find({
      project: { $in: myProjectIds }
    });
    const submissionIds = submissions.map(s => s._id);

    const query = { 
      submission: { $in: submissionIds },
      author: { $ne: _id } // Exclude feedback authored by the user themselves
    };

    const feedbacks = await Feedback.find(query)
      .populate({
        path: "submission",
        populate: { path: "project", select: "title" }
      })
      .populate("author", "name role")
      .sort({ createdAt: -1 });

    // Fetch project-level feedback for projects the user belongs to (received feedback)
    const projectsWithFeedback = await Project.find(projectQuery)
      .populate("feedback.author", "name role")
      .select("title feedback");

    const projectFeedbacksMapped = [];
    projectsWithFeedback.forEach(proj => {
      if (proj.feedback && proj.feedback.length > 0) {
        proj.feedback.forEach(fb => {
          // Exclude feedback provided by the current user
          const authorId = fb.author?._id || fb.author;
          if (authorId && authorId.toString() === _id.toString()) {
            return;
          }
          projectFeedbacksMapped.push({
            id: `proj-fb-${proj._id}-${fb._id}`,
            _id: `proj-fb-${proj._id}-${fb._id}`,
            submission: {
              project: {
                _id: proj._id,
                title: proj.title
              }
            },
            author: fb.author || { name: "System Reviewer", role: fb.role || "Reviewer" },
            content: fb.content,
            status: "Read",
            category: "Project Evaluation",
            rating: 5,
            createdAt: fb.createdAt || new Date()
          });
        });
      }
    });

    const mappedFeedbacks = feedbacks.map(fb => ({
      id: fb._id,
      _id: fb._id,
      submission: fb.submission,
      author: fb.author,
      content: fb.content,
      role: fb.role,
      status: fb.status || 'New',
      category: fb.category || 'Submission Evaluation',
      rating: fb.rating || 4,
      createdAt: fb.createdAt
    }));

    // Define role hierarchy levels
    const roleLevels = {
      "Team Member": 1,
      "Team Leader": 2,
      "Supervisor": 3,
      "HOD": 4,
      "Admin": 5
    };

    const userLevel = roleLevels[activeRole] || 1;

    const getRoleLevel = (roleStr) => {
      if (!roleStr) return 0;
      const primaryRole = roleStr.split(',')[0].trim();
      return roleLevels[primaryRole] || 0;
    };

    // Filter to only include feedback from strictly higher level roles
    const filteredMappedFeedbacks = mappedFeedbacks.filter(fb => {
      const fbRole = fb.role || (fb.author && fb.author.role);
      return getRoleLevel(fbRole) > userLevel;
    });

    const filteredProjectFeedbacks = projectFeedbacksMapped.filter(fb => {
      const fbRole = fb.role || (fb.author && fb.author.role);
      return getRoleLevel(fbRole) > userLevel;
    });

    const allMergedFeedbacks = [...filteredMappedFeedbacks, ...filteredProjectFeedbacks];
    allMergedFeedbacks.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json(allMergedFeedbacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markFeedbackRead = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }
    feedback.status = "Read";
    await feedback.save();
    res.json({ message: "Feedback marked as read", feedback });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const triggerPlagiarismCheck = async (req, res) => {
  try {
    const submissionId = req.params.id;
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const updatedSubmission = await scanSubmissionPlagiarism(submissionId);
    res.json({
      success: true,
      message: "Submission checked successfully!",
      submission: updatedSubmission
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Plagiarism scan failed." });
  }
};
