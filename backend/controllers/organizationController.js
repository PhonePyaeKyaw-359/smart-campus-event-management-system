const db = require("../config/db");
const jwt = require("jsonwebtoken");

const getOrganizations = (req, res) => {
  db.query("SELECT * FROM organizations", (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", error: err.message });
    res.status(200).json(results);
  });
};

const getDepartments = (req, res) => {
  const { orgId } = req.params;
  if (!orgId) return res.status(400).json({ message: "Organization ID required" });

  db.query("SELECT * FROM departments WHERE organization_id = ?", [orgId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", error: err.message });
    res.status(200).json(results);
  });
};

const setOrganizationAndDepartment = (req, res) => {
  const { organization_id, department_id } = req.body;
  const userId = req.user.id;

  if (!organization_id) {
    return res.status(400).json({ message: "Organization ID is required" });
  }

  const organizationSql = "SELECT id FROM organizations WHERE id = ?";
  db.query(organizationSql, [organization_id], (organizationErr, organizations) => {
    if (organizationErr) return res.status(500).json({ message: "Database error" });
    if (organizations.length === 0) return res.status(400).json({ message: "Organization not found" });

    const departmentSql = department_id
      ? "SELECT id FROM departments WHERE id = ? AND organization_id = ?"
      : null;

    const saveProfile = () => {
      const sql = "UPDATE users SET organization_id = ?, department_id = ? WHERE id = ?";
      db.query(sql, [organization_id, department_id || null, userId], (err) => {
    if (err) return res.status(500).json({ message: "Database error", error: err.message });
    
    // Fetch updated user to return new state
    db.query("SELECT id, full_name, email, role, status, organization_id, department_id FROM users WHERE id = ?", [userId], (err, users) => {
      if (err || users.length === 0) return res.status(500).json({ message: "Error fetching updated user" });
      
      const updatedUser = users[0];
      const token = jwt.sign(
        {
          id: updatedUser.id,
          role: updatedUser.role,
          organization_id: updatedUser.organization_id,
          department_id: updatedUser.department_id
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.status(200).json({ message: "Organization set successfully", user: updatedUser, token });
    });
      });
    };

    if (!departmentSql) return saveProfile();

    db.query(departmentSql, [department_id, organization_id], (departmentErr, departments) => {
      if (departmentErr) return res.status(500).json({ message: "Database error" });
      if (departments.length === 0) return res.status(400).json({ message: "Department does not belong to this organization" });
      saveProfile();
    });
  });
};

module.exports = {
  getOrganizations,
  getDepartments,
  setOrganizationAndDepartment
};
