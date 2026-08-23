import Assignment from "../models/Assignment.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import Project from "../models/Project.js";

const getDepartmentId = (dept) => {
  if (!dept) return null;
  if (dept._id) return dept._id.toString();
  return dept.toString();
};

const getUserIdStr = (usr) => {
  if (!usr) return '';
  if (usr._id) return usr._id.toString();
  return usr.toString();
};

// Helper function to check if a user is eligible/associated with an assignment
export const isUserScheduledForAssignment = async (assignment, user, userProjects, activeRole) => {
  const creatorId = (assignment.creator?._id || assignment.creator || assignment.createdBy?._id || assignment.createdBy)?.toString();
  const cRole = assignment.publisherRole || assignment.createdAsRole || assignment.creatorRole || (assignment.creator?.role ? assignment.creator.role.split(',')[0].trim() : '');
  const userIdStr = (user?._id || user)?.toString();

  // If the user is the creator:
  if (creatorId === userIdStr) {
    // 1. If currently in the role that created it, they must see it to manage it in Creation History
    if (cRole && cRole === activeRole) {
      return true;
    }
    // 2. If their active role is targeted by this assignment, they see it to submit
    if (assignment.targetRoles && assignment.targetRoles.includes(activeRole)) {
      return true;
    }
    if (assignment.targetRole && assignment.targetRole === activeRole) {
      return true;
    }
    // 3. Fallback for legacy assignments without role context:
    if (!cRole) {
      return true;
    }
    return false;
  }

  // User's active role must be targeted or explicitly assigned
  const matchesRole = (assignment.targetRoles && assignment.targetRoles.includes(activeRole)) || 
                      assignment.targetRole === activeRole ||
                      (assignment.assignedTo && assignment.assignedTo.some(id => (id?._id || id)?.toString() === userIdStr));
  if (!matchesRole) {
    return false;
  }

  // Only show assignments created at or after the user's registration date for non-Admin users
  if (user?.createdAt && assignment.createdAt && user.role !== 'Admin') {
    const userCreatedTime = new Date(user.createdAt).getTime();
    const assignmentCreatedTime = new Date(assignment.createdAt).getTime();
    if (assignmentCreatedTime < userCreatedTime) {
      return false;
    }
  }

  const creatorRole = assignment.publisherRole || assignment.createdAsRole || assignment.creatorRole || (assignment.creator?.role ? assignment.creator.role.split(',')[0].trim() : 'Admin');
  const creatorIdString = creatorId;

  // 1. Admin's assignments go to anyone matching targetRole in ANY department
  if (creatorRole === "Admin") {
    return true;
  }

  // 2. HOD's assignments only go to users matching targetRole IN THEIR SAME DEPARTMENT
  if (creatorRole === "HOD") {
    const uDeptId = getDepartmentId(user.department);
    const cDeptId = getDepartmentId(assignment.creator?.department || assignment.createdBy?.department);
    if (uDeptId && cDeptId) {
      return uDeptId === cDeptId;
    }
    return true;
  }

  // 3. Supervisor's assignments only go to team members/leaders in projects where they are supervisor
  if (creatorRole === "Supervisor") {
    const isAssociated = userProjects.some(proj => {
      const projSupervisor = getUserIdStr(proj.supervisor);
      const projTeamLeader = getUserIdStr(proj.teamLeader);
      const isMember = (proj.members || []).some(m => getUserIdStr(m) === userIdStr);
      return projSupervisor === creatorIdString && 
             (projTeamLeader === userIdStr || isMember);
    });
    return isAssociated;
  }

  // 4. Team Leader's assignments only go to team members in projects where they are teamLeader
  if (creatorRole === "Team Leader") {
    const isAssociated = userProjects.some(proj => {
      const projTeamLeader = getUserIdStr(proj.teamLeader);
      const isMember = (proj.members || []).some(m => getUserIdStr(m) === userIdStr);
      return projTeamLeader === creatorIdString && isMember;
    });
    return isAssociated;
  }

  return false;
};

