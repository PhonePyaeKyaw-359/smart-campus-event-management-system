import { useEffect, useState } from "react";
import API from "../api/axios";
import Spinner from "../components/Spinner";
import toast from "react-hot-toast";
import { MessageSquare, Star, ChevronDown } from "lucide-react";

const FeedbackAdmin = () => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fbLoading, setFbLoading] = useState(false);

  // Load all events for the dropdown
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const { data } = await API.get("/events");
        setEvents(data);
      } catch {
        toast.error("Failed to load events");
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

  // Load feedback whenever a new event is selected
  useEffect(() => {
    if (!selectedEventId) {
      setFeedbacks([]);
      return;
    }
    const loadFeedback = async () => {
      setFbLoading(true);
      try {
        const { data } = await API.get(`/feedback/event/${selectedEventId}`);
        setFeedbacks(data);
      } catch {
        toast.error("Failed to load feedback");
        setFeedbacks([]);
      } finally {
        setFbLoading(false);
      }
    };
    loadFeedback();
  }, [selectedEventId]);

  const selectedEvent = events.find((e) => String(e.id) === String(selectedEventId));
  const avgRating = feedbacks.length
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : null;

  if (loading) return <Spinner />;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Event Feedback</h1>
          <p className="page__sub">View feedback submitted for each event</p>
        </div>
      </div>

      {/* Event Selector */}
      <div className="form-group" style={{ maxWidth: 480, marginBottom: "1.5rem" }}>
        <label className="form-label">Select Event</label>
        <div style={{ position: "relative" }}>
          <select
            className="form-input"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            style={{ appearance: "none", paddingRight: "2.5rem" }}
          >
            <option value="">— Choose an event —</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} {ev.event_date ? `(${new Date(ev.event_date).toLocaleDateString()})` : ""}
              </option>
            ))}
          </select>
          <ChevronDown size={16} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", opacity: 0.6 }} />
        </div>
      </div>

      {/* Summary bar */}
      {selectedEvent && !fbLoading && feedbacks.length > 0 && (
        <div className="stat-grid" style={{ marginBottom: "1.5rem" }}>
          <div className="stat-card">
            <div className="stat-card__info">
              <p className="stat-card__label">Total Responses</p>
              <p className="stat-card__value">{feedbacks.length}</p>
            </div>
            <div className="stat-card__icon" style={{ background: "#6366f122", color: "#6366f1" }}>
              <MessageSquare size={26} />
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card__info">
              <p className="stat-card__label">Average Rating</p>
              <p className="stat-card__value">{avgRating} / 5</p>
            </div>
            <div className="stat-card__icon" style={{ background: "#f59e0b22", color: "#f59e0b" }}>
              <Star size={26} />
            </div>
          </div>
        </div>
      )}

      {fbLoading && <Spinner />}

      {!fbLoading && selectedEventId && feedbacks.length === 0 && (
        <div className="empty-state">
          <MessageSquare size={48} />
          <p>No feedback submitted for this event yet</p>
        </div>
      )}

      {!selectedEventId && (
        <div className="empty-state">
          <MessageSquare size={48} />
          <p>Select an event above to view its feedback</p>
        </div>
      )}

      {!fbLoading && feedbacks.length > 0 && (
        <div className="feedback-grid">
          {feedbacks.map((fb) => (
            <div key={fb.id} className="feedback-card">
              <div className="feedback-card__header">
                <span className="feedback-card__user">{fb.full_name || `User #${fb.user_id}`}</span>
                <div className="feedback-card__stars">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={16} className={s <= fb.rating ? "star--filled" : "star--empty"} />
                  ))}
                </div>
              </div>
              <p className="feedback-card__comment">{fb.comment || "No comment"}</p>
              <span className="feedback-card__time">{new Date(fb.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackAdmin;
