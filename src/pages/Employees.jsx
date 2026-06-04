import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, MoreVertical, Edit2, Eye, Trash2 } from 'lucide-react';
import { insforge } from '../lib/insforge';
import './Pages.css';

const Employees = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await insforge
        .from('employees')
        .select('*')
        .order('name');
      
      if (error) throw error;
      if (data) setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Active': return <span className="badge badge-green">Active</span>;
      case 'Inactive': return <span className="badge badge-yellow">Inactive</span>;
      case 'On Leave': return <span className="badge badge-blue">On Leave</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Employees</h1>
        <button className="btn btn-primary">
          <Plus size={18} />
          Add Employee
        </button>
      </div>

      <div className="actions-bar">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search employees by name..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filters-container">
          <select className="filter-select">
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="On Leave">On Leave</option>
          </select>
          <select className="filter-select">
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="HSE">HSE</option>
            <option value="Operations">Operations</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Position & Dept</th>
              <th>Status</th>
              <th>Assignment Type</th>
              <th style={{textAlign: 'right'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>Loading employees...</td></tr>
            ) : employees.filter(emp => emp.name.toLowerCase().includes(searchTerm.toLowerCase())).map(emp => (
              <tr key={emp.id}>
                <td>
                  <div className="user-info">
                    <div className="avatar">{getInitials(emp.name)}</div>
                    <div className="user-details">
                      <span className="font-medium">{emp.name}</span>
                      <span className="user-email">{emp.email}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="user-details">
                    <span className="font-medium">{emp.position}</span>
                    <span className="text-muted">{emp.department}</span>
                  </div>
                </td>
                <td>{getStatusBadge(emp.status)}</td>
                <td>{emp.assignment_type}</td>
                <td style={{textAlign: 'right'}}>
                  <div className="flex items-center gap-2" style={{justifyContent: 'flex-end'}}>
                    <Link to={`/employees/${emp.id}`} className="btn-icon" title="View Details"><Eye size={18} /></Link>
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

export default Employees;
