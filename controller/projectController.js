import Project from "../models/Project.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import Task from "../models/Task.js";
import Department from "../models/Department.js";
import Submission from "../models/Submission.js";

export const getProjects = async (req, res) => {
  try {
    let query = {};
    const activeRole = req.activeRole || (req.user?.role ? req.user.role.split(',')[0].trim() : '');
    if (req.user && activeRole !== "Admin") {
      if (activeRole === "HOD") {
        let deptId = req.user.department?._id || req.user.department;
        if (!deptId) {
          const dept = await Department.findOne({ hod: req.user._id });
          if (dept) deptId = dept._id;
        }
        if (deptId) {
          query.department = deptId;
        } else {
          query._id = { $in: [] }; // No department, no data
        }
      } else if (activeRole === "Supervisor") {
        query.supervisor = req.user._id;
      } else {
        // Team Leader / Team Member
        const userProject = await Project.findOne({ 
          $or: [{ members: req.user._id }, { teamLeader: req.user._id }] 
        });
        if (userProject) {
          query = { _id: userProject._id };
        } else {
          query = { _id: null }; // No project assigned yet
        }
      }
    }

    const projects = await Project.find(query)
      .populate("department", "name")
      .populate("supervisor", "name email phone interests")
      .populate("teamLeader", "name email phone")
      .populate("members", "name email phone")
      .populate("feedback.author", "name role");

    // Compute progress for each fetched project in real-time and save
    await Promise.all(projects.map(async (p) => {
      const totalTasks = await Task.countDocuments({ project: p._id });
      const completedTasks = await Task.countDocuments({ project: p._id, status: "Completed" });
      
      let computedProg;
      if (p.status === "Completed" || p.status === "Published") {
        computedProg = 100;
      } else if (totalTasks > 0) {
        computedProg = Math.round((completedTasks / totalTasks) * 100);
      } else {
        switch (p.currentPhase) {
          case "Proposal":
            computedProg = p.status === "Proposed" ? 10 : 20;
            break;
          case "Analysis":
            computedProg = 40;
            break;
          case "Design":
            computedProg = 60;
            break;
          case "Implementation":
            computedProg = 80;
            break;
          case "Final":
            computedProg = 95;
            break;
          default:
            computedProg = p.progress || 15;
        }
      }

      if (p.progress !== computedProg) {
        p.progress = computedProg;
        await p.save();
      }
    }));

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("department")
      .populate("supervisor")
      .populate("teamLeader")
      .populate("members")
      .populate("feedback.author", "name role");
    if (project) {
      // Calculate and save progress dynamically
      const totalTasks = await Task.countDocuments({ project: project._id });
      const completedTasks = await Task.countDocuments({ project: project._id, status: "Completed" });
      
      let computedProg = 0;
      if (project.status === "Completed" || project.status === "Published") {
        computedProg = 100;
      } else if (totalTasks > 0) {
        computedProg = Math.round((completedTasks / totalTasks) * 100);
      } else {
        switch (project.currentPhase) {
          case "Proposal":
            computedProg = project.status === "Proposed" ? 10 : 20;
            break;
          case "Analysis":
            computedProg = 40;
            break;
          case "Design":
            computedProg = 60;
            break;
          case "Implementation":
            computedProg = 80;
            break;
          case "Final":
            computedProg = 95;
            break;
          default:
            computedProg = project.progress || 15;
        }
      }

      if (project.progress !== computedProg) {
        project.progress = computedProg;
        await project.save();
      }

      res.json(project);
    } else {
      res.status(404).json({ message: "Project not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProject = async (req, res) => {
  try {
    const { teamName } = req.body;
    
    // Check if teamName (Team ID) is unique if provided
    if (teamName && teamName.trim() !== "") {
      const existingTeam = await Project.findOne({
        teamName: { $regex: new RegExp("^" + teamName.trim() + "$", "i") }
      });
      if (existingTeam) {
        return res.status(400).json({ message: `Team ID "${teamName}" already exists. Please choose a unique Team ID.` });
      }
    }

    const projectData = {
      ...req.body,
      department: req.body.department || (req.user.department?._id || req.user.department),
      academicYear: req.body.academicYear || new Date().getFullYear().toString(),
      batch: req.body.batch || `${new Date().getFullYear()}-${new Date().getFullYear() + 4}`,
      description: req.body.description || req.body.abstract || "No description provided",
      status: req.body.status || "Proposed"
    };

    const project = await Project.create(projectData);

    // If the supervisor is an HOD, automatically upgrade their role to "HOD, Supervisor"
    if (project.supervisor) {
      const supervisorUser = await User.findById(project.supervisor);
      if (supervisorUser && supervisorUser.role === "HOD") {
        supervisorUser.role = "HOD, Supervisor";
        await supervisorUser.save();
      }
    }

    // Notify supervisor, team leader, and team members when team/project is registered
    const recipients = [];
    if (project.supervisor) {
      recipients.push({ id: project.supervisor, role: "Supervisor" });
    }
    if (project.teamLeader) {
      recipients.push({ id: project.teamLeader, role: "Team Leader" });
    }
    if (project.members && project.members.length > 0) {
      project.members.forEach(memberId => {
        recipients.push({ id: memberId, role: "Team Member" });
      });
    }

    for (const item of recipients) {
      if (item.id.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: item.id,
          sender: req.user._id,
          title: "New Team Registered",
          message: `You have been allocated to the new team/project "${project.title || project.teamName}" as a ${item.role}.`,
          type: "General",
          link: "/dashboard/team",
          targetRole: item.role
        });
      }
    }

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (project) {
      const { teamName } = req.body;
      
      // Check if teamName (Team ID) is unique if changed
      if (teamName && teamName.trim() !== "" && teamName !== project.teamName) {
        const existingTeam = await Project.findOne({
          teamName: { $regex: new RegExp("^" + teamName.trim() + "$", "i") },
          _id: { $ne: req.params.id }
        });
        if (existingTeam) {
          return res.status(400).json({ message: `Team ID "${teamName}" already exists. Please choose a unique Team ID.` });
        }
      }

      Object.assign(project, req.body);
      await project.save();

      // If the supervisor is an HOD, automatically upgrade their role to "HOD, Supervisor"
      if (project.supervisor) {
        const supervisorUser = await User.findById(project.supervisor);
        if (supervisorUser && supervisorUser.role === "HOD") {
          supervisorUser.role = "HOD, Supervisor";
          await supervisorUser.save();
        }
      }

      // Notify supervisor, team leader, and team members when team details are updated
      const updateRecipients = [];
      if (project.supervisor) {
        updateRecipients.push({ id: project.supervisor, role: "Supervisor" });
      }
      if (project.teamLeader) {
        updateRecipients.push({ id: project.teamLeader, role: "Team Leader" });
      }
      if (project.members && project.members.length > 0) {
        project.members.forEach(memberId => {
          updateRecipients.push({ id: memberId, role: "Team Member" });
        });
      }

      for (const item of updateRecipients) {
        if (item.id.toString() !== req.user._id.toString()) {
          await Notification.create({
            recipient: item.id,
            sender: req.user._id,
            title: "Project Details Updated",
            message: `The details of your team/project "${project.title || project.teamName}" have been updated by ${req.user.name}.`,
            type: "General",
            link: "/dashboard/team",
            targetRole: item.role
          });
        }
      }

      const populatedProject = await Project.findById(project._id)
        .populate("department")
        .populate("supervisor")
        .populate("teamLeader")
        .populate("members", "name email role phone");
      res.json(populatedProject);
    } else {
      res.status(404).json({ message: "Project not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (project) {
      // Cascade delete related Tasks and Submissions to avoid orphaned documents
      await Task.deleteMany({ project: project._id });
      await Submission.deleteMany({ project: project._id });
      
      await project.deleteOne();
      res.json({ message: "Project and associated tasks/submissions removed successfully" });
    } else {
      res.status(404).json({ message: "Project not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyProject = async (req, res) => {
  try {
    const project = await Project.findOne({ 
      $or: [{ members: req.user._id }, { teamLeader: req.user._id }] 
    })
      .populate("department")
      .populate("supervisor")
      .populate("teamLeader")
      .populate("members", "name email role phone")
      .populate("feedback.author", "name role");
    if (project) {
      res.json(project);
    } else {
      res.status(404).json({ message: "No project found for your team" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTeamProject = async (req, res) => {
  try {
    const project = await Project.findOne({ members: req.user._id })
      .populate("members", "name email role profilePicture phone");
    if (project) {
      res.json(project);
    } else {
      res.status(404).json({ message: "Project not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPublicProjects = async (req, res) => {
  try {
    const projects = await Project.find({ isPublic: true })
      .populate("department", "name")
      .populate("supervisor", "name email phone interests")
      .populate("teamLeader", "name email role phone")
      .populate("members", "name email role phone");
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addProjectFeedback = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const { content, text, grade } = req.body;
    
    if (!project.feedback) {
      project.feedback = [];
    }
    
    project.feedback.push({
      author: req.user._id,
      content: content || text,
      role: req.activeRole || (req.user?.role ? req.user.role.split(',')[0].trim() : ''),
      createdAt: new Date()
    });

    if (grade) project.grade = grade;

    await project.save();

    // Send Real-Time Notifications for Project Feedback
    const recipients = [...(project.members || []), project.teamLeader].filter(Boolean);
    for (const recipientId of recipients) {
      if (recipientId.toString() !== req.user._id.toString()) {
        const isLeader = project.teamLeader && project.teamLeader.toString() === recipientId.toString();
        const targetRole = isLeader ? "Team Leader" : "Team Member";
        await Notification.create({
          recipient: recipientId,
          sender: req.user._id,
          title: "New Feedback on Project",
          message: `${req.user.name} (${req.activeRole || (req.user?.role ? req.user.role.split(',')[0].trim() : '')}) has added feedback to your project "${project.title}"`,
          type: "Feedback",
          link: "/feedback",
          targetRole: targetRole
        });
      }
    }

    const populatedProject = await Project.findById(project._id)
      .populate("department")
      .populate("supervisor")
      .populate("teamLeader")
      .populate("members")
      .populate("feedback.author", "name role");

    res.json(populatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const role = req.activeRole || (req.user?.role ? req.user.role.split(',')[0].trim() : '');
    let notifyTitle = "";
    let notifyMessage = "";
    let notifyRecipients = [];

    if (role === "Supervisor" || (role === "HOD" && project.supervisor && project.supervisor.toString() === req.user._id.toString() && !project.isApprovedBySupervisor)) {
      project.isApprovedBySupervisor = true;
      notifyTitle = "Supervisor Approved Project";
      notifyMessage = `Your project "${project.title}" was approved by the Supervisor! Pending HOD approval.`;
      
      const hods = await User.find({ role: { $regex: /\bHOD\b/ }, department: project.department });
      notifyRecipients = hods.map(h => h._id);
    } else if (role === "HOD") {
      if (!project.isApprovedBySupervisor) {
        return res.status(400).json({ message: "Cannot approve. Must be approved by Supervisor first." });
      }
      project.isApprovedByHOD = true;
      notifyTitle = "HOD Approved Project";
      notifyMessage = `Your project "${project.title}" was approved by the HOD! Pending final Admin approval.`;
      
      const admins = await User.find({ role: "Admin" });
      notifyRecipients = admins.map(a => a._id);
    } else if (role === "Admin") {
      if (!project.isApprovedByHOD) {
        return res.status(400).json({ message: "Cannot approve. Must be approved by HOD first." });
      }
      project.isApprovedByAdmin = true;
      project.status = "Approved";
      notifyTitle = "Your Project is Fully Approved!";
      notifyMessage = `Congratulations! Your project "${project.title}" was officially approved by the Admin.`;
    } else {
      return res.status(403).json({ message: "Unauthorized to approve projects" });
    }

    await project.save();

    // ALWAYS notify Team members and Team Leader
    const teamRecipients = [...(project.members || []), project.teamLeader].filter(Boolean);
    const allRecipients = Array.from(new Set([...notifyRecipients.map(id => id.toString()), ...teamRecipients.map(id => id.toString())]));

    for (const recipientId of allRecipients) {
      if (recipientId.toString() !== req.user._id.toString()) {
        let recipientTargetRole = undefined;
        if (notifyRecipients.some(id => id.toString() === recipientId.toString())) {
          recipientTargetRole = (role === "Supervisor" || (role === "HOD" && project.supervisor && project.supervisor.toString() === req.user._id.toString() && !project.isApprovedBySupervisor)) ? "HOD" : "Admin";
        } else {
          if (project.teamLeader && project.teamLeader.toString() === recipientId.toString()) {
            recipientTargetRole = "Team Leader";
          } else {
            recipientTargetRole = "Team Member";
          }
        }
        await Notification.create({
          recipient: recipientId,
          sender: req.user._id,
          title: notifyTitle,
          message: notifyMessage,
          type: "Submission",
          link: "/dashboard/records",
          targetRole: recipientTargetRole
        });
      }
    }

    const populatedProject = await Project.findById(project._id)
      .populate("department")
      .populate("supervisor")
      .populate("teamLeader")
      .populate("members", "name email role phone");
    res.json(populatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    project.status = "Active";
    project.isApprovedBySupervisor = false;
    project.isApprovedByHOD = false;
    project.isApprovedByAdmin = false;
    await project.save();

    const teamRecipients = [...(project.members || []), project.teamLeader].filter(Boolean);
    for (const recipientId of teamRecipients) {
      if (recipientId.toString() !== req.user._id.toString()) {
        const isLeader = project.teamLeader && project.teamLeader.toString() === recipientId.toString();
        const targetRole = isLeader ? "Team Leader" : "Team Member";
        await Notification.create({
          recipient: recipientId,
          sender: req.user._id,
          title: "Project Returned for Revision",
          message: `Your project "${project.title}" was returned to In Progress status by ${req.activeRole || (req.user?.role ? req.user.role.split(',')[0].trim() : '')}. Please revise details.`,
          type: "Submission",
          link: "/dashboard/team-leader",
          targetRole: targetRole
        });
      }
    }

    const populatedProject = await Project.findById(project._id)
      .populate("department")
      .populate("supervisor")
      .populate("teamLeader")
      .populate("members", "name email role phone");
    res.json(populatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const completeProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    project.status = "Completed";
    await project.save();

    if (project.supervisor) {
      await Notification.create({
        recipient: project.supervisor,
        sender: req.user._id,
        title: "Project Ready for Review",
        message: `The project "${project.title}" has been submitted for completion approval by Team Leader.`,
        type: "Submission",
        link: "/dashboard/records",
        targetRole: "Supervisor"
      });
    }

    if (project.members && project.members.length > 0) {
      for (const mId of project.members) {
        if (mId.toString() !== req.user._id.toString()) {
          await Notification.create({
            recipient: mId,
            sender: req.user._id,
            title: "Project Marked as Completed",
            message: `Your team project "${project.title}" was marked as Completed by the Team Leader and is now ready for supervisor review.`,
            type: "General",
            link: "/dashboard/team",
            targetRole: "Team Member"
          });
        }
      }
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const activateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    project.status = "Active";
    await project.save();

    const teamRecipients = [...(project.members || []), project.teamLeader].filter(Boolean);
    for (const recipientId of teamRecipients) {
      if (recipientId.toString() !== req.user._id.toString()) {
        const isLeader = project.teamLeader && project.teamLeader.toString() === recipientId.toString();
        const targetRole = isLeader ? "Team Leader" : "Team Member";
        await Notification.create({
          recipient: recipientId,
          sender: req.user._id,
          title: "Project Activated",
          message: `Your Proposed project "${project.title}" has been activated to In Progress!`,
          type: "General",
          link: "/dashboard/tasks",
          targetRole: targetRole
        });
      }
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const publishProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    project.isPublic = true;
    project.status = "Published";
    await project.save();

    const publishRecipients = [];
    if (project.supervisor) publishRecipients.push({ id: project.supervisor, role: "Supervisor" });
    if (project.teamLeader) publishRecipients.push({ id: project.teamLeader, role: "Team Leader" });
    if (project.members && project.members.length > 0) {
      project.members.forEach(mId => publishRecipients.push({ id: mId, role: "Team Member" }));
    }
    for (const item of publishRecipients) {
      if (item.id.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: item.id,
          sender: req.user._id,
          title: "Project Published!",
          message: `Fantastic news! Your project "${project.title}" has been officially published and is now visible to the public.`,
          type: "General",
          link: "/dashboard/team",
          targetRole: item.role
        });
      }
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
