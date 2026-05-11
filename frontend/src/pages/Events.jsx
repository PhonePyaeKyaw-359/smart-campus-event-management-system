import { useEffect, useState } from "react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";
import toast from "react-hot-toast";
import {
  Calendar, MapPin, Clock, Search, Plus, Edit2, Trash2, X, Users, Star, CheckCircle
} from "lucide-react";

const getEventPhase = (event) => {
  if (event.event_phase) return event.event_phase;
  if (!event.event_date) return "upcoming";

  const now = new Date();
  const eventStart = new Date(`${toDateInput(event.event_date)}T${toTimeInput(event.event_time)}`);
  const eventEnd = new Date(`${toDateInput(event.event_date)}T${toTimeInput(event.event_end_time || event.event_time)}`);

  if (now < eventStart) return "upcoming";
  if (now > eventEnd) return "finished";
  return "available";
};

const getPhaseLabel = (phase) => {
  if (phase === "upcoming") return "Upcoming";
  if (phase === "available") return "Available";
  if (phase === "finished") return "Finished";
  return phase;
};

const toDateInput = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.split("T")[0];
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toTimeInput = (value) => (value ? value.slice(0, 5) : "");

const formatDate = (value) => {
  if (!value) return "TBD";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

const formatDateTime = (value) => {
  if (!value) return "TBD";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const toDateTimeInput = (value) => {
  if (!value) return "";
  if (typeof value === "string" && !value.endsWith("Z")) {
    return value.replace(" ", "T").slice(0, 16);
  }

  const date = new Date(value);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
};

const toSqlTime = (value) => {
  if (!value) return "";
  return value.length === 5 ? `${value}:00` : value;
};

const addHours = (date, hours) => {
  const next = new Date(date);
  next.setHours(next.getHours() + hours);
  return next;
};

const Events = () => {
  const { isAdminOrFaculty } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showFeedback, setShowFeedback] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: "" });
  const [registeringId, setRegisteringId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    event_end_time: "",
    registration_deadline: "",
    registration_status: "open",
    visibility: "department",
    location: "",
    capacity: ""
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
    const now = new Date();
    const eventStart = addHours(now, 24);
    eventStart.setMinutes(0, 0, 0);
    const eventEnd = addHours(eventStart, 2);
    const deadline = addHours(eventStart, -2);
    setForm({
      title: "",
      description: "",
      event_date: toDateInput(eventStart),
      event_time: toTimeInput(eventStart.toTimeString()),
      event_end_time: toTimeInput(eventEnd.toTimeString()),
      registration_deadline: toDateTimeInput(deadline),
      registration_status: "open",
      visibility: "department",
      location: "",
      capacity: ""
    });
    setShowModal(true);
  };

  const openEdit = (ev) => {
    setEditing(ev);
    setForm({
      title: ev.title,
      description: ev.description || "",
      event_date: toDateInput(ev.event_date),
      event_time: toTimeInput(ev.event_time),
      event_end_time: toTimeInput(ev.event_end_time || ev.event_time),
      registration_deadline: toDateTimeInput(ev.registration_deadline),
      registration_status: ev.registration_status || "open",
      visibility: ev.visibility || "department",
      location: ev.location || "",
      capacity: ev.capacity || "",
      status: ev.status || "active"
    });
    
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      event_time: toSqlTime(form.event_time),
      event_end_time: toSqlTime(form.event_end_time),
    };

    try {
      if (editing) {
        await API.put(`/events/${editing.id}`, payload);
        toast.success("Event updated");
      } else {
        await API.post("/events", payload);
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

  const handleCancelEvent = async (ev) => {
    if (!confirm(`Cancel event "${ev.title}"?`)) return;
    try {
      await API.put(`/events/${ev.id}`, {
        ...ev,
        event_date: toDateInput(ev.event_date),
        event_time: toSqlTime(toTimeInput(ev.event_time)),
        event_end_time: toSqlTime(toTimeInput(ev.event_end_time || ev.event_time)),
        registration_deadline: toDateTimeInput(ev.registration_deadline),
        status: "cancelled",
      });
      toast.success("Event cancellation submitted");
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel event");
    }
  };

  const handleRegister = async (eventId) => {
    setRegisteringId(eventId);
    try {
      await API.post("/registrations", { event_id: eventId });
      toast.success("Registration submitted for approval");
      // Optimistically update local state — no need to refetch
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === eventId
            ? { ...ev, user_registered: 1, user_registration_status: "pending" }
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
            const eventPhase = getEventPhase(ev);
            const alreadyRegistered = ["pending", "registered"].includes(ev.user_registration_status);
            const isApprovedRegistration = ev.user_registration_status === "registered";
            const registrationOpen = Number(ev.registration_open) === 1;
            const canRegister = ev.status === "active" && registrationOpen && !alreadyRegistered && !isFull;
            const canGiveFeedback = ev.status === "active" && eventPhase === "finished" && isApprovedRegistration;
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
                  {ev.status === "active" && (
                    <span className={`badge badge--${eventPhase}`}>
                      {getPhaseLabel(eventPhase)}
                    </span>
                  )}
                  {ev.status === "active" && (
                    <span className={`badge badge--${registrationOpen ? "open" : "closed"}`}>
                      Registration {registrationOpen ? "Open" : "Closed"}
                    </span>
                  )}
                </div>
                <p className="event-card__desc">{ev.description}</p>
                <div className="event-card__meta">
                  <span><Calendar size={14} /> {formatDate(ev.event_date)}</span>
                  <span><Clock size={14} /> {toTimeInput(ev.event_time) || "TBD"} - {toTimeInput(ev.event_end_time) || "TBD"}</span>
                  <span><MapPin size={14} /> {ev.location || "TBD"}</span>
                </div>
                {ev.registration_deadline && (
                  <p className="event-card__deadline">
                    Registration due {formatDateTime(ev.registration_deadline)}
                  </p>
                )}

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
                  {ev.status === "active" && eventPhase !== "finished" && (
                    alreadyRegistered ? (
                      <span className="btn btn--sm btn--registered" disabled>
                        <CheckCircle size={14} />
                        {ev.user_registration_status === "pending" ? "Waiting Approval" : "Registered"}
                      </span>
                    ) : !registrationOpen ? (
                      <span className="btn btn--sm btn--outline" disabled>
                        Registration Closed
                      </span>
                    ) : (
                      <button
                        className="btn btn--sm btn--accent"
                        onClick={() => handleRegister(ev.id)}
                        disabled={!canRegister || registeringId === ev.id}
                      >
                        {registeringId === ev.id ? "Registering..." : isFull ? "Full" : "Register"}
                      </button>
                    )
                  )}

                  {ev.status === "active" && eventPhase === "finished" && (
                    <span className="btn btn--sm btn--outline" disabled>
                      Finished
                    </span>
                  )}

                  {canGiveFeedback && (
                    <button
                      className="btn btn--sm btn--outline"
                      onClick={() => { setShowFeedback(ev); setFeedbackForm({ rating: 5, comment: "" }); }}
                    >
                      <Star size={14} /> Feedback
                    </button>
                  )}

                  {isAdminOrFaculty && (
                    <>
                      {ev.status === "active" && (
                        <button className="btn btn--sm btn--outline" onClick={() => handleCancelEvent(ev)}>
                          Cancel Event
                        </button>
                      )}
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
              <div className="event-schedule-grid">
                <div className="form-group">
                  <label className="form-label">Event Date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={form.event_date}
                    onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                    required
                  />
                  <span className="form-hint">{form.event_date ? formatDate(form.event_date) : "DD/MM/YYYY"}</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    className="form-input"
                    type="time"
                    value={form.event_time}
                    onChange={(e) => setForm({ ...form, event_time: e.target.value })}
                    required
                  />
                  <span className="form-hint">When the event begins</span>
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    className="form-input"
                    type="time"
                    value={form.event_end_time}
                    onChange={(e) => setForm({ ...form, event_end_time: e.target.value })}
                    required
                  />
                  <span className="form-hint">After this, feedback opens</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Registration Due</label>
                  <input
                    className="form-input"
                    type="datetime-local"
                    value={form.registration_deadline}
                    onChange={(e) => setForm({ ...form, registration_deadline: e.target.value })}
                    required
                  />
                  <span className="form-hint">{form.registration_deadline ? formatDateTime(form.registration_deadline) : "DD/MM/YYYY, time"}</span>
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
              <div className="form-group">
                <label className="form-label">Audience</label>
                <select
                  className="form-input"
                  value={form.visibility || "department"}
                  onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                >
                  <option value="department">Own Department</option>
                  <option value="public">All Departments</option>
                </select>
                <span className="form-hint">
                  Own Department is private to your department. All Departments makes it visible to students across the organization.
                </span>
              </div>
              {editing && (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Event Status</label>
                    <select className="form-input" value={form.status || "active"} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option value="active">Active</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Registration Status</label>
                    <select className="form-input" value={form.registration_status || "open"} onChange={(e) => setForm({ ...form, registration_status: e.target.value })}>
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
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
