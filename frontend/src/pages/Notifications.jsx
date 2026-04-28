import { useEffect, useState } from "react";
import API from "../api/axios";
import Spinner from "../components/Spinner";
import toast from "react-hot-toast";
import { Bell, CheckCheck, Activity } from "lucide-react";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    try {
      const { data } = await API.get("/notifications/my");
      setNotifications(data);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

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

  if (loading) return <Spinner />;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Notifications</h1>
          <p className="page__sub">Stay updated with campus events</p>
        </div>
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
