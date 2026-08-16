import Announcement from "../models/Announcement.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

export const getPublishedAnnouncements = async (req, res) => {
  try {
    const userId = req.user._id;
    const activeRole = req.activeRole || (req.user?.role ? req.user.role.split(',')[0].trim() : '');

    const query = {
      author: userId,
      $or: [
        { authorRole: activeRole },
        { publisherRole: activeRole },
        { createdAsRole: activeRole }
      ]
    };

    const announcements = await Announcement.find(query)
      .populate("author", "name role")
      .populate("department", "name")
      .sort({ createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAnnouncements = async (req, res) => {
  try {
    let query = {};
    const userRoles = req.user?.role ? req.user.role.split(',').map(r => r.trim()) : [];
    const activeRole = req.activeRole || userRoles[0] || "";
    
    if (req.user && !userRoles.includes("Admin")) {
      const userDept = req.user.department?._id || req.user.department;
      const targetRolesFilter = activeRole ? [activeRole] : userRoles;
      
      const conditions = [];

      // 1. Announcements targeted specifically to active role
      conditions.push({ targetRoles: { $in: targetRolesFilter } });

      // 2. Department announcements open to active role
      if (userDept) {
        const deptCondition = {
          department: userDept,
          $or: [
            { targetRoles: { $exists: false } },
            { targetRoles: { $size: 0 } },
            { targetRoles: { $in: targetRolesFilter } }
          ]
        };
        conditions.push(deptCondition);
      }

      // 3. General announcements open to active role
      const generalCondition = {
        department: null,
        $or: [
          { targetRoles: { $exists: false } },
          { targetRoles: { $size: 0 } },
          { targetRoles: { $in: targetRolesFilter } }
        ]
      };
      conditions.push(generalCondition);

      query = { 
        $or: conditions
      };
    }

    const announcements = await Announcement.find(query)
      .populate("author", "name role")
      .populate("department", "name")
      .sort({ createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAnnouncementById = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate("author", "name role")
      .populate("department", "name");
    if (announcement) {
      res.json(announcement);
    } else {
      res.status(404).json({ message: "Announcement not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    let { title, description, targetRoles, department, category, priority } = req.body;

    if (typeof targetRoles === "string") {
      try {
        targetRoles = JSON.parse(targetRoles);
      } catch (e) {
        targetRoles = [targetRoles];
      }
    }

    const finalDepartment = department || (!req.user.role.includes("Admin") ? (req.user.department?._id || req.user.department) : null);
    const activeRole = req.activeRole || (req.user?.role ? req.user.role.split(',')[0].trim() : '');

    // Enforce role hierarchy on backend
    const rolesHierarchy = ['Admin', 'HOD', 'Supervisor', 'Team Leader', 'Team Member'];
    const creatorIndex = rolesHierarchy.indexOf(activeRole);
    const validTargetRoles = creatorIndex !== -1 ? rolesHierarchy.slice(creatorIndex + 1) : [];

    if (Array.isArray(targetRoles)) {
      targetRoles = targetRoles.filter(r => validTargetRoles.includes(r));
    } else {
      targetRoles = [];
    }

    if (targetRoles.length === 0) {
      return res.status(400).json({ 
        message: `At least one valid target role lower than your own role (${validTargetRoles.join(', ') || 'none obtainable'}) must be selected.` 
      });
    }

    const announcement = await Announcement.create({
      title,
      description,
      targetRoles,
      department: finalDepartment,
      category,
      priority,
      attachmentUrl: req.file ? `/uploads/${req.file.filename}` : req.body.attachmentUrl,
      author: req.user._id,
      authorRole: activeRole,
      publisherRole: activeRole,
      createdAsRole: activeRole
    });

    // Notify users within the same tenant/department scope
    const query = {};
    if (targetRoles && targetRoles.length > 0) {
      query.$or = targetRoles.map(role => ({
        role: { $regex: new RegExp(`\\b${role}\\b`, 'i') }
      }));
    }
    if (finalDepartment) {
      query.department = finalDepartment;
    }

    const usersToNotify = await User.find(query);
    if (usersToNotify.length > 0) {
      const notifications = usersToNotify.map(user => {
        const matchedRole = (targetRoles && targetRoles.length > 0)
          ? targetRoles.find(tr => user.role.split(',').map(r => r.trim()).includes(tr))
          : undefined;
        return {
          recipient: user._id,
          sender: req.user._id,
          title: "New Announcement",
          message: `${title}`,
          type: "Announcement",
          link: "/announcements",
          targetRole: matchedRole || (user.role.includes("HOD") ? "HOD" : (user.role.includes("Supervisor") ? "Supervisor" : "Team Member"))
        };
      });
      await Notification.insertMany(notifications);
    }

    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (announcement) {
      Object.assign(announcement, req.body);
      const updatedAnnouncement = await announcement.save();
      res.json(updatedAnnouncement);
    } else {
      res.status(404).json({ message: "Announcement not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (announcement) {
      await announcement.deleteOne();
      res.json({ message: "Announcement removed" });
    } else {
      res.status(404).json({ message: "Announcement not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyAnnouncements = async (req, res) => {
  try {
    const userRoles = req.user?.role ? req.user.role.split(',').map(r => r.trim()) : [];
    const activeRole = req.activeRole || userRoles[0] || "";
    const userDept = req.user.department?._id || req.user.department;
    const targetRolesFilter = activeRole ? [activeRole] : userRoles;
    
    let query = {};
    if (!userRoles.includes("Admin")) {
      const conditions = [];

      // 1. My own announcements authored in this active role capacity
      if (activeRole) {
        conditions.push({ author: req.user._id, authorRole: activeRole });
      } else {
        conditions.push({ author: req.user._id });
      }

      // 2. Announcements targeted specifically to active role
      conditions.push({ targetRoles: { $in: targetRolesFilter } });

      // 3. Department announcements open to active role
      if (userDept) {
        const deptCondition = {
          department: userDept,
          $or: [
            { targetRoles: { $exists: false } },
            { targetRoles: { $size: 0 } },
            { targetRoles: { $in: targetRolesFilter } }
          ]
        };
        conditions.push(deptCondition);
      }

      // 4. General announcements open to active role
      const generalCondition = {
        department: null,
        $or: [
          { targetRoles: { $exists: false } },
          { targetRoles: { $size: 0 } },
          { targetRoles: { $in: targetRolesFilter } }
        ]
      };
      conditions.push(generalCondition);

      query = {
        $or: conditions
      };
    }
    
    const announcements = await Announcement.find(query).populate("author", "name role").sort({ createdAt: -1 });
    
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
