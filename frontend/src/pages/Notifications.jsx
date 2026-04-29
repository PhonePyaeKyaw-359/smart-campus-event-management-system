import { useEffect, useState } from "react";
import API from "../api/axios";
import Spinner from "../components/Spinner";
import toast from "react-hot-toast";
import { Bell, CheckCheck, Activity } from "lucide-react";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const { data } = await API.get("/notifications/my");
      setNotifications(data);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNotifications(); }, []);

  const markRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const markAllRead = async () => {
    try {
      await API.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) return <Spinner />;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Notifications</h1>
          <p className="page__sub">
            Stay updated with campus events
            {unreadCount > 0 && (
              <span className="badge badge--info" style={{ marginLeft: "0.5rem" }}>
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn--outline" onClick={markAllRead}>
            <CheckCheck size={16} /> Mark All as Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <Bell size={48} />
          <p>No notifications</p>
        </div>
      ) : (
        <div className="notification-list notification-list--page">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`notification-card ${!n.is_read ? "notification-card--unread" : ""}`}
            >
              <div className="notification-card__icon">
                <Activity size={18} />
              </div>
              <div className="notification-card__body">
                {n.title && <p className="notification-card__title">{n.title}</p>}
                <p className="notification-card__msg">{n.message}</p>
                <span className="notification-card__time">
                  {new Date(n.created_at).toLocaleString()}
                </span>
              </div>
              {!n.is_read && (
                <button className="btn btn--sm btn--ghost" onClick={() => markRead(n.id)}>
                  <CheckCheck size={16} /> Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
