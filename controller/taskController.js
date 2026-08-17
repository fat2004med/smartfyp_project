import Task from "../models/Task.js";
import Project from "../models/Project.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

export const getTasks = async (req, res) => {
  try {
    const query = {};
    
    // Admins see all tasks. HODs are restricted to their own department.
    const activeRole = req.activeRole || (req.user?.role ? req.user.role.split(',')[0].trim() : '');
    if (req.user && activeRole !== "Admin") {
      if (activeRole === "Team Member") {
        query.assignee = req.user._id;
      } else if (activeRole === "Team Leader") {
        query.$or = [
          { assignee: req.user._id },
          { assignedBy: req.user._id }
        ];
      } else if (activeRole === "HOD") {
        const projects = await Project.find({ department: req.user.department?._id || req.user.department });
        const projectIds = projects.map(p => p._id);
        query.$or = [
          { project: { $in: projectIds } },
          { assignedBy: req.user._id }
        ];
      } else if (activeRole === "Supervisor") {
        const projects = await Project.find({ supervisor: req.user._id });
        const projectIds = projects.map(p => p._id);
        query.$or = [
          { project: { $in: projectIds } },
          { assignedBy: req.user._id }
        ];
      } else {
        // Find all projects where the user is involved
        const projects = await Project.find({ 
          $or: [
            { members: req.user._id },
            { supervisor: req.user._id },
            { teamLeader: req.user._id }
          ]
        });

        if (projects.length > 0) {
          const projectIds = projects.map(p => p._id);
          query.$or = [
            { project: { $in: projectIds } },
            { assignee: req.user._id },
            { assignedBy: req.user._id }
          ];
        } else {
          // If not in any project, only see direct assignments
          query.$or = [
            { assignee: req.user._id },
            { assignedBy: req.user._id }
          ];
        }
      }
    }

    const tasks = await Task.find(query)
      .populate("project", "title")
      .populate("assignedBy", "name")
      .populate("assignee", "name")
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate("project").populate("assignedBy").populate("assignee");
    if (task) {
      res.json(task);
    } else {
      res.status(404).json({ message: "Task not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const task = await Task.create({
      ...req.body,
      assignedBy: req.user._id
    });

    // Notify assignee
    if (task.assignee) {
      const assigneeUser = await User.findById(task.assignee);
      const targetRole = assigneeUser ? assigneeUser.role : "Team Member";
      await Notification.create({
        recipient: task.assignee,
        sender: req.user._id,
        title: "New Task Assigned",
        message: `You have been assigned a new task: ${task.title}`,
        type: "Task",
        link: "/tasks",
        targetRole: targetRole
      });
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (task) {
      Object.assign(task, req.body);
      const updatedTask = await task.save();
      res.json(updatedTask);
    } else {
      res.status(404).json({ message: "Task not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (task) {
      await task.deleteOne();
      res.json({ message: "Task removed" });
    } else {
      res.status(404).json({ message: "Task not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyTasks = async (req, res) => {
  try {
    const query = { assignee: req.user._id };
    const tasks = await Task.find(query)
      .populate("project", "title")
      .populate("assignedBy", "name")
      .sort({ deadline: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjectTasks = async (req, res) => {
  try {
    const project = await Project.findOne({ 
      $or: [{ members: req.user._id }, { teamLeader: req.user._id }] 
    });
    if (!project) return res.json([]);
    
    const query = { project: project._id };
    
    const tasks = await Task.find(query)
      .populate("assignee", "name profilePicture")
      .populate("assignedBy", "name")
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id, 
      { status: req.body.status },
      { new: true }
    );
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Notify person who assigned the task
    if (task.assignedBy) {
      try {
        const recipient = await User.findById(task.assignedBy);
        if (recipient) {
          const taskProject = await Project.findById(task.project);
          let targetRole = "Supervisor"; // Default fallback
          if (taskProject) {
            if (taskProject.supervisor && taskProject.supervisor.toString() === recipient._id.toString()) {
              targetRole = "Supervisor";
            } else if (recipient.role.includes("HOD")) {
              targetRole = "HOD";
            }
          } else if (recipient.role.includes("HOD")) {
            targetRole = "HOD";
          }
          const rolePath = targetRole.toLowerCase().replace(/\s+/g, '-');
          await Notification.create({
            recipient: task.assignedBy,
            sender: req.user._id,
            title: "Task Status Updated",
            message: `Task "${task.title}" status changed to ${task.status}`,
            type: "Task",
            link: `/dashboard/${rolePath}/assigned-tasks`,
            targetRole: targetRole
          });
        }
      } catch (err) {
        console.error("Failed to send notification:", err);
      }
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const submitTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { link, comments } = req.body;
    
    let fileUrl = null;
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
    }

    const task = await Task.findByIdAndUpdate(
      id,
      {
        status: "Reviewing",
        submission: {
          link,
          fileUrl,
          comments,
          submittedAt: new Date()
        }
      },
      { new: true }
    );
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Notify the person who assigned the task
    if (task.assignedBy) {
      try {
        const recipient = await User.findById(task.assignedBy);
        if (recipient) {
          const taskProject = await Project.findById(task.project);
          let targetRole = "Supervisor"; // Default fallback
          if (taskProject) {
            if (taskProject.supervisor && taskProject.supervisor.toString() === recipient._id.toString()) {
              targetRole = "Supervisor";
            } else if (recipient.role.includes("HOD")) {
              targetRole = "HOD";
            }
          } else if (recipient.role.includes("HOD")) {
            targetRole = "HOD";
          }
          const rolePath = targetRole.toLowerCase().replace(/\s+/g, '-');
          await Notification.create({
            recipient: task.assignedBy,
            sender: req.user._id,
            title: "Task Work Submitted",
            message: `Work has been submitted for task: ${task.title}. It is now in Reviewing status.`,
            type: "Task",
            link: `/dashboard/${rolePath}/task-review`,
            targetRole: targetRole
          });
        }
      } catch (err) {
        console.error("Failed to send notification:", err);
      }
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const reviewTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, grade, feedback } = req.body;

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.status = status;
    if (task.submission) {
      task.submission.grade = grade;
      task.submission.feedback = feedback;
    } else {
      task.submission = { grade, feedback };
    }

    const updatedTask = await task.save();

    // Notify assignee
    const assigneeUser = await User.findById(task.assignee);
    const targetRole = assigneeUser ? assigneeUser.role : "Team Member";
    await Notification.create({
      recipient: task.assignee,
      sender: req.user._id,
      title: "Task Review Completed",
      message: `Your task "${task.title}" has been reviewed. Status: ${status}`,
      type: "Task",
      link: "/dashboard/tasks", // Default fallback or specific if needed
      targetRole: targetRole
    });

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTaskStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const stats = {
      total: await Task.countDocuments({ assignee: userId }),
      completed: await Task.countDocuments({ assignee: userId, status: "Completed" }),
      pending: await Task.countDocuments({ assignee: userId, status: { $in: ["Pending", "Not Started", "In Progress"] } }),
      reviewing: await Task.countDocuments({ assignee: userId, status: "Reviewing" })
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
