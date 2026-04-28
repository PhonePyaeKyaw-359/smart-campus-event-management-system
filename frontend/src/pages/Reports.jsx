import { useEffect, useState } from "react";
import API from "../api/axios";
import Spinner from "../components/Spinner";
import toast from "react-hot-toast";
import { BarChart2, Users, Star, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from "recharts";

const Reports = () => {
  const [summary, setSummary] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [s, a, f] = await Promise.all([
          API.get("/reports/summary"),
          API.get("/reports/attendance"),
          API.get("/reports/feedback"),
        ]);
        setSummary(s.data);
        setAttendance(a.data || []);
        setFeedback(f.data || []);
      } catch {
        toast.error("Failed to load reports");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Reports & Analytics</h1>
          <p className="page__sub">Insights into campus event performance</p>
        </div>
      </div>

      {summary && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-card__info">
              <p className="stat-card__label">Total Events</p>
              <p className="stat-card__value">{summary.total_events}</p>
            </div>
            <div className="stat-card__icon" style={{ background: "#6366f122", color: "#6366f1" }}>
              <BarChart2 size={26} />
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card__info">
              <p className="stat-card__label">Total Users</p>
              <p className="stat-card__value">{summary.total_users}</p>
            </div>
            <div className="stat-card__icon" style={{ background: "#22d3ee22", color: "#22d3ee" }}>
              <Users size={26} />
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card__info">
              <p className="stat-card__label">Total Registrations</p>
              <p className="stat-card__value">{summary.total_registrations}</p>
            </div>
            <div className="stat-card__icon" style={{ background: "#f59e0b22", color: "#f59e0b" }}>
              <TrendingUp size={26} />
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card__info">
              <p className="stat-card__label">Total Resources</p>
              <p className="stat-card__value">{summary.total_resources}</p>
            </div>
            <div className="stat-card__icon" style={{ background: "#10b98122", color: "#10b981" }}>
              <Star size={26} />
            </div>
          </div>
        </div>
      )}

      <div className="reports-grid">
        {attendance.length > 0 && (
          <div className="card">
            <div className="card__header">
              <TrendingUp size={20} />
              <h2 className="card__title">Event Attendance</h2>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={attendance} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="title" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => v?.slice(0, 12)} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} />
                <Bar dataKey="total_registered" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {feedback.length > 0 && (
          <div className="card">
            <div className="card__header">
              <Star size={20} />
              <h2 className="card__title">Feedback Ratings by Event</h2>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={feedback} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="title" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => v?.slice(0, 12)} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} />
                <Line type="monotone" dataKey="average_rating" stroke="#22d3ee" strokeWidth={2} dot={{ r: 5, fill: "#22d3ee" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {attendance.length > 0 && (
        <div className="card" style={{ marginTop: "1.5rem" }}>
          <div className="card__header">
            <BarChart2 size={20} />
            <h2 className="card__title">Attendance Details</h2>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Total Registered</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((a, i) => (
                  <tr key={i}>
                    <td className="td--bold">{a.title}</td>
                    <td>{a.total_registered}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
