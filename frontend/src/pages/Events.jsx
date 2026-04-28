import { useEffect, useState } from "react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";
import toast from "react-hot-toast";
import {
  Calendar, MapPin, Clock, Search, Plus, Edit2, Trash2, X, Users, Star
} from "lucide-react";

const Events = () => {
  const { user, isAdminOrFaculty } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showFeedback, setShowFeedback] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: "" });
  const [form, setForm] = useState({
    title: "", description: "", event_date: "", event_time: "", location: "", capacity: ""
  });

  const fetchEvents = async () => {
    try {
      const { data } = await API.get("/events");
      setEvents(data);
    } catch {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", description: "", event_date: "", event_time: "", location: "", capacity: "" });
    setShowModal(true);
  };

  const openEdit = (ev) => {
    setEditing(ev);
    setForm({
      title: ev.title,
      description: ev.description || "",
      event_date: ev.event_date?.split("T")[0] || "",
      event_time: ev.event_time || "",
      location: ev.location || "",
      capacity: ev.capacity || ""
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await API.put(`/events/${editing.id}`, form);
        toast.success("Event updated");
      } else {
        await API.post("/events", form);
        toast.success("Event created");
      }
      setShowModal(false);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save event");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      await API.delete(`/events/${id}`);
      toast.success("Event deleted");
      fetchEvents();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleRegister = async (eventId) => {
    try {
      await API.post("/registrations", { event_id: eventId });
      toast.success("Registered successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/feedback", { event_id: showFeedback.id, ...feedbackForm });
      toast.success("Feedback submitted!");
      setShowFeedback(null);
      setFeedbackForm({ rating: 5, comment: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit feedback");
    }
  };

  const filtered = events.filter((ev) =>
    ev.title?.toLowerCase().includes(search.toLowerCase()) ||
    ev.location?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Spinner />;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Events</h1>
          <p className="page__sub">Browse and manage campus events</p>
        </div>
        {isAdminOrFaculty && (
          <button id="create-event-btn" className="btn btn--primary" onClick={openCreate}>
            <Plus size={18} /> New Event
          </button>
        )}
      </div>

      <div className="search-bar">
        <Search size={18} className="search-bar__icon" />
        <input
          id="event-search"
          className="search-bar__input"
          placeholder="Search events by title or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Calendar size={48} />
          <p>No events found</p>
        </div>
      ) : (
        <div className="events-grid">
          {filtered.map((ev) => (
            <div key={ev.id} className="event-card">
              <div className="event-card__header">
                <h3 className="event-card__title">{ev.title}</h3>
                {ev.status && <span className={`badge badge--${ev.status}`}>{ev.status}</span>}
              </div>
              <p className="event-card__desc">{ev.description}</p>
              <div className="event-card__meta">
                <span><Calendar size={14} /> {ev.event_date ? new Date(ev.event_date).toLocaleDateString() : "TBD"}</span>
                <span><Clock size={14} /> {ev.event_time || "TBD"}</span>
                <span><MapPin size={14} /> {ev.location || "TBD"}</span>
                {ev.capacity && <span><Users size={14} /> Max {ev.capacity}</span>}
              </div>
              <div className="event-card__actions">
                <button className="btn btn--sm btn--accent" onClick={() => handleRegister(ev.id)}>
                  Register
                </button>
                <button className="btn btn--sm btn--outline" onClick={() => { setShowFeedback(ev); setFeedbackForm({ rating: 5, comment: "" }); }}>
                  <Star size={14} /> Feedback
                </button>
                {isAdminOrFaculty && (
                  <>
                    <button className="btn btn--sm btn--ghost" onClick={() => openEdit(ev)}>
                      <Edit2 size={14} />
                    </button>
                    <button className="btn btn--sm btn--danger-ghost" onClick={() => handleDelete(ev.id)}>
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>{editing ? "Edit Event" : "Create Event"}</h2>
              <button className="modal__close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form className="modal__body" onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input className="form-input" type="time" value={form.event_time} onChange={(e) => setForm({ ...form, event_time: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input className="form-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Capacity</label>
                  <input className="form-input" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required />
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary">{editing ? "Update" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="modal-backdrop" onClick={() => setShowFeedback(null)}>
          <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Submit Feedback</h2>
              <button className="modal__close" onClick={() => setShowFeedback(null)}><X size={20} /></button>
            </div>
            <form className="modal__body" onSubmit={handleFeedbackSubmit}>
              <p className="modal__event-name">{showFeedback.title}</p>
              <div className="form-group">
                <label className="form-label">Rating</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      className={`star-btn ${feedbackForm.rating >= s ? "star-btn--active" : ""}`}
                      onClick={() => setFeedbackForm({ ...feedbackForm, rating: s })}
                    >
                      <Star size={24} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Comment</label>
                <textarea className="form-input form-textarea" value={feedbackForm.comment} onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })} placeholder="Share your experience..." />
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--outline" onClick={() => setShowFeedback(null)}>Cancel</button>
                <button type="submit" className="btn btn--primary">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
