import Notification from "../models/Notification.js";

export const getNotifications = async (req, res) => {
  try {
    const userRoles = req.user?.role ? req.user.role.split(',').map(r => r.trim()) : [];
    const activeRole = req.activeRole || userRoles[0] || "";
    const query = { recipient: req.user._id };
    
    if (activeRole && activeRole !== "Admin") {
      query.$or = [
        { targetRole: activeRole },
        { targetRole: { $regex: new RegExp(`^${activeRole}$`, 'i') } },
        { targetRole: "General" },
        { targetRole: { $exists: false } },
        { targetRole: null }
      ];
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (notification && notification.recipient.toString() === req.user._id.toString()) {
      notification.isRead = true;
      await notification.save();
      res.json(notification);
    } else {
      res.status(404).json({ message: "Notification not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (notification && notification.recipient.toString() === req.user._id.toString()) {
      await notification.deleteOne();
      res.json({ message: "Notification removed" });
    } else {
      res.status(404).json({ message: "Notification not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userRoles = req.user?.role ? req.user.role.split(',').map(r => r.trim()) : [];
    const activeRole = req.activeRole || userRoles[0] || "";
    const query = { recipient: req.user._id, isRead: false };
    
    if (activeRole && activeRole !== "Admin") {
      query.$or = [
        { targetRole: activeRole },
        { targetRole: { $regex: new RegExp(`^${activeRole}$`, 'i') } },
        { targetRole: "General" },
        { targetRole: { $exists: false } },
        { targetRole: null }
      ];
    }

    const count = await Notification.countDocuments(query);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
