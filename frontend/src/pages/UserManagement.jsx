import { useEffect, useState } from "react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";
import toast from "react-hot-toast";
import {
  Users, Plus, Trash2, X, ShieldCheck, GraduationCap, BookOpen, Search, Edit2
} from "lucide-react";

const ROLE_ICONS = {
  admin: ShieldCheck,
  faculty: BookOpen,
  student: GraduationCap,
};

const ROLE_COLORS = {
  admin: "#f43f5e",
  faculty: "#6366f1",
  student: "#22d3ee",
};

const UserManagement = () => {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(null); // holds the user object being role-edited
  const [newRole, setNewRole] = useState("student");
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "student" });
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      const { data } = await API.get("/users");
      setUsers(data);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.post("/users", form);
      toast.success(`${form.role.charAt(0).toUpperCase() + form.role.slice(1)} account created!`);
      setShowModal(false);
      setForm({ full_name: "", email: "", password: "", role: "student" });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  const handleChangeRole = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/users/${showRoleModal.id}/role`, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      setShowRoleModal(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role");
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete user "${name}"? This will also remove all their registrations and feedback.`)) return;
    try {
      await API.delete(`/users/${id}`);
      toast.success("User deleted");
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    }
  };

  const filtered = users.filter((u) =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    admin: users.filter((u) => u.role === "admin").length,
    faculty: users.filter((u) => u.role === "faculty").length,
    student: users.filter((u) => u.role === "student").length,
  };

  if (loading) return <Spinner />;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">User Management</h1>
          <p className="page__sub">Manage all system accounts and roles</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Add User
        </button>
      </div>

      {/* Role summary cards */}
      <div className="stat-grid" style={{ marginBottom: "1.5rem" }}>
        {["admin", "faculty", "student"].map((role) => {
          const Icon = ROLE_ICONS[role];
          const color = ROLE_COLORS[role];
          return (
            <div className="stat-card" key={role}>
              <div className="stat-card__info">
                <p className="stat-card__label" style={{ textTransform: "capitalize" }}>{role}s</p>
                <p className="stat-card__value">{counts[role]}</p>
              </div>
              <div className="stat-card__icon" style={{ background: color + "22", color }}>
                <Icon size={26} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="search-bar" style={{ marginBottom: "1.25rem" }}>
        <Search size={18} className="search-bar__icon" />
        <input
          className="search-bar__input"
          placeholder="Search by name, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Users Table */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <p>No users found</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const Icon = ROLE_ICONS[u.role] || GraduationCap;
                const isMe = u.id === me?.id;
                return (
                  <tr key={u.id}>
                    <td style={{ color: "var(--text-muted)" }}>#{u.id}</td>
                    <td className="td--bold">
                      <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span
                          style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: ROLE_COLORS[u.role] + "22",
                            color: ROLE_COLORS[u.role],
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 700, fontSize: "0.8rem", flexShrink: 0
                          }}
                        >
                          {u.full_name?.[0]?.toUpperCase()}
                        </span>
                        {u.full_name}
                        {isMe && <span className="badge badge--info" style={{ fontSize: "0.65rem" }}>You</span>}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{u.email}</td>
                    <td>
                      <span className={`badge badge--${u.role}`}>
                        <Icon size={11} style={{ marginRight: 3 }} /> {u.role}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="btn-group">
                        {!isMe && (
                          <button
                            className="btn btn--sm btn--ghost"
                            title="Change role"
                            onClick={() => { setShowRoleModal(u); setNewRole(u.role); }}
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                        {!isMe && (
                          <button
                            className="btn btn--sm btn--danger-ghost"
                            title="Delete user"
                            onClick={() => handleDelete(u.id, u.full_name)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        {isMe && <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>—</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Create New User</h2>
              <button className="modal__close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form className="modal__body" onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. John Smith"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="e.g. john@gmail.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-input"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="um-role-hint">
                {form.role === "admin" && <p>⚠️ Admin users have full access to all system features including user management.</p>}
                {form.role === "faculty" && <p>ℹ️ Faculty users can create events, manage resources, and view reports.</p>}
                {form.role === "student" && <p>ℹ️ Student users can browse events, register, and submit feedback.</p>}
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {showRoleModal && (
        <div className="modal-backdrop" onClick={() => setShowRoleModal(null)}>
          <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Change Role</h2>
              <button className="modal__close" onClick={() => setShowRoleModal(null)}><X size={20} /></button>
            </div>
            <form className="modal__body" onSubmit={handleChangeRole}>
              <p style={{ marginBottom: "1rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                Changing role for <strong style={{ color: "var(--text-primary)" }}>{showRoleModal.full_name}</strong>
              </p>
              <div className="form-group">
                <label className="form-label">New Role</label>
                <select
                  className="form-input"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--outline" onClick={() => setShowRoleModal(null)}>Cancel</button>
                <button type="submit" className="btn btn--primary">Save Role</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
