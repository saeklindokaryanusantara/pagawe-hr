import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Users, 
  LayoutDashboard, 
  Building2, 
  Briefcase, 
  FileText, 
  BarChart3, 
  Settings,
  LogOut 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './TopNavigation.css';

const TopNavigation = () => {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <nav className="nav-container">
      <div className="nav-content">
        <div className="nav-left">
          <div className="logo-container">
            <img src="/logo.png" alt="Pagawe Logo" style={{ height: '36px', objectFit: 'contain' }} />
          </div>

          <div className="nav-links">
            <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>
            <NavLink to="/employees" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <Users size={18} />
              Employees
            </NavLink>
            <NavLink to="/clients" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <Building2 size={18} />
              Clients
            </NavLink>
            <NavLink to="/projects" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <Briefcase size={18} />
              Projects
            </NavLink>
            <NavLink to="/contracts" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <FileText size={18} />
              Contracts
            </NavLink>
            <NavLink to="/reports" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <BarChart3 size={18} />
              Reports
            </NavLink>
            <NavLink to="/settings" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <Settings size={18} />
              Settings
            </NavLink>
          </div>
        </div>

        <div className="nav-right">
          <div className="user-profile">
            <span className="user-name" style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email || 'Admin'}
            </span>
            <span className="user-role">Administrator</span>
          </div>
          
          <div className="nav-right-divider"></div>
          
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default TopNavigation;
