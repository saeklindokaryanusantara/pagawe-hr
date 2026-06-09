import React, { useState, useEffect } from 'react';
import { Search, Plus, Briefcase, Edit2, Trash2, MapPin, Users, X, UserPlus, UserMinus } from 'lucide-react';
import { insforge } from '../lib/insforge';
import './Pages.css';

const Projects = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    project_name: '',
    client_id: '',
    location: '',
    status: 'Pending',
    start_date: '',
    end_date: '',
    budget: '',
    description: ''
  });

  // Assignment modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [assignedWorkers, setAssignedWorkers] = useState([]);
  const [availableWorkers, setAvailableWorkers] = useState([]);
  const [assignSearchTerm, setAssignSearchTerm] = useState('');

  useEffect(() => {
    fetchProjects();
    fetchClients();
    fetchEmployees();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await insforge
        .database.from('projects')
        .select('*')
        .order('project_name');
      
      if (error) throw error;
      if (data) {
        // Fetch assignment counts for each project
        const projectsWithCounts = await Promise.all(data.map(async (project) => {
          try {
            const { data: assignments, error: assignError } = await insforge
              .database.from('project_assignments')
              .select('id')
              .eq('project_id', project.id);
            
            return { 
              ...project, 
              team_size: assignError ? 0 : (assignments?.length || 0) 
            };
          } catch {
            return { ...project, team_size: 0 };
          }
        }));
        setProjects(projectsWithCounts);
      }
    } catch (error) {
      console.error('Error fetching projects:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await insforge
        .database.from('clients')
        .select('id, name')
        .order('name');
      if (!error && data) setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error.message);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await insforge
        .database.from('employees')
        .select('*')
        .order('name');
      if (!error && data) setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error.message);
    }
  };

  // --- CRUD Handlers ---

  const handleOpenModal = (project = null) => {
    if (project) {
      setEditingId(project.id);
      setFormData({
        project_name: project.project_name || '',
        client_id: project.client_id || '',
        location: project.location || '',
        status: project.status || 'Pending',
        start_date: project.start_date || '',
        end_date: project.end_date || '',
        budget: project.budget || '',
        description: project.description || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        project_name: '',
        client_id: '',
        location: '',
        status: 'Pending',
        start_date: '',
        end_date: '',
        budget: '',
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        budget: formData.budget ? Number(formData.budget) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };
      
      if (editingId) {
        const { error } = await insforge
          .database.from('projects')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await insforge
          .database.from('projects')
          .insert([payload]);
        if (error) throw error;
      }
      handleCloseModal();
      fetchProjects();
    } catch (error) {
      console.error('Error saving project:', error.message);
      alert('Gagal menyimpan project: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus project "${name}"?`)) return;
    try {
      const { error } = await insforge
        .database.from('projects')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error.message);
      alert('Gagal menghapus project. Mungkin masih ada worker yang di-assign. Error: ' + error.message);
    }
  };

  // --- Assignment Handlers ---

  const handleOpenAssignModal = async (project) => {
    setSelectedProject(project);
    setAssignSearchTerm('');
    try {
      const { data: assignments, error } = await insforge
        .database.from('project_assignments')
        .select('employee_id')
        .eq('project_id', project.id);
      
      if (error) throw error;
      
      const assignedIds = (assignments || []).map(a => a.employee_id);
      const assigned = employees.filter(e => assignedIds.includes(e.id));
      const available = employees.filter(e => !assignedIds.includes(e.id) && e.status === 'Active');
      
      setAssignedWorkers(assigned);
      setAvailableWorkers(available);
    } catch (error) {
      console.error('Error fetching assignments:', error.message);
      setAssignedWorkers([]);
      setAvailableWorkers(employees.filter(e => e.status === 'Active'));
    }
    setIsAssignModalOpen(true);
  };

  const handleAssignWorker = async (employeeId) => {
    if (!selectedProject) return;
    try {
      const { error } = await insforge
        .database.from('project_assignments')
        .insert([{ employee_id: employeeId, project_id: selectedProject.id }]);
      if (error) throw error;
      
      // Move worker from available to assigned locally
      const worker = availableWorkers.find(w => String(w.id) === String(employeeId));
      if (worker) {
        setAssignedWorkers(prev => [...prev, worker]);
        setAvailableWorkers(prev => prev.filter(w => w.id !== employeeId));
      }
    } catch (error) {
      console.error('Error assigning worker:', error.message);
      alert('Gagal assign worker: ' + error.message);
    }
  };

  const handleUnassignWorker = async (employeeId) => {
    if (!selectedProject) return;
    try {
      const { error } = await insforge
        .database.from('project_assignments')
        .delete()
        .eq('project_id', selectedProject.id)
        .eq('employee_id', employeeId);
      if (error) throw error;
      
      const worker = assignedWorkers.find(w => String(w.id) === String(employeeId));
      if (worker) {
        setAvailableWorkers(prev => [...prev, worker].sort((a, b) => a.name.localeCompare(b.name)));
        setAssignedWorkers(prev => prev.filter(w => w.id !== employeeId));
      }
    } catch (error) {
      console.error('Error unassigning worker:', error.message);
      alert('Gagal unassign worker: ' + error.message);
    }
  };

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedProject(null);
    fetchProjects(); // refresh team sizes
  };

  // --- Helpers ---

  const getClientName = (clientId) => {
    const client = clients.find(c => String(c.id) === String(clientId));
    return client ? client.name : '-';
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Active': return <span className="badge badge-green">Active</span>;
      case 'Pending': return <span className="badge badge-yellow">Pending</span>;
      case 'Completed': return <span className="badge badge-blue">Completed</span>;
      case 'On Hold': return <span className="badge" style={{backgroundColor: '#fee2e2', color: '#ef4444'}}>On Hold</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = 
      p.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getClientName(p.client_id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? p.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
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
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
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
            {loading ? (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>Loading projects...</td></tr>
            ) : filteredProjects.length === 0 ? (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>Tidak ada data project ditemukan.</td></tr>
            ) : filteredProjects.map(project => (
              <tr key={project.id}>
                <td>
                  <div className="user-info">
                    <div className="avatar" style={{backgroundColor: '#e0e7ff', color: 'var(--primary-blue-dark)'}}>
                      <Briefcase size={18} />
                    </div>
                    <div className="user-details">
                      <span className="font-medium">{project.project_name}</span>
                      <span className="text-muted" style={{fontSize: '0.75rem'}}>{getClientName(project.client_id)}</span>
                    </div>
                  </div>
                </td>
                <td>
                  {project.location ? (
                    <div className="flex items-center gap-2 text-muted" style={{fontSize: '0.875rem'}}>
                      <MapPin size={16} /> {project.location}
                    </div>
                  ) : '-'}
                </td>
                <td>{project.start_date ? new Date(project.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>
                <td>{getStatusBadge(project.status)}</td>
                <td>
                  <div className="flex items-center gap-2" style={{cursor: 'pointer'}} onClick={() => handleOpenAssignModal(project)} title="Manage team assignments">
                    <Users size={16} className="text-muted" />
                    <span className="font-medium">{project.team_size || 0}</span>
                  </div>
                </td>
                <td style={{textAlign: 'right'}}>
                  <div className="flex items-center gap-2" style={{justifyContent: 'flex-end'}}>
                    <button className="btn-icon" title="Manage Team" onClick={() => handleOpenAssignModal(project)}>
                      <UserPlus size={18} />
                    </button>
                    <button className="btn-icon" title="Edit" onClick={() => handleOpenModal(project)}>
                      <Edit2 size={18} />
                    </button>
                    <button className="btn-icon" style={{color: 'var(--danger)'}} title="Delete" onClick={() => handleDelete(project.id, project.project_name)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      </div>

      {/* Add/Edit Project Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Project' : 'Add New Project'}</h2>
              <button className="btn-close" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <label className="form-label">Project Name *</label>
                  <input 
                    type="text" 
                    name="project_name" 
                    className="form-control" 
                    value={formData.project_name} 
                    onChange={handleChange} 
                    required 
                    placeholder="e.g. Project Alpha - UI Development"
                  />
                </div>
                
                <div style={{display: 'flex', gap: '1rem'}}>
                  <div className="form-row" style={{flex: 1}}>
                    <label className="form-label">Client *</label>
                    <select name="client_id" className="form-control" value={formData.client_id} onChange={handleChange} required>
                      <option value="">Select Client...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-row" style={{flex: 1}}>
                    <label className="form-label">Location</label>
                    <input 
                      type="text" 
                      name="location" 
                      className="form-control" 
                      value={formData.location} 
                      onChange={handleChange} 
                      placeholder="e.g. Jakarta, Kalimantan"
                    />
                  </div>
                </div>

                <div style={{display: 'flex', gap: '1rem'}}>
                  <div className="form-row" style={{flex: 1}}>
                    <label className="form-label">Status *</label>
                    <select name="status" className="form-control" value={formData.status} onChange={handleChange} required>
                      <option value="Pending">Pending</option>
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>
                  
                  <div className="form-row" style={{flex: 1}}>
                    <label className="form-label">Budget (Rp)</label>
                    <input 
                      type="number" 
                      name="budget" 
                      className="form-control" 
                      value={formData.budget} 
                      onChange={handleChange} 
                      placeholder="0"
                    />
                  </div>
                </div>

                <div style={{display: 'flex', gap: '1rem'}}>
                  <div className="form-row" style={{flex: 1}}>
                    <label className="form-label">Start Date</label>
                    <input 
                      type="date" 
                      name="start_date" 
                      className="form-control" 
                      value={formData.start_date} 
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-row" style={{flex: 1}}>
                    <label className="form-label">End Date</label>
                    <input 
                      type="date" 
                      name="end_date" 
                      className="form-control" 
                      value={formData.end_date} 
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row" style={{marginBottom: 0}}>
                  <label className="form-label">Description</label>
                  <textarea 
                    name="description" 
                    className="form-control" 
                    value={formData.description} 
                    onChange={handleChange} 
                    placeholder="Project description..."
                    rows={3}
                  ></textarea>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {isAssignModalOpen && selectedProject && (
        <div className="modal-overlay" onClick={handleCloseAssignModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '700px'}}>
            <div className="modal-header">
              <div>
                <h2>Manage Team</h2>
                <p style={{fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem'}}>
                  {selectedProject.project_name}
                </p>
              </div>
              <button className="btn-close" onClick={handleCloseAssignModal}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body" style={{maxHeight: '60vh', overflowY: 'auto'}}>
              {/* Assigned Workers */}
              <div style={{marginBottom: '1.5rem'}}>
                <h3 style={{fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.75rem'}}>
                  Assigned Workers ({assignedWorkers.length})
                </h3>
                {assignedWorkers.length === 0 ? (
                  <p style={{fontSize: '0.85rem', color: 'var(--text-muted)', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px', textAlign: 'center'}}>
                    Belum ada worker yang di-assign ke project ini.
                  </p>
                ) : (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                    {assignedWorkers.map(worker => (
                      <div key={worker.id} style={{
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        backgroundColor: '#f0fdf4',
                        borderRadius: '8px',
                        border: '1px solid #bbf7d0'
                      }}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                          <div className="avatar" style={{width: '32px', height: '32px', fontSize: '0.7rem'}}>
                            {getInitials(worker.name)}
                          </div>
                          <div>
                            <div style={{fontWeight: '500', fontSize: '0.875rem'}}>{worker.name}</div>
                            <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{worker.position} · {worker.department}</div>
                          </div>
                        </div>
                        <button 
                          className="btn-icon" 
                          style={{color: 'var(--danger)'}} 
                          title="Remove from project"
                          onClick={() => handleUnassignWorker(worker.id)}
                        >
                          <UserMinus size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Workers */}
              <div>
                <h3 style={{fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.75rem'}}>
                  Available Workers ({availableWorkers.filter(w => 
                    w.name.toLowerCase().includes(assignSearchTerm.toLowerCase()) ||
                    w.position?.toLowerCase().includes(assignSearchTerm.toLowerCase())
                  ).length})
                </h3>
                <div style={{marginBottom: '0.75rem'}}>
                  <input 
                    type="text"
                    className="form-control"
                    placeholder="Search workers by name or position..."
                    value={assignSearchTerm}
                    onChange={(e) => setAssignSearchTerm(e.target.value)}
                    style={{fontSize: '0.85rem'}}
                  />
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto'}}>
                  {availableWorkers
                    .filter(w => 
                      w.name.toLowerCase().includes(assignSearchTerm.toLowerCase()) ||
                      w.position?.toLowerCase().includes(assignSearchTerm.toLowerCase())
                    )
                    .map(worker => (
                    <div key={worker.id} style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                        <div className="avatar" style={{width: '32px', height: '32px', fontSize: '0.7rem'}}>
                          {getInitials(worker.name)}
                        </div>
                        <div>
                          <div style={{fontWeight: '500', fontSize: '0.875rem'}}>{worker.name}</div>
                          <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{worker.position} · {worker.department}</div>
                        </div>
                      </div>
                      <button 
                        className="btn-icon" 
                        style={{color: 'var(--primary-blue)'}} 
                        title="Assign to project"
                        onClick={() => handleAssignWorker(worker.id)}
                      >
                        <UserPlus size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={handleCloseAssignModal}>Done</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Projects;
