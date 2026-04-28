import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import toast from "react-hot-toast";
import { GraduationCap, Mail, Lock, Eye, EyeOff } from "lucide-react";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post("/auth/login", form);
      const userData = { ...data.user, name: data.user.full_name || data.user.name };
      login(userData, data.token);
      toast.success(`Welcome back, ${userData.name}!`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
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
          <p className="auth-card__sub">Smart Campus Event Management</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h2 className="auth-form__heading">Sign In</h2>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-icon-wrap">
              <Mail size={18} className="input-icon" />
              <input
                id="login-email"
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
                id="login-password"
                type={showPw ? "text" : "password"}
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowPw(!showPw)}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button id="login-submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="auth-form__switch">
            Don't have an account?{" "}
            <Link to="/register" className="auth-link">Create one</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
