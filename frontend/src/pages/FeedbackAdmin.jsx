import { useEffect, useState } from "react";
import API from "../api/axios";
import Spinner from "../components/Spinner";
import toast from "react-hot-toast";
import { MessageSquare, Star, Search } from "lucide-react";

const FeedbackAdmin = () => {
  const [eventId, setEventId] = useState("");
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!eventId) return;
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await API.get(`/feedback/event/${eventId}`);
      setFeedbacks(data);
    } catch {
      toast.error("Failed to load feedback");
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Event Feedback</h1>
          <p className="page__sub">View feedback submitted for each event</p>
        </div>
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <Search size={18} className="search-bar__icon" />
        <input
          className="search-bar__input"
          type="number"
          placeholder="Enter Event ID and press Enter..."
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
        />
        <button type="submit" className="btn btn--primary btn--sm">Search</button>
      </form>

      {loading && <Spinner />}

      {!loading && searched && feedbacks.length === 0 && (
        <div className="empty-state">
          <MessageSquare size={48} />
          <p>No feedback found for this event</p>
        </div>
      )}

      {!loading && feedbacks.length > 0 && (
        <div className="feedback-grid">
          {feedbacks.map((fb) => (
            <div key={fb.id} className="feedback-card">
              <div className="feedback-card__header">
                <span className="feedback-card__user">{fb.user_name || `User #${fb.user_id}`}</span>
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
