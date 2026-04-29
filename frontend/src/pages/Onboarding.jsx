import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { School, Building, ArrowRight, Loader } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  
  const [organizations, setOrganizations] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  const [selectedOrg, setSelectedOrg] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already onboarded
  useEffect(() => {
    if (user?.organization_id && (user?.role === 'admin' || user?.department_id)) {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const { data } = await api.get("/organizations");
        setOrganizations(data);
      } catch (err) {
        setError("Failed to load organizations. Please try again later.");
      } finally {
        setLoadingOrgs(false);
      }
    };
    fetchOrgs();
  }, []);

  useEffect(() => {
    if (!selectedOrg) {
      setDepartments([]);
      setSelectedDept("");
      return;
    }

    const fetchDepts = async () => {
      setLoadingDepts(true);
      try {
        const { data } = await api.get(`/organizations/${selectedOrg}/departments`);
        setDepartments(data);
        if (data.length === 1) setSelectedDept(data[0].id.toString());
      } catch (err) {
        setError("Failed to load departments.");
      } finally {
        setLoadingDepts(false);
      }
    };
    fetchDepts();
  }, [selectedOrg]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrg) return setError("Organization is required");
    if (user?.role !== 'admin' && !selectedDept) return setError("Department is required");

    setSubmitting(true);
    setError("");

    try {
      const { data } = await api.put("/organizations/onboard", {
        organization_id: selectedOrg,
        department_id: selectedDept || null
      });

      updateUser(data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save profile setup.");
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <School className="auth-logo__icon" size={32} />
          </div>
          <h1 className="auth-title">Complete Your Setup</h1>
          <p className="auth-subtitle">Select your organization to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Organization</label>
            <div className="input-icon-wrap">
              <Building className="input-icon" size={18} />
              <select
                className="form-input"
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                disabled={loadingOrgs || submitting}
                required
              >
                <option value="">{loadingOrgs ? "Loading..." : "Select Organization"}</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedOrg && user?.role !== 'admin' && (
            <div className="form-group">
              <label className="form-label">Department / Faculty</label>
              <div className="input-icon-wrap">
                <School className="input-icon" size={18} />
                <select
                  className="form-input"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  disabled={loadingDepts || submitting}
                  required
                >
                  <option value="">{loadingDepts ? "Loading..." : "Select Department"}</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn--primary auth-submit"
            disabled={submitting || !selectedOrg || (user?.role !== 'admin' && !selectedDept)}
          >
            {submitting ? <Loader className="spinner-icon" size={18} /> : "Complete Setup"}
            {!submitting && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
