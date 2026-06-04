import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Users, 
  LayoutDashboard, 
  Building2, 
  Briefcase, 
  FileText, 
  BarChart3, 
  LogOut 
} from 'lucide-react';
import './TopNavigation.css';

const TopNavigation = () => {
  return (
    <nav className="nav-container">
      <div className="nav-content">
        <div className="nav-left">
          <div className="logo-container">
            <div className="logo-icon">
              <Users size={20} color="white" />
            </div>
            <span>Pagawe</span>
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
          </div>
        </div>

        <div className="nav-right">
          <div className="user-profile">
            <span className="user-name">Admin</span>
            <span className="user-role">Administrator</span>
          </div>
          
          <div className="nav-right-divider"></div>
          
          <button className="logout-btn">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default TopNavigation;
