import { useEffect, useState } from "react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";
import {
  BarChart2, Calendar, ClipboardList, Users,
  TrendingUp, Bell, Star, Activity
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#6366f1", "#22d3ee", "#f59e0b", "#10b981", "#f43f5e"];

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="stat-card">
    <div className="stat-card__info">
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value ?? "—"}</p>
    </div>
    <div className="stat-card__icon" style={{ background: color + "22", color }}>
      <Icon size={26} />
    </div>
  </div>
);

const Dashboard = () => {
  const { user, isAdminOrFaculty } = useAuth();
  const [summary, setSummary] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [feedbackReport, setFeedbackReport] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const notiRes = await API.get("/notifications/my");
        setNotifications(notiRes.data?.slice(0, 5) || []);

        if (isAdminOrFaculty) {
          const [sumRes, attRes, fbRes] = await Promise.all([
            API.get("/reports/summary"),
            API.get("/reports/attendance"),
            API.get("/reports/feedback"),
          ]);
          setSummary(sumRes.data);
          setAttendance(attRes.data?.slice(0, 6) || []);
          setFeedbackReport(fbRes.data?.slice(0, 5) || []);
        }
      } catch {
        // silently ignore
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [isAdminOrFaculty]);

  if (loading) return <Spinner />;

  const pieData = feedbackReport.map((f) => ({
    name: f.title || "Event",
    value: parseFloat(f.average_rating) || 0,
  }));

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Dashboard</h1>
          <p className="page__sub">Welcome back, <strong>{user?.name}</strong> 👋</p>
        </div>
        <span className={`badge badge--${user?.role}`}>{user?.role}</span>
      </div>

      {isAdminOrFaculty && summary && (
        <div className="stat-grid">
          <StatCard label="Total Events" value={summary.total_events} icon={Calendar} color="#6366f1" />
          <StatCard label="Total Users" value={summary.total_users} icon={Users} color="#22d3ee" />
          <StatCard label="Registrations" value={summary.total_registrations} icon={ClipboardList} color="#f59e0b" />
          <StatCard label="Total Resources" value={summary.total_resources} icon={Star} color="#10b981" />
        </div>
      )}

      <div className={`dashboard-grid ${isAdminOrFaculty ? "" : "dashboard-grid--single"}`}>
        {isAdminOrFaculty && attendance.length > 0 && (
          <div className="card">
            <div className="card__header">
              <TrendingUp size={20} />
              <h2 className="card__title">Event Attendance</h2>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={attendance} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="title" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(0, 10)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total_registered" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {isAdminOrFaculty && pieData.length > 0 && (
          <div className="card">
            <div className="card__header">
              <BarChart2 size={20} />
              <h2 className="card__title">Feedback Ratings</h2>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="card">
          <div className="card__header">
            <Bell size={20} />
            <h2 className="card__title">Recent Notifications</h2>
          </div>
          {notifications.length === 0 ? (
            <p className="empty-text">No notifications yet</p>
          ) : (
            <ul className="notification-list">
              {notifications.map((n) => (
                <li key={n.id} className={`notification-item ${!n.is_read ? "notification-item--unread" : ""}`}>
                  <Activity size={14} className="notification-item__icon" />
                  <div>
                    <p className="notification-item__msg">{n.message}</p>
                    <span className="notification-item__time">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
