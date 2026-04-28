import { useEffect, useState } from "react";
import API from "../api/axios";
import Spinner from "../components/Spinner";
import toast from "react-hot-toast";
import { ClipboardList, XCircle, Calendar, MapPin } from "lucide-react";

const MyRegistrations = () => {
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    try {
      const { data } = await API.get("/registrations/my");
      setRegs(data);
    } catch {
      toast.error("Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const handleCancel = async (id) => {
    if (!confirm("Cancel this registration?")) return;
    try {
      await API.put(`/registrations/${id}/cancel`);
      toast.success("Registration cancelled");
      fetch();
    } catch {
      toast.error("Failed to cancel");
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">My Registrations</h1>
          <p className="page__sub">Events you've registered for</p>
        </div>
      </div>

      {regs.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={48} />
          <p>No registrations yet. Browse events to register!</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Date</th>
                <th>Location</th>
                <th>Status</th>
                <th>Registered On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {regs.map((r) => (
                <tr key={r.registration_id}>
                  <td className="td--bold">{r.title || `Event #${r.event_id}`}</td>
                  <td>
                    <span className="td-flex"><Calendar size={14} /> {r.event_date ? new Date(r.event_date).toLocaleDateString() : "—"}</span>
                  </td>
                  <td>
                    <span className="td-flex"><MapPin size={14} /> {r.location || "—"}</span>
                  </td>
                  <td>
                    <span className={`badge badge--${r.registration_status || "registered"}`}>{r.registration_status || "registered"}</span>
                  </td>
                  <td>{r.registered_at ? new Date(r.registered_at).toLocaleDateString() : "—"}</td>
                  <td>
                    {r.registration_status !== "cancelled" && (
                      <button className="btn btn--sm btn--danger-ghost" onClick={() => handleCancel(r.registration_id)}>
                        <XCircle size={14} /> Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyRegistrations;
