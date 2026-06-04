import React, { useState } from 'react';
import { Search, Plus, Briefcase, Edit2, Trash2, MapPin, Users } from 'lucide-react';
import './Pages.css';

// Mock Data
const initialProjects = [
  { id: 1, name: 'Project Alpha - UI', client: 'PT Telkom Indonesia', location: 'Jakarta', status: 'Active', startDate: '2025-01-15', teamSize: 45 },
  { id: 2, name: 'Beta Migration', client: 'PT Petrosea Tbk', location: 'Kalimantan', status: 'Active', startDate: '2025-03-01', teamSize: 32 },
  { id: 3, name: 'Gamma Setup', client: 'PT Waskita Karya', location: 'Surabaya', status: 'Pending', startDate: '2025-07-10', teamSize: 0 },
  { id: 4, name: 'Delta Support', client: 'PT Telkom Indonesia', location: 'Bandung', status: 'Completed', startDate: '2024-06-01', teamSize: 19 },
];

const Projects = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [projects] = useState(initialProjects);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Active': return <span className="badge badge-green">Active</span>;
      case 'Pending': return <span className="badge badge-yellow">Pending</span>;
      case 'Completed': return <span className="badge badge-blue">Completed</span>;
      case 'On Hold': return <span className="badge" style={{backgroundColor: '#fee2e2', color: '#ef4444'}}>On Hold</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
        <button className="btn btn-primary">
          <Plus size={18} />
          Add Project
        </button>
      </div>

      <div className="actions-bar">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search projects or clients..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filters-container">
          <select className="filter-select">
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Project Name & Client</th>
              <th>Location</th>
              <th>Start Date</th>
              <th>Status</th>
              <th>Team Size</th>
              <th style={{textAlign: 'right'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.client.toLowerCase().includes(searchTerm.toLowerCase())).map(project => (
              <tr key={project.id}>
                <td>
                  <div className="user-info">
                    <div className="avatar" style={{backgroundColor: '#e0e7ff', color: 'var(--primary-blue-dark)'}}>
                      <Briefcase size={18} />
                    </div>
                    <div className="user-details">
                      <span className="font-medium">{project.name}</span>
                      <span className="text-muted" style={{fontSize: '0.75rem'}}>{project.client}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2 text-muted" style={{fontSize: '0.875rem'}}>
                    <MapPin size={16} /> {project.location}
                  </div>
                </td>
                <td>{new Date(project.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td>{getStatusBadge(project.status)}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-muted" />
                    <span className="font-medium">{project.teamSize}</span>
                  </div>
                </td>
                <td style={{textAlign: 'right'}}>
                  <div className="flex items-center gap-2" style={{justifyContent: 'flex-end'}}>
                    <button className="btn-icon" title="Edit"><Edit2 size={18} /></button>
                    <button className="btn-icon" style={{color: 'var(--danger)'}} title="Delete"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Projects;
