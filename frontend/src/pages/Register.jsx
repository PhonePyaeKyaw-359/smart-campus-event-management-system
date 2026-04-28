import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import toast from "react-hot-toast";
import { GraduationCap, User, Mail, Lock } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "student" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/auth/register", form);
      toast.success("Account created! Please log in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-card">
        <div className="auth-card__header">
          <div className="auth-card__logo">
            <GraduationCap size={36} />
          </div>
          <h1 className="auth-card__title">CampusEvent</h1>
          <p className="auth-card__sub">Create your account</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h2 className="auth-form__heading">Register</h2>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="input-icon-wrap">
              <User size={18} className="input-icon" />
              <input
                id="reg-name"
                type="text"
                className="form-input"
                placeholder="John Doe"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-icon-wrap">
              <Mail size={18} className="input-icon" />
              <input
                id="reg-email"
                type="email"
                className="form-input"
                placeholder="you@campus.edu"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-icon-wrap">
              <Lock size={18} className="input-icon" />
              <input
                id="reg-password"
                type="password"
                className="form-input"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <select
              id="reg-role"
              className="form-input"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button id="reg-submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="auth-form__switch">
            Already have an account?{" "}
            <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
