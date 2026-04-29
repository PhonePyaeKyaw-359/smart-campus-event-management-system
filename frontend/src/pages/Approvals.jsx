import { useState, useEffect } from "react";
import { Check, X, Clock } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const Approvals = () => {
  const { user, isAdmin, isFaculty } = useAuth();
  const [activeTab, setActiveTab] = useState(isAdmin ? "users" : "registrations");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

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
      toast.success(`${activeTab.slice(0,-1)} ${status}`);
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
              className={`btn ${activeTab === 'users' ? 'btn--primary' : 'btn--outline'}`}
              onClick={() => setActiveTab('users')}
            >
              User Accounts
            </button>
            <button 
              className={`btn ${activeTab === 'events' ? 'btn--primary' : 'btn--outline'}`}
              onClick={() => setActiveTab('events')}
            >
              Events
            </button>
          </>
        )}
        {isFaculty && (
          <button 
            className={`btn ${activeTab === 'registrations' ? 'btn--primary' : 'btn--outline'}`}
            onClick={() => setActiveTab('registrations')}
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
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                {activeTab === 'users' && (
                  <><th>Name</th><th>Email</th><th>Role</th><th>Action</th></>
                )}
                {activeTab === 'events' && (
                  <><th>Event Title</th><th>Date</th><th>Creator</th><th>Action</th></>
                )}
                {activeTab === 'registrations' && (
                  <><th>Student</th><th>Event</th><th>Date</th><th>Action</th></>
                )}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  {activeTab === 'users' && (
                    <>
                      <td>{item.full_name}</td>
                      <td>{item.email}</td>
                      <td><span className={`status-badge status-badge--${item.role}`}>{item.role}</span></td>
                    </>
                  )}
                  {activeTab === 'events' && (
                    <>
                      <td>{item.title}</td>
                      <td>{new Date(item.event_date).toLocaleDateString()}</td>
                      <td>{item.creator_name}</td>
                    </>
                  )}
                  {activeTab === 'registrations' && (
                    <>
                      <td>{item.full_name} ({item.email})</td>
                      <td>{item.event_title}</td>
                      <td>{new Date(item.registered_at).toLocaleDateString()}</td>
                    </>
                  )}
                  <td>
                    <div style={{display: 'flex', gap: '0.5rem'}}>
                      <button onClick={() => handleApproveAction(item.id, 'approved')} className="btn" style={{backgroundColor: 'var(--accent-emerald)', color: '#fff', padding: '0.3rem 0.5rem'}}><Check size={16} /></button>
                      <button onClick={() => handleApproveAction(item.id, 'rejected')} className="btn" style={{backgroundColor: 'var(--accent-rose)', color: '#fff', padding: '0.3rem 0.5rem'}}><X size={16} /></button>
                    </div>
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

export default Approvals;
