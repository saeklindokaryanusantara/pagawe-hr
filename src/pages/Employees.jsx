import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Edit2, Eye, Trash2, Download, Upload, X } from 'lucide-react';
import { insforge } from '../lib/insforge';
import './Pages.css';

const Employees = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Bulk Import state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  // Add Employee state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    status: 'Active',
    assignment_type: 'Regular'
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await insforge
        .database.from('employees')
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
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // --- Export Helper ---
  const handleExportCSV = () => {
    if (employees.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Position', 'Department', 'Hire Date', 'Status', 'Assignment Type'];
    const rows = employees.map(emp => [
      emp.name,
      emp.email,
      emp.phone || '',
      emp.position,
      emp.department,
      emp.hire_date || '',
      emp.status,
      emp.assignment_type || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'employees_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Import Helpers ---
  const handleImportFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      setImportFile(file);
    } else {
      alert('Please select a valid CSV file.');
      setImportFile(null);
    }
  };

  const processImport = async (e) => {
    e.preventDefault();
    if (!importFile) return;

    setIsImporting(true);
    
    try {
      const text = await importFile.text();
      // Simple CSV parser (assuming standard comma-separated with quotes for complex strings)
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) throw new Error('File CSV kosong atau tidak ada data.');

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
      
      const newEmployees = [];
      for (let i = 1; i < lines.length; i++) {
        // Simple split by comma, naive approach for MVP
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        if (values.length >= 5) { // Minimum required fields
          newEmployees.push({
            name: values[0] || 'Unknown',
            email: values[1] || `unknown${i}@pagawe.com`,
            phone: values[2] || '',
            position: values[3] || 'Staff',
            department: values[4] || 'General',
            status: 'Active',
            assignment_type: 'Regular'
          });
        }
      }

      if (newEmployees.length === 0) {
        throw new Error('Tidak ada data valid yang bisa diimpor.');
      }

      // Bulk insert using insforge
      for (const emp of newEmployees) {
        const { error } = await insforge.database.from('employees').insert([emp]);
        if (error) console.warn('Failed to insert employee:', emp.name, error);
      }

      alert(`Berhasil mengimpor ${newEmployees.length} data karyawan!`);
      setIsImportModalOpen(false);
      setImportFile(null);
      fetchEmployees(); // Refresh table
    } catch (error) {
      console.error('Import error:', error);
      alert('Gagal mengimpor data: ' + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const { error } = await insforge.database.from('employees').insert([formData]);
      if (error) throw error;
      
      setIsAddModalOpen(false);
      setFormData({
        name: '', email: '', phone: '', position: '', department: '', status: 'Active', assignment_type: 'Regular'
      });
      fetchEmployees();
    } catch (error) {
      console.error('Error adding employee:', error.message);
      alert('Gagal menambah karyawan: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="container animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Employees</h1>
          <div style={{display: 'flex', gap: '0.5rem'}}>
          <button className="btn btn-secondary" onClick={() => setIsImportModalOpen(true)}>
            <Upload size={18} />
            Import CSV
          </button>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={18} />
            Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={18} />
            Add Employee
          </button>
        </div>
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
      </div> {/* End container */}

      {/* Import CSV Modal */}
      {isImportModalOpen && (
        <div className="modal-overlay" onClick={() => setIsImportModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Bulk Import Employees</h2>
              <button className="btn-close" onClick={() => setIsImportModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={processImport}>
              <div className="modal-body">
                <div style={{marginBottom: '1rem', padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd'}}>
                  <p style={{fontSize: '0.875rem', margin: 0, color: '#0369a1'}}>
                    <strong>Format CSV yang didukung:</strong><br/>
                    Kolom berurutan: Name, Email, Phone, Position, Department<br/>
                    Pastikan tidak ada header tambahan dan menggunakan koma (,) sebagai pemisah.
                  </p>
                </div>
                
                <div className="form-row">
                  <label className="form-label">Pilih File CSV *</label>
                  <input 
                    type="file" 
                    accept=".csv"
                    className="form-control" 
                    onChange={handleImportFileChange} 
                    required 
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsImportModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isImporting || !importFile}>
                  {isImporting ? 'Mengimpor...' : 'Mulai Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Employee</h2>
              <button className="btn-close" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <label className="form-label">Name *</label>
                  <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="form-row">
                  <label className="form-label">Email *</label>
                  <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                </div>
                <div style={{display: 'flex', gap: '1rem'}}>
                  <div className="form-row" style={{flex: 1}}>
                    <label className="form-label">Phone</label>
                    <input type="text" className="form-control" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div className="form-row" style={{flex: 1}}>
                    <label className="form-label">Position *</label>
                    <input type="text" className="form-control" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} required />
                  </div>
                </div>
                <div style={{display: 'flex', gap: '1rem'}}>
                  <div className="form-row" style={{flex: 1}}>
                    <label className="form-label">Department *</label>
                    <input type="text" className="form-control" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} required />
                  </div>
                  <div className="form-row" style={{flex: 1}}>
                    <label className="form-label">Assignment Type</label>
                    <select className="form-control" value={formData.assignment_type} onChange={e => setFormData({...formData, assignment_type: e.target.value})}>
                      <option value="Regular">Regular</option>
                      <option value="Project-based">Project-based</option>
                      <option value="Outsourcing">Outsourcing</option>
                      <option value="Magang">Magang</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Employees;
