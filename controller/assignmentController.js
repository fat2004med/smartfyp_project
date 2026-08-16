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
  const creatorId = assignment.creator?._id?.toString() || assignment.createdBy?.toString() || getUserIdStr(assignment.creator) || getUserIdStr(assignment.createdBy);
  const cRole = assignment.publisherRole || assignment.createdAsRole || assignment.creatorRole || assignment.creator?.role;

  // If the user is the creator:
  if (creatorId === user._id.toString()) {
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

  // User's active role must be targeted
  const matchesRole = (assignment.targetRoles && assignment.targetRoles.includes(activeRole)) || 
                      assignment.targetRole === activeRole ||
                      (assignment.assignedTo && assignment.assignedTo.some(id => id.toString() === user._id.toString()));
  if (!matchesRole) {
    return false;
  }

  const creatorRole = assignment.publisherRole || assignment.createdAsRole || assignment.creatorRole || assignment.creator?.role;
  const creatorIdString = creatorId;

  // 1. Admin's assignments go to anyone matching targetRole in ANY department
  if (creatorRole === "Admin") {
    return true;
  }

  // 2. HOD's assignments only go to users matching targetRole IN THEIR SAME DEPARTMENT
  if (creatorRole === "HOD") {
    const uDeptId = getDepartmentId(user.department);
    const cDeptId = getDepartmentId(assignment.creator?.department);
    return uDeptId && cDeptId && uDeptId === cDeptId;
  }

  // 3. Supervisor's assignments only go to team members/leaders in projects where they are supervisor
  if (creatorRole === "Supervisor") {
    const isAssociated = userProjects.some(proj => {
      const projSupervisor = getUserIdStr(proj.supervisor);
      const projTeamLeader = getUserIdStr(proj.teamLeader);
      const isMember = proj.members.some(m => getUserIdStr(m) === user._id.toString());
      return projSupervisor === creatorIdString && 
             (projTeamLeader === user._id.toString() || isMember);
    });
    return isAssociated;
  }

  // 4. Team Leader's assignments only go to team members in projects where they are teamLeader
  if (creatorRole === "Team Leader") {
    const isAssociated = userProjects.some(proj => {
      const projTeamLeader = getUserIdStr(proj.teamLeader);
      const isMember = proj.members.some(m => getUserIdStr(m) === user._id.toString());
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
      ],
      $and: [
        {
          $or: [
            { publisherRole: activeRole },
            { createdAsRole: activeRole },
            { creatorRole: activeRole }
          ]
        }
      ]
    })
      .populate("creator", "name role department")
      .populate("createdBy", "name role department")
      .populate("submissions.student", "name email role department")
      .sort({ createdAt: -1 });

    res.json(assignments);
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

    if (activeRole !== "Admin") {
      query.createdAt = { $gte: req.user.createdAt };
    }

    const assignments = await Assignment.find(query)
      .populate("creator", "name role department")
      .populate("createdBy", "name role department")
      .populate("submissions.student", "name email role department")
      .sort({ createdAt: -1 });

    // Exclude assignments created by self UNLESS specifically targeted to activeRole in a different capacity
    const filtered = assignments.filter(a => {
      const creatorId = a.creator?._id?.toString() || a.createdBy?.toString() || getUserIdStr(a.creator);
      const cRole = a.publisherRole || a.createdAsRole || a.creatorRole;
      if (creatorId === userId.toString() && cRole === activeRole) {
        return false; // Created in this same role capacity, so belongs in "Published By Me"
      }
      return true;
    });

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAssignments = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.activeRole || (req.user?.role ? req.user.role.split(',')[0].trim() : '');

    if (userRole === "Admin") {
      // Admin sees ALL assignments
      const assignments = await Assignment.find({})
        .populate("creator", "name role department")
        .populate("createdBy", "name role department")
        .populate("submissions.student", "name email role department")
        .sort({ createdAt: -1 });
      return res.json(assignments);
    }

    const baseQuery = {
      createdAt: { $gte: req.user.createdAt }
    };

    const allAssignments = await Assignment.find({
      $or: [
        baseQuery,
        { creator: userId },
        { createdBy: userId }
      ]
    })
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
    const assignment = await Assignment.findById(req.params.id || req.body.assignmentId);
    
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    let subIndex = -1;
    if (submissionId) {
      subIndex = assignment.submissions.findIndex(s => s._id.toString() === submissionId);
    } else if (studentId) {
      subIndex = assignment.submissions.findIndex(s => s.student.toString() === studentId);
    }

    if (subIndex === -1) return res.status(404).json({ message: "Submission not found" });

    assignment.submissions[subIndex].feedback = feedback;
    assignment.submissions[subIndex].grade = grade;
    assignment.submissions[subIndex].status = status || "Approved";

    await assignment.save();

    // Notify the student
    const studentUser = await User.findById(assignment.submissions[subIndex].student);
    const targetRole = studentUser ? studentUser.role : "Team Member";
    await Notification.create({
      recipient: assignment.submissions[subIndex].student,
      sender: req.user._id,
      title: "Assignment Feedback",
      message: `You received feedback on your submission for "${assignment.title}".`,
      type: "Feedback",
      link: "/assignments",
      targetRole: targetRole
    });

    res.json({ message: "Feedback provided successfully", assignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
