import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const NotificationContext = createContext();

const DUMMY_NOTIFICATIONS = [
  {
      _id: "dummy1",
      title: "Welcome to SmartFYP",
      message: "Explore your dashboard to manage your Final Year Projects effectively.",
      type: "Announcement",
      isRead: false,
      createdAt: new Date().toISOString()
  },
  {
      _id: "dummy2",
      title: "Quick Start Guide",
      message: "Need help? Check the announcements section for a quick guide.",
      type: "General",
      isRead: false,
      createdAt: new Date(Date.now() - 3600000).toISOString()
  }
];

const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // First high chime note
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.12, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second harmonized higher note, slightly delayed
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.08); // A5
    gain2.gain.setValueAtTime(0, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.08, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.45);
  } catch (e) {
    console.warn("Unable to play notification audio chime", e);
  }
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(() => user ? [] : DUMMY_NOTIFICATIONS);
  const [unreadCount, setUnreadCount] = useState(() => user ? 0 : DUMMY_NOTIFICATIONS.length);
  const [loading, setLoading] = useState(false);
  const [activePopups, setActivePopups] = useState([]);
  const [prevUserId, setPrevUserId] = useState(() => user?._id || null);
  const isFirstFetchRef = useRef(true);

  // Synchronize state during render to clear temporary DUMMY_NOTIFICATIONS immediately when user logs in/out
  if ((user?._id || null) !== prevUserId) {
    setPrevUserId(user?._id || null);
    if (user) {
      setNotifications([]);
      setUnreadCount(0);
      setActivePopups([]);
    } else {
      setNotifications(DUMMY_NOTIFICATIONS);
      setUnreadCount(DUMMY_NOTIFICATIONS.length);
      setActivePopups([]);
    }
  }

  const dismissPopup = useCallback((popupId) => {
    setActivePopups(prev => prev.filter(p => p.popupId !== popupId));
  }, []);

  const fetchNotifications = useCallback(async (signal) => {
    if (!user || !user.token) return;
    
    try {
      setLoading(true);
      const res = await axios.get("/api/notifications", { 
        signal,
        timeout: 10000 
      });
      
      const data = res && res.data && Array.isArray(res.data) ? res.data : [];
      
      setNotifications(prev => {
        // Compare with previous list to detect newly arrived unread notifications
        // Don't toast dummy notifications or initial loaded items if previous list was just the default dummy
        const isDefaultDummy = prev.length === 2 && prev[0]._id === 'dummy1' && prev[1]._id === 'dummy2';
        
        const prevIds = new Set(prev.map(n => n._id));
        const newUnreadList = data.filter(n => !n.isRead && !prevIds.has(n._id));
        
        const isFirstLoad = isFirstFetchRef.current;
        isFirstFetchRef.current = false;
        
        if (newUnreadList.length > 0 && !isDefaultDummy && !isFirstLoad && prev.length > 0) {
          // Play buzzer sound and trigger beautiful toast alerts
          playNotificationSound();
          newUnreadList.forEach(n => {
            const popupId = n._id + '-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
            const newPopup = {
              popupId,
              _id: n._id,
              title: n.title,
              message: n.message,
              type: n.type,
              link: n.link,
              createdAt: n.createdAt
            };
            setActivePopups(prevPopups => [...prevPopups, newPopup]);
            setTimeout(() => {
              setActivePopups(prevPopups => prevPopups.filter(p => p.popupId !== popupId));
            }, 6000);
          });
        }
        return data;
      });
      
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (error) {
      if (axios.isCancel(error)) {
        return;
      }
      
      const isNetworkError = error.message === "Network Error" || !error.response;
      
      if (isNetworkError) {
        // Silently handle transient network errors during background polling
        console.warn("Poll: Network connectivity issue or server restarting...");
      } else {
        console.error("Error fetching notifications:", error.message || error);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    isFirstFetchRef.current = true;
    if (!user) {
      const timer = setTimeout(() => {
        setNotifications(DUMMY_NOTIFICATIONS);
        setUnreadCount(DUMMY_NOTIFICATIONS.length);
        setActivePopups([]);
      }, 0);
      return () => clearTimeout(timer);
    }

    let timeoutId;
    const controller = new AbortController();
    
    const poll = async () => {
      await fetchNotifications(controller.signal);
      // Recursive safety timeout: check every 4 seconds for immediate feel
      timeoutId = setTimeout(poll, 4000);
    };
    
    // Initial fetch after a small delay to ensure Auth headers are fully ready
    timeoutId = setTimeout(poll, 1000);
    
    return () => {
      controller.abort();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [fetchNotifications, user]);

  useEffect(() => {
    const handleRoleChanged = () => {
      fetchNotifications();
    };
    window.addEventListener('roleChanged', handleRoleChanged);
    return () => {
      window.removeEventListener('roleChanged', handleRoleChanged);
    };
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      if (!id || String(id).startsWith("dummy")) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        return;
      }
      await axios.patch(`/api/notifications/${id}/read`, {});
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.warn("Failed to mark read on server, doing optimistic client update:", error.message);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    try {
      const realNotifications = notifications.filter(n => n._id && !String(n._id).startsWith("dummy") && !n.isRead);
      if (realNotifications.length > 0) {
        await axios.patch("/api/notifications/read-all", {});
      }
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.warn("Failed to mark all read, doing client update:", error.message);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    }
  };

  const deleteNotification = async (id) => {
    try {
      const wasUnread = !notifications.find(n => n._id === id)?.isRead;
      if (!id || String(id).startsWith("dummy")) {
        setNotifications(prev => prev.filter(n => n._id !== id));
        if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
        toast.success("Notification deleted");
        return;
      }
      await axios.delete(`/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success("Notification deleted");
    } catch (error) {
      console.warn("Failed to delete, doing client removal:", error.message);
      const wasUnread = !notifications.find(n => n._id === id)?.isRead;
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success("Notification deleted");
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      activePopups,
      dismissPopup,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