export const getPublishedAssignments = async (req, res) => {
  try {
    const userId = req.user._id;
    const activeRole = req.activeRole || (req.user?.role ? req.user.role.split(',')[0].trim() : '');

    const assignments = await Assignment.find({
      $or: [
        { createdBy: userId },
        { creator: userId }
      ]
    })
      .populate("creator", "name role department")
      .populate("createdBy", "name role department")
      .populate("submissions.student", "name email role department")
      .sort({ createdAt: -1 });

    const filtered = assignments.filter(a => {
      const cRole = a.publisherRole || a.createdAsRole || a.creatorRole;
      if (cRole) {
        return cRole === activeRole;
      }
      return true;
    });

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAssignedToMeAssignments = async (req, res) => {
  try {
    const userId = req.user._id;
    const activeRole = req.activeRole || (req.user?.role ? req.user.role.split(',')[0].trim() : '');

    const query = {
      $or: [
        { targetRoles: activeRole },
        { targetRole: activeRole },
        { assignedTo: userId }
      ]
    };

    if (req.user && !req.user.role?.includes('Admin') && req.user.createdAt) {
      query.createdAt = { $gte: req.user.createdAt };
    }

    const assignments = await Assignment.find(query)
      .populate("creator", "name role department")
      .populate("createdBy", "name role department")
      .populate("submissions.student", "name email role department")
      .sort({ createdAt: -1 });

    const userProjects = await Project.find({
      $or: [
        { supervisor: userId },
        { teamLeader: userId },
        { members: userId }
      ]
    });

    const filtered = [];
    for (const assignment of assignments) {
      const creatorId = (assignment.creator?._id || assignment.creator || assignment.createdBy?._id || assignment.createdBy)?.toString();
      const cRole = assignment.publisherRole || assignment.createdAsRole || assignment.creatorRole;
      if (creatorId === userId.toString() && cRole === activeRole) {
        continue;
      }
      const isVisible = await isUserScheduledForAssignment(assignment, req.user, userProjects, activeRole);
      if (isVisible) {
        filtered.push(assignment);
      }
    }

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAssignments = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.activeRole || (req.user?.role ? req.user.role.split(',')[0].trim() : '');

    let assignQuery = {};
    if (req.user && !req.user.role?.includes('Admin') && req.user.createdAt) {
      assignQuery = {
        $or: [
          { creator: userId },
          { createdBy: userId },
          { createdAt: { $gte: req.user.createdAt } }
        ]
      };
    }

    const allAssignments = await Assignment.find(assignQuery)
      .populate("creator", "name role department")
      .populate("createdBy", "name role department")
      .populate("submissions.student", "name email role department")
      .sort({ createdAt: -1 });

    const userProjects = await Project.find({
      $or: [
        { supervisor: userId },
        { teamLeader: userId },
        { members: userId }
      ]
    });

    const filtered = [];
    for (const assignment of allAssignments) {
      if (!assignment.creator && !assignment.createdBy) {
        continue;
      }
      const isVisible = await isUserScheduledForAssignment(assignment, req.user, userProjects, userRole);
      if (isVisible) {
        filtered.push(assignment);
      }
    }

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate("creator", "name role");
    if (assignment) {
      res.json(assignment);
    } else {
      res.status(404).json({ message: "Assignment not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createAssignment = async (req, res) => {
  try {
    let { title, description, startDate, endDate, targetRoles } = req.body;
    
    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Assignment Title is required" });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ message: "Assignment Description is required" });
    }
    if (!endDate) {
      return res.status(400).json({ message: "End Date/Deadline is required" });
    }

    // Verify team/project allocation eligibility
    const activeRole = req.activeRole || (req.user?.role ? req.user.role.split(',')[0].trim() : '');
    if (activeRole === "Supervisor") {
      const hasProject = await Project.exists({ supervisor: req.user._id });
      if (!hasProject) {
        return res.status(400).json({ 
          message: "You cannot create assignments as you do not have any active teams/projects allocated." 
        });
      }
    } else if (activeRole === "Team Leader") {
      const hasProject = await Project.exists({ teamLeader: req.user._id });
      if (!hasProject) {
        return res.status(400).json({ 
          message: "You cannot create assignments as you do not have any active teams/projects allocated." 
        });
      }
    }

    // Comprehensive parsing and sanitization for targetRoles
    if (targetRoles) {
      if (typeof targetRoles === "string") {
        try {
          targetRoles = JSON.parse(targetRoles);
        } catch (e) {
          if (targetRoles.includes(",")) {
            targetRoles = targetRoles.split(",").map(r => r.trim());
          } else {
            targetRoles = [targetRoles.trim()];
          }
        }
      }
      
      if (Array.isArray(targetRoles)) {
        const allowedRoles = ['Admin', 'HOD', 'Supervisor', 'Team Leader', 'Team Member'];
        targetRoles = targetRoles
          .map(r => typeof r === "string" ? r.trim() : "")
          .filter(r => allowedRoles.includes(r));
      } else {
        targetRoles = [];
      }
    } else {
      targetRoles = [];
    }

    // Restrict targetRoles to only those lower than current user's role
    const rolesHierarchy = ['Admin', 'HOD', 'Supervisor', 'Team Leader', 'Team Member'];
    const creatorIndex = rolesHierarchy.indexOf(activeRole);
    const validTargetRoles = creatorIndex !== -1 ? rolesHierarchy.slice(creatorIndex + 1) : [];

    targetRoles = targetRoles.filter(r => validTargetRoles.includes(r));
    if (targetRoles.length === 0) {
      return res.status(400).json({ 
        message: `At least one valid target role lower than your own role (${validTargetRoles.join(', ') || 'none obtainable'}) must be selected.` 
      });
    }

    let assignedToUsers = [];
    if (req.body.assignedTo) {
      if (typeof req.body.assignedTo === 'string') {
        try {
          assignedToUsers = JSON.parse(req.body.assignedTo);
        } catch(e) {
          assignedToUsers = req.body.assignedTo.split(',').map(s => s.trim());
        }
      } else if (Array.isArray(req.body.assignedTo)) {
        assignedToUsers = req.body.assignedTo;
      }
    }

    const assignment = await Assignment.create({
      title: title.trim(),
      description: description.trim(),
      startDate: startDate || new Date(),
      endDate,
      targetRoles,
      targetRole: targetRoles[0] || '',
      assignedTo: assignedToUsers,
      templateUrl: req.file ? `/uploads/${req.file.filename}` : req.body.templateUrl,
      creator: req.user._id,
      createdBy: req.user._id,
      creatorRole: activeRole,
      publisherRole: activeRole,
      createdAsRole: activeRole
    });

    // Notify users with the target roles within the same department/tenant scope
    if (targetRoles && targetRoles.length > 0) {
      const notifyQuery = {
        $or: targetRoles.map(role => ({
          role: { $regex: new RegExp(`\\b${role}\\b`, 'i') }
        }))
      };
      if (req.user && activeRole !== "Admin" && req.user.department) {
        notifyQuery.department = req.user.department?._id || req.user.department;
      }
      const usersToNotify = await User.find(notifyQuery);
      if (usersToNotify.length > 0) {
        const notifications = usersToNotify.map(user => {
          const matchedRole = targetRoles.find(tr => user.role.split(',').map(r => r.trim()).includes(tr));
          return {
            recipient: user._id,
            sender: req.user._id,
            title: "New Assignment",
            message: `A new assignment "${title}" has been posted.`,
            type: "Assignment",
            link: "/assignments",
            targetRole: matchedRole || "Supervisor"
          };
        });
        await Notification.insertMany(notifications);
      }
    }

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (assignment) {
      Object.assign(assignment, req.body);
      const updatedAssignment = await assignment.save();
      res.json(updatedAssignment);
    } else {
      res.status(404).json({ message: "Assignment not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (assignment) {
      await assignment.deleteOne();
      res.json({ message: "Assignment removed" });
    } else {
      res.status(404).json({ message: "Assignment not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyAssignments = async (req, res) => {
  try {
    const activeRole = req.activeRole || (req.user?.role ? req.user.role.split(',')[0].trim() : '');
    const query = {
      targetRoles: activeRole,
      creator: { $ne: req.user._id }
    };
    if (activeRole !== "Admin") {
      query.createdAt = { $gte: req.user.createdAt };
    }
    const assignments = await Assignment.find(query).populate("creator", "name role").sort({ createdAt: -1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const submitAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id || req.body.assignmentId);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    const submission = {
      student: req.user._id,
      fileUrl: req.file ? `/uploads/${req.file.filename}` : req.body.fileUrl,
      link: req.body.link,
      submittedAt: Date.now()
    };

    assignment.submissions.push(submission);
    assignment.status = "Submitted"; // This is tricky as it's global status, but let's keep it
    await assignment.save();

    // Notify assignment creator
    await Notification.create({
      recipient: assignment.creator,
      sender: req.user._id,
      title: "New Assignment Submission",
      message: `${req.user.name} submitted work for "${assignment.title}".`,
      type: "Submission",
      link: "/assignments",
      targetRole: assignment.creatorRole || "Supervisor"
    });

    res.json({ message: "Assignment submitted successfully", assignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const provideFeedback = async (req, res) => {
  try {
    const { submissionId, studentId, feedback, grade, status } = req.body;
    const assignmentId = req.params.id || req.body.assignmentId;
    
    if (!assignmentId) {
      return res.status(400).json({ message: "Assignment ID is required" });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    let subIndex = -1;
    if (submissionId) {
      const subIdStr = submissionId.toString();
      subIndex = assignment.submissions.findIndex(s => s._id && s._id.toString() === subIdStr);
    }
    
    if (subIndex === -1 && studentId) {
      const targetStudentId = (studentId._id || studentId).toString();
      subIndex = assignment.submissions.findIndex(s => {
        if (!s.student) return false;
        const sId = (s.student._id || s.student).toString();
        return sId === targetStudentId;
      });
    }

    if (subIndex === -1) {
      // Fallback: If only 1 submission exists, default to it
      if (assignment.submissions.length === 1) {
        subIndex = 0;
      } else {
        return res.status(404).json({ message: "Submission not found for this assignment" });
      }
    }

    const newStatus = status === 'Rejected' ? 'Rejected' : 'Approved';
    assignment.submissions[subIndex].feedback = feedback || '';
    assignment.submissions[subIndex].grade = grade || '';
    assignment.submissions[subIndex].status = newStatus;

    // Check if all submissions are graded/approved
    const allGraded = assignment.submissions.length > 0 && assignment.submissions.every(s => s.status === 'Approved' || s.status === 'Rejected');
    if (allGraded) {
      assignment.status = 'Graded';
    }

    await assignment.save();

    const updatedAssignment = await Assignment.findById(assignment._id)
      .populate("creator", "name role department")
      .populate("createdBy", "name role department")
      .populate("submissions.student", "name email role department");

    // Send notification safely
    try {
      const studentIdToNotify = assignment.submissions[subIndex].student;
      if (studentIdToNotify) {
        const studentUser = await User.findById(studentIdToNotify);
        let targetRole = "Team Member";
        if (studentUser && studentUser.role) {
          const userRoles = studentUser.role.split(',').map(r => r.trim());
          const validEnum = ['Admin', 'HOD', 'Supervisor', 'Team Leader', 'Team Member'];
          const matched = userRoles.find(r => validEnum.includes(r));
          targetRole = matched || "Team Member";
        }

        await Notification.create({
          recipient: studentIdToNotify,
          sender: req.user._id,
          title: `Assignment Submission ${newStatus}`,
          message: `Your submission for "${assignment.title}" has been ${newStatus.toLowerCase()} by ${req.user.name || 'Supervisor'}.${feedback ? ` Feedback: "${feedback}"` : ''}`,
          type: "Feedback",
          link: "/assignments",
          targetRole: targetRole
        });
      }
    } catch (notifErr) {
      console.warn("Notification error during feedback submission (non-fatal):", notifErr.message);
    }

    return res.json({ 
      message: `Submission ${newStatus.toLowerCase()} successfully`, 
      assignment: updatedAssignment 
    });
  } catch (error) {
    console.error("Error in provideFeedback:", error);
    return res.status(500).json({ message: error.message || "Failed to provide feedback" });
  }
};
