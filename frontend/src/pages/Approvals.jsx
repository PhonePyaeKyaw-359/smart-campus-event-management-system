import { useState, useEffect } from "react";
import { Check, X, Clock } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const Approvals = () => {
  const { user, isAdmin, isFaculty } = useAuth();
  const [activeTab, setActiveTab] = useState(isAdmin ? "user" : "registration");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);

  const fetchApprovals = async (type) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/approvals?type=${type}`);
      setItems(data);
    } catch (err) {
      toast.error("Failed to load approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals(activeTab);
  }, [activeTab]);

  const handleApproveAction = async (id, status) => {
    try {
      await api.post("/approvals", {
        type: activeTab,
        target_id: id,
        status,
        remarks: ""
      });
      toast.success(`${activeTab} ${status}`);
      setItems(items.filter(item => item.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page__title">Pending Approvals</h1>
        <p className="page__subtitle">Review and manage pending requests.</p>
      </div>

      <div className="approvals-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        {isAdmin && (
          <>
            <button 
              className={`btn ${activeTab === 'user' ? 'btn--primary' : 'btn--outline'}`}
              onClick={() => setActiveTab('user')}
            >
              User Accounts
            </button>
            <button 
              className={`btn ${activeTab === 'event' ? 'btn--primary' : 'btn--outline'}`}
              onClick={() => setActiveTab('event')}
            >
              Events
            </button>
          </>
        )}
        {isFaculty && (
          <button 
            className={`btn ${activeTab === 'registration' ? 'btn--primary' : 'btn--outline'}`}
            onClick={() => setActiveTab('registration')}
          >
            Event Registrations
          </button>
        )}
      </div>

      {loading ? (
        <div className="spinner-wrapper"><Clock className="spinner-icon" size={32} /></div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <Check size={48} style={{color: 'var(--accent-emerald)'}} />
          <p>No pending approvals at the moment.</p>
        </div>
      ) : (
        <div className="events-grid">
          {items.map(item => (
            <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem' }}>
              <div style={{ flex: 1, marginBottom: '1rem' }}>
                {activeTab === 'user' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.full_name}</h3>
                      <span className={`badge badge--${item.role}`}>{item.role}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{item.email}</p>
                  </>
                )}
                {activeTab === 'event' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</h3>
                      <span className="badge badge--pending">Event</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Creator:</strong> {item.creator_name}
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Date:</strong> {new Date(item.event_date).toLocaleDateString()}
                    </p>
                    {expandedCard === item.id ? (
                      <div style={{ background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                        <p style={{ marginBottom: '0.3rem' }}><strong style={{ color: 'var(--text-primary)' }}>Time:</strong> {item.event_time}</p>
                        <p style={{ marginBottom: '0.3rem' }}><strong style={{ color: 'var(--text-primary)' }}>Location:</strong> {item.location}</p>
                        <p style={{ marginBottom: '0.3rem' }}><strong style={{ color: 'var(--text-primary)' }}>Capacity:</strong> {item.capacity}</p>
                        <p style={{ marginTop: '0.5rem' }}>{item.description}</p>
                        <button onClick={() => setExpandedCard(null)} className="btn btn--sm btn--ghost" style={{ marginTop: '0.5rem', width: '100%', padding: '0.2rem' }}>Hide Details</button>
                      </div>
                    ) : (
                      <button onClick={() => setExpandedCard(item.id)} className="btn btn--sm btn--outline" style={{ marginTop: '0.5rem', width: '100%' }}>View Full Details</button>
                    )}
                  </>
                )}
                {activeTab === 'registration' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.full_name}</h3>
                      <span className="badge badge--pending">Registration</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Email:</strong> {item.email}
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Event:</strong> {item.event_title}
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Date:</strong> {new Date(item.registered_at).toLocaleDateString()}
                    </p>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <button onClick={() => handleApproveAction(item.id, 'approved')} className="btn btn--sm btn--full" style={{backgroundColor: '#10b981', color: '#fff'}}>Approve</button>
                <button onClick={() => handleApproveAction(item.id, 'rejected')} className="btn btn--sm btn--full" style={{backgroundColor: '#f43f5e', color: '#fff'}}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Approvals;
