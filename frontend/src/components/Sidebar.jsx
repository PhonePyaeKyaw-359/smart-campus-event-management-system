import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, Calendar, ClipboardList, MessageSquare,
  Bell, Package, BarChart2, ShieldCheck, LogOut, Menu, X, GraduationCap
} from "lucide-react";

const navItems = [
  { to: "/dashboard",       label: "Dashboard",      icon: LayoutDashboard, roles: ["student","faculty","admin"] },
  { to: "/events",          label: "Events",          icon: Calendar,        roles: ["student","faculty","admin"] },
  { to: "/my-registrations",label: "My Registrations",icon: ClipboardList,   roles: ["student","faculty","admin"] },
  { to: "/notifications",   label: "Notifications",   icon: Bell,            roles: ["student","faculty","admin"] },
  { to: "/resources",       label: "Resources",       icon: Package,         roles: ["faculty","admin"] },
  { to: "/reports",         label: "Reports",         icon: BarChart2,       roles: ["faculty","admin"] },
  { to: "/feedback-admin",  label: "Feedback",        icon: MessageSquare,   roles: ["faculty","admin"] },
  { to: "/audit-logs",      label: "Audit Logs",      icon: ShieldCheck,     roles: ["admin"] },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filtered = navItems.filter((item) => item.roles.includes(user?.role));

  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      <div className="sidebar__header">
        <div className="sidebar__brand">
          <GraduationCap size={28} className="sidebar__logo" />
          {!collapsed && <span className="sidebar__title">CampusEvent</span>}
        </div>
        <button className="sidebar__toggle" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      <div className="sidebar__user">
        <div className="sidebar__avatar">
          {user?.name?.[0]?.toUpperCase() || "U"}
        </div>
        {!collapsed && (
          <div className="sidebar__user-info">
            <p className="sidebar__user-name">{user?.name}</p>
            <span className={`badge badge--${user?.role}`}>{user?.role}</span>
          </div>
        )}
      </div>

      <nav className="sidebar__nav">
        {filtered.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
            }
          >
            <Icon size={20} className="sidebar__link-icon" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <button className="sidebar__logout" onClick={handleLogout}>
        <LogOut size={20} />
        {!collapsed && <span>Logout</span>}
      </button>
    </aside>
  );
};

export default Sidebar;
