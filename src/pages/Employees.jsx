import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Edit2, Eye, Trash2, Download, Upload, X } from 'lucide-react';
import { insforge } from '../lib/insforge';
import './Pages.css';

const Employees = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Bulk Import state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  // Form Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    status: 'Active',
    assignment_type: 'Regular',
    project_id: ''
  });

  useEffect(() => {
    fetchEmployees();
    fetchProjects();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const [empRes, contRes] = await Promise.all([
        insforge.database.from('employees').select('*').order('name'),
        insforge.database.from('contracts').select('*')
      ]);
      
      if (empRes.error) throw empRes.error;
      
      if (empRes.data) {
        let employeeData = empRes.data;
        if (contRes.data) {
          const now = new Date();
          employeeData = employeeData.map(emp => {
            // Find latest contract
            const empContracts = contRes.data.filter(c => c.employee_id === emp.id);
            if (empContracts.length > 0) {
              const latest = empContracts.sort((a, b) => new Date(b.start_date) - new Date(a.start_date))[0];
              if (latest.end_date && new Date(latest.end_date) < now && latest.contract_status === 'Active') {
                return { ...emp, status: 'Inactive', _reason: 'Contract Expired' };
              }
            }
            return emp;
          });
        }
        setEmployees(employeeData);
      }
    } catch (error) {
      console.error('Error fetching employees:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await insforge
        .database.from('projects')
        .select('id, project_name')
        .eq('status', 'Active');
      if (error) throw error;
      if (data) setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error.message);
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

  const handleOpenModal = (employee = null) => {
    if (employee) {
      setEditingId(employee.id);
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        position: employee.position || '',
        department: employee.department || '',
        status: employee.status || 'Active',
        assignment_type: employee.assignment_type || 'Regular',
        project_id: ''
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '', email: '', phone: '', position: '', department: '', status: 'Active', assignment_type: 'Regular', project_id: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Hapus karyawan "${name}"?`)) return;
    try {
      const { error } = await insforge.database.from('employees').delete().eq('id', id);
      if (error) throw error;
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting:', error.message);
      alert('Gagal menghapus karyawan: ' + error.message);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      const employeeData = { ...formData };
      const selectedProject = employeeData.project_id;
      delete employeeData.project_id; // Remove it from employee insert/update

      let newEmployeeId = editingId;

      if (editingId) {
        const { error } = await insforge.database.from('employees').update(employeeData).eq('id', editingId);
        if (error) throw error;
      } else {
        const { data, error } = await insforge.database.from('employees').insert([employeeData]).select('id').single();
        if (error) throw error;
        if (data) newEmployeeId = data.id;
      }
      
      // If project-based and project selected, create assignment
      if (employeeData.assignment_type === 'Project-based' && selectedProject && newEmployeeId) {
        await insforge.database.from('project_assignments').insert([{
          employee_id: newEmployeeId,
          project_id: parseInt(selectedProject)
        }]);
      }
      
      setIsModalOpen(false);
      fetchEmployees();
    } catch (error) {
      console.error('Error saving employee:', error.message);
      alert('Gagal menyimpan karyawan: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || emp.status === statusFilter;
    const matchesDepartment = departmentFilter === '' || emp.department === departmentFilter;
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const uniqueDepartments = [...new Set(employees.map(e => e.department).filter(Boolean))].sort();

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
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
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
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="On Leave">On Leave</option>
          </select>
          <select className="filter-select" value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}>
            <option value="">All Departments</option>
            {uniqueDepartments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
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
            ) : filteredEmployees.length === 0 ? (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>Tidak ada data karyawan ditemukan.</td></tr>
            ) : filteredEmployees.map(emp => (
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
                    <button className="btn-icon" title="Edit" onClick={() => handleOpenModal(emp)}><Edit2 size={18} /></button>
                    <button className="btn-icon" style={{color: 'var(--danger)'}} title="Delete" onClick={() => handleDelete(emp.id, emp.name)}><Trash2 size={18} /></button>
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

      {/* Add/Edit Employee Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Employee' : 'Add New Employee'}</h2>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>
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
                {formData.assignment_type === 'Project-based' && (
                  <div className="form-row" style={{marginTop: '-0.5rem'}}>
                    <label className="form-label" style={{color: 'var(--primary-blue)'}}>Assign to Active Project</label>
                    <select className="form-control" value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})} required={formData.assignment_type === 'Project-based' && !editingId}>
                      <option value="">-- Select Project --</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.project_name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {editingId && (
                  <div className="form-row">
                    <label className="form-label">Status</label>
                    <select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="On Leave">On Leave</option>
                    </select>
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
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
