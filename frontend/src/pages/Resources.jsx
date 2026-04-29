import { useEffect, useState } from "react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";
import toast from "react-hot-toast";
import { Package, Plus, Edit2, Trash2, X, Link2 } from "lucide-react";

const TYPES = ["room", "equipment", "other"];

const Resources = () => {
  const { isAdmin } = useAuth();
  const [resources, setResources] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showAssign, setShowAssign] = useState(false);
  const [assignForm, setAssignForm] = useState({ resource_id: "", event_id: "" });
  const [form, setForm] = useState({
    name: "", type: "room", description: "", availability_status: "available"
  });

  const fetchResources = async () => {
    try {
      const { data } = await API.get("/resources");
      setResources(data);
    } catch {
      toast.error("Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  // Fetch events for the assign dropdown
  const fetchEvents = async () => {
    try {
      const { data } = await API.get("/events");
      setEvents(data.filter((e) => e.status === "active"));
    } catch {
      // silently ignore
    }
  };

  useEffect(() => {
    fetchResources();
    fetchEvents();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", type: "room", description: "", availability_status: "available" });
    setShowModal(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setForm({
      name: r.name,
      type: r.type || "room",
      description: r.description || "",
      availability_status: r.availability_status || "available"
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await API.put(`/resources/${editing.id}`, form);
        toast.success("Resource updated");
      } else {
        await API.post("/resources", form);
        toast.success("Resource created");
      }
      setShowModal(false);
      fetchResources();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this resource?")) return;
    try {
      await API.delete(`/resources/${id}`);
      toast.success("Resource deleted");
      fetchResources();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await API.post("/resources/assign", assignForm);
      const resource = resources.find((r) => String(r.id) === String(assignForm.resource_id));
      const event = events.find((ev) => String(ev.id) === String(assignForm.event_id));
      toast.success(`"${resource?.name}" assigned to "${event?.title}"`);
      setShowAssign(false);
      setAssignForm({ resource_id: "", event_id: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign");
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Resources</h1>
          <p className="page__sub">Manage rooms, equipment, and supplies</p>
        </div>
        {isAdmin && (
          <div className="btn-group">
            <button className="btn btn--primary" onClick={openCreate}>
              <Plus size={18} /> Add Resource
            </button>
            <button className="btn btn--accent" onClick={() => setShowAssign(true)}>
              <Link2 size={18} /> Assign to Event
            </button>
          </div>
        )}
      </div>

      {resources.length === 0 ? (
        <div className="empty-state">
          <Package size={48} />
          <p>No resources available</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Description</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {resources.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td className="td--bold">{r.name}</td>
                  <td><span className="badge badge--info">{r.type}</span></td>
                  <td className="td--truncate">{r.description || "—"}</td>
                  <td>
                    <span className={`badge badge--${r.availability_status === "available" ? "registered" : "cancelled"}`}>
                      {r.availability_status || "available"}
                    </span>
                  </td>
                  {isAdmin && (
                    <td>
                      <div className="btn-group">
                        <button className="btn btn--sm btn--ghost" onClick={() => openEdit(r)}>
                          <Edit2 size={14} />
                        </button>
                        <button className="btn btn--sm btn--danger-ghost" onClick={() => handleDelete(r.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>{editing ? "Edit Resource" : "Add Resource"}</h2>
              <button className="modal__close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form className="modal__body" onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Availability</label>
                  <select className="form-input" value={form.availability_status} onChange={(e) => setForm({ ...form, availability_status: e.target.value })}>
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description..." />
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary">{editing ? "Update" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal — uses real dropdowns */}
      {showAssign && (
        <div className="modal-backdrop" onClick={() => setShowAssign(false)}>
          <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Assign Resource to Event</h2>
              <button className="modal__close" onClick={() => setShowAssign(false)}><X size={20} /></button>
            </div>
            <form className="modal__body" onSubmit={handleAssign}>
              <div className="form-group">
                <label className="form-label">Resource</label>
                <select
                  className="form-input"
                  value={assignForm.resource_id}
                  onChange={(e) => setAssignForm({ ...assignForm, resource_id: e.target.value })}
                  required
                >
                  <option value="">— Select a resource —</option>
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.type}) — {r.availability_status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Event</label>
                <select
                  className="form-input"
                  value={assignForm.event_id}
                  onChange={(e) => setAssignForm({ ...assignForm, event_id: e.target.value })}
                  required
                >
                  <option value="">— Select an event —</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} {ev.event_date ? `(${new Date(ev.event_date).toLocaleDateString()})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--outline" onClick={() => setShowAssign(false)}>Cancel</button>
                <button type="submit" className="btn btn--accent">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resources;
