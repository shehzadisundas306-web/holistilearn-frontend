import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  FileQuestion, 
  MessageSquare, 
  BarChart3, 
  Settings,
  LogOut
} from 'lucide-react';
import { useGetData } from '../../context/userContext';

const TeacherSidebar = ({ collapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useGetData();

  const menuItems = [
    { path: '/teacher/dashboard/overview', icon: LayoutDashboard, label: 'Overview' },
    { path: '/teacher/dashboard/subjects', icon: BookOpen, label: 'Subjects & Topics' },
    { path: '/teacher/dashboard/classes', icon: Users, label: 'My Classes' },
    { path: '/teacher/dashboard/quiz', icon: FileQuestion, label: 'Quiz Manager' },
    { path: '/teacher/dashboard/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/teacher/dashboard/reports', icon: BarChart3, label: 'Reports' },
    { path: '/teacher/dashboard/settings', icon: Settings, label: 'Settings' },
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className={`teacher-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo / Brand */}
      <div className="sidebar-brand">
        {!collapsed ? (
          <h2 className="brand-title">HolistiLearn</h2>
        ) : (
          <div className="brand-icon">HL</div>
        )}
        <button className="collapse-btn" onClick={onToggle}>
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            title={collapsed ? item.label : ''}
          >
            <item.icon size={20} />
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="sidebar-footer">
        <button className="nav-item logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default TeacherSidebar;