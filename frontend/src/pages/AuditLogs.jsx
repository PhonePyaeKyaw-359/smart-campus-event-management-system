import { useEffect, useState } from "react";
import API from "../api/axios";
import Spinner from "../components/Spinner";
import toast from "react-hot-toast";
import { ShieldCheck } from "lucide-react";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await API.get("/audit-logs");
        setLogs(data);
      } catch {
        toast.error("Failed to load audit logs");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Audit Logs</h1>
          <p className="page__sub">Track all system activities</p>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="empty-state">
          <ShieldCheck size={48} />
          <p>No audit logs available</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Action</th>
                <th>Details</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.id}</td>
                  <td className="td--bold">{log.user_name || log.user_id}</td>
                  <td>
                    <span className="badge badge--info">{log.action}</span>
                  </td>
                  <td className="td--truncate">{log.description || "—"}</td>
                  <td>{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
