import { useEffect, useState } from "react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";
import toast from "react-hot-toast";
import {
  Calendar, MapPin, Clock, Search, Plus, Edit2, Trash2, X, Users, Star, CheckCircle
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
  const [registeringId, setRegisteringId] = useState(null);
  const [form, setForm] = useState({
    title: "", description: "", event_date: "", event_time: "", location: "", capacity: ""
  });

  const [dateYear, setDateYear] = useState(new Date().getFullYear().toString());
  const [dateMonth, setDateMonth] = useState("01");
  const [dateDay, setDateDay] = useState("01");

  const [timeHour, setTimeHour] = useState("12");
  const [timeMin, setTimeMin] = useState("00");
  const [timeAmPm, setTimeAmPm] = useState("AM");

  useEffect(() => {
    setForm(f => ({ ...f, event_date: `${dateYear}-${dateMonth.padStart(2, '0')}-${dateDay.padStart(2, '0')}` }));
  }, [dateYear, dateMonth, dateDay]);

  useEffect(() => {
    let h = parseInt(timeHour, 10);
    if (timeAmPm === "PM" && h !== 12) h += 12;
    if (timeAmPm === "AM" && h === 12) h = 0;
    setForm(f => ({ ...f, event_time: `${h.toString().padStart(2, '0')}:${timeMin.padStart(2, '0')}:00` }));
  }, [timeHour, timeMin, timeAmPm]);

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
    const now = new Date();
    setDateYear(now.getFullYear().toString());
    setDateMonth((now.getMonth() + 1).toString().padStart(2, '0'));
    setDateDay(now.getDate().toString().padStart(2, '0'));
    setTimeHour("12");
    setTimeMin("00");
    setTimeAmPm("PM");
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

    if (ev.event_date) {
      const [y, m, d] = ev.event_date.split("T")[0].split("-");
      if (y && m && d) {
        setDateYear(y); setDateMonth(m); setDateDay(d);
      }
    }
    if (ev.event_time) {
      const [hStr, mStr] = ev.event_time.split(":");
      let h = parseInt(hStr, 10);
      const ampm = h >= 12 ? "PM" : "AM";
      if (h > 12) h -= 12;
      if (h === 0) h = 12;
      setTimeHour(h.toString());
      setTimeMin(mStr);
      setTimeAmPm(ampm);
    }
    
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
        toast.success("Event created! A notification has been sent to all users.");
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
    setRegisteringId(eventId);
    try {
      await API.post("/registrations", { event_id: eventId });
      toast.success("Registered successfully!");
      // Optimistically update local state — no need to refetch
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === eventId
            ? { ...ev, user_registered: 1, registered_count: (ev.registered_count || 0) + 1 }
            : ev
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setRegisteringId(null);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/feedback", { event_id: showFeedback.id, ...feedbackForm });
      toast.success("Feedback submitted! Thank you.");
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
          {filtered.map((ev) => {
            const isFull = ev.registered_count >= ev.capacity;
            const isCancelled = ev.status === "cancelled";
            const alreadyRegistered = !!ev.user_registered;
            const fillPercent = ev.capacity ? Math.min(100, Math.round((ev.registered_count / ev.capacity) * 100)) : 0;

            return (
              <div key={ev.id} className={`event-card ${isCancelled ? "event-card--cancelled" : ""}`}>
                <div className="event-card__header">
                  <h3 className="event-card__title">{ev.title}</h3>
                  {ev.status && (
                    <span className={`badge badge--${ev.status}`}>
                      {ev.status === 'pending' ? 'Pending Approval' : ev.status.charAt(0).toUpperCase() + ev.status.slice(1)}
                    </span>
                  )}
                </div>
                <p className="event-card__desc">{ev.description}</p>
                <div className="event-card__meta">
                  <span><Calendar size={14} /> {ev.event_date ? new Date(ev.event_date).toLocaleDateString() : "TBD"}</span>
                  <span><Clock size={14} /> {ev.event_time || "TBD"}</span>
                  <span><MapPin size={14} /> {ev.location || "TBD"}</span>
                </div>

                {/* Capacity Progress Bar */}
                {ev.capacity && (
                  <div className="event-card__capacity">
                    <div className="capacity-bar">
                      <div
                        className={`capacity-bar__fill ${isFull ? "capacity-bar__fill--full" : ""}`}
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>
                    <span className="capacity-bar__label">
                      <Users size={13} />
                      {ev.registered_count}/{ev.capacity} spots
                      {isFull && <span className="capacity-bar__full-tag"> · Full</span>}
                    </span>
                  </div>
                )}

                <div className="event-card__actions">
                  {ev.status === 'active' && (
                    alreadyRegistered ? (
                      <span className="btn btn--sm btn--registered" disabled>
                        <CheckCircle size={14} /> Registered
                      </span>
                    ) : (
                      <button
                        className="btn btn--sm btn--accent"
                        onClick={() => handleRegister(ev.id)}
                        disabled={isFull || registeringId === ev.id}
                      >
                        {registeringId === ev.id ? "Registering..." : isFull ? "Full" : "Register"}
                      </button>
                    )
                  )}

                  {alreadyRegistered && ev.status === 'active' && (
                    <button
                      className="btn btn--sm btn--outline"
                      onClick={() => { setShowFeedback(ev); setFeedbackForm({ rating: 5, comment: "" }); }}
                    >
                      <Star size={14} /> Feedback
                    </button>
                  )}

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
            );
          })}
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
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Date</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select className="form-input" value={dateMonth} onChange={(e) => setDateMonth(e.target.value)}>
                      {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                        <option key={m} value={m.toString().padStart(2, '0')}>{new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}</option>
                      ))}
                    </select>
                    <select className="form-input" value={dateDay} onChange={(e) => setDateDay(e.target.value)}>
                      {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                        <option key={d} value={d.toString().padStart(2, '0')}>{d}</option>
                      ))}
                    </select>
                    <select className="form-input" value={dateYear} onChange={(e) => setDateYear(e.target.value)}>
                      {[0, 1, 2, 3, 4].map(yOffset => {
                        const y = new Date().getFullYear() + yOffset;
                        return <option key={y} value={y}>{y}</option>;
                      })}
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Time</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select className="form-input" value={timeHour} onChange={(e) => setTimeHour(e.target.value)}>
                      {Array.from({length: 12}, (_, i) => i + 1).map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <span style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>:</span>
                    <select className="form-input" value={timeMin} onChange={(e) => setTimeMin(e.target.value)}>
                      {['00', '15', '30', '45'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <select className="form-input" value={timeAmPm} onChange={(e) => setTimeAmPm(e.target.value)}>
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
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
              {editing && (
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status || "active"} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}
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
