import React, { useState, useEffect } from 'react';
import { Search, Plus, FileText, Edit2, Trash2, Download, Upload, X, AlertTriangle, Clock } from 'lucide-react';
import { insforge } from '../lib/insforge';
import './Pages.css';

const Contracts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [contracts, setContracts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    contract_type: 'PKWT',
    contract_status: 'Pending',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchContracts();
    fetchEmployees();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const { data, error } = await insforge
        .database.from('contracts')
        .select('*')
        .order('start_date');
      
      if (error) throw error;
      if (data) {
        // Auto-expire: check contracts that have passed their end_date
        const now = new Date();
        const processed = data.map(c => {
          if (c.end_date && new Date(c.end_date) < now && c.contract_status === 'Active') {
            return { ...c, contract_status: 'Expired', _autoExpired: true };
          }
          // Mark as expiring soon (within 30 days)
          if (c.end_date && c.contract_status === 'Active') {
            const daysUntilExpire = Math.ceil((new Date(c.end_date) - now) / (1000 * 60 * 60 * 24));
            if (daysUntilExpire <= 30 && daysUntilExpire > 0) {
              return { ...c, _expiringSoon: true, _daysLeft: daysUntilExpire };
            }
          }
          return c;
        });
        setContracts(processed);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await insforge
        .database.from('employees')
        .select('id, name, position')
        .order('name');
      if (!error && data) setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error.message);
    }
  };

  // --- CRUD Handlers ---

  const handleOpenModal = (contract = null) => {
    if (contract) {
      setEditingId(contract.id);
      setFormData({
        employee_id: contract.employee_id || '',
        contract_type: contract.contract_type || 'PKWT',
        contract_status: contract.contract_status || 'Pending',
        start_date: contract.start_date || '',
        end_date: contract.end_date || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        employee_id: '',
        contract_type: 'PKWT',
        contract_status: 'Pending',
        start_date: '',
        end_date: '',
      });
    }
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setSelectedFile(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSize = 20 * 1024 * 1024; // 20MB
      if (file.size > maxSize) {
        alert('Ukuran file maksimal 20MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      let documentUrl = null;
      
      // Upload file if selected
      if (selectedFile) {
        try {
          const fileExt = selectedFile.name.split('.').pop();
          const fileName = `contracts/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const { data: uploadData, error: uploadError } = await insforge.storage
            .from('documents')
            .upload(fileName, selectedFile);
          
          if (uploadError) throw uploadError;
          documentUrl = insforge.storage.from('documents').getPublicUrl(fileName);
        } catch (uploadErr) {
          console.warn('File upload failed (mock mode):', uploadErr);
          documentUrl = `mock://documents/${selectedFile.name}`;
        }
      }

      const payload = {
        ...formData,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        ...(documentUrl && { document_url: documentUrl })
      };
      
      if (editingId) {
        const { error } = await insforge
          .database.from('contracts')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await insforge
          .database.from('contracts')
          .insert([payload]);
        if (error) throw error;
      }
      handleCloseModal();
      fetchContracts();
    } catch (error) {
      console.error('Error saving contract:', error.message);
      alert('Gagal menyimpan kontrak: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kontrak ini?')) return;
    try {
      const { error } = await insforge
        .database.from('contracts')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchContracts();
    } catch (error) {
      console.error('Error deleting contract:', error.message);
      alert('Gagal menghapus kontrak: ' + error.message);
    }
  };

  // --- Helpers ---

  const getEmployeeName = (employeeId) => {
    const emp = employees.find(e => e.id === employeeId);
    return emp ? emp.name : '-';
  };

  const getEmployeePosition = (employeeId) => {
    const emp = employees.find(e => e.id === employeeId);
    return emp ? emp.position : '';
  };

  const getStatusBadge = (contract) => {
    if (contract._expiringSoon) {
      return (
        <span className="badge" style={{backgroundColor: '#fef3c7', color: '#d97706'}}>
          <AlertTriangle size={12} style={{marginRight: '4px'}} />
          Expiring ({contract._daysLeft}d)
        </span>
      );
    }
    switch(contract.contract_status) {
      case 'Active': return <span className="badge badge-green">Active</span>;
      case 'Pending': return <span className="badge badge-yellow">Pending</span>;
      case 'Expired': return <span className="badge" style={{backgroundColor: '#fee2e2', color: '#ef4444'}}>Expired</span>;
      case 'Terminated': return <span className="badge" style={{backgroundColor: '#f3e8ff', color: '#7c3aed'}}>Terminated</span>;
      default: return <span className="badge">{contract.contract_status}</span>;
    }
  };

  const getTypeBadge = (type) => {
    switch(type) {
      case 'PKWT': return <span className="badge badge-blue">PKWT</span>;
      case 'PKWTT': return <span className="badge badge-green">PKWTT</span>;
      case 'Magang': return <span className="badge badge-yellow">Magang</span>;
      case 'Outsourcing': return <span className="badge" style={{backgroundColor: '#e0e7ff', color: '#4338ca'}}>Outsourcing</span>;
      default: return <span className="badge">{type}</span>;
    }
  };

  const filteredContracts = contracts.filter(c => {
    const employeeName = getEmployeeName(c.employee_id).toLowerCase();
    const matchesSearch = employeeName.includes(searchTerm.toLowerCase()) || 
      c.contract_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'Expiring Soon') {
      matchesStatus = c._expiringSoon === true;
    } else if (statusFilter) {
      matchesStatus = c.contract_status === statusFilter;
    }
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Contracts</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} />
          Add Contract
        </button>
      </div>

      <div className="actions-bar">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by employee name or contract type..." 
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
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Expired">Expired</option>
            <option value="Terminated">Terminated</option>
          </select>
        </div>
      </div>

      {/* Expiring Soon Alert */}
      {contracts.some(c => c._expiringSoon) && (
        <div style={{
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem',
          padding: '0.875rem 1.25rem',
          backgroundColor: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          color: '#92400e'
        }}>
          <AlertTriangle size={18} />
          <span>
            <strong>{contracts.filter(c => c._expiringSoon).length} kontrak</strong> akan berakhir dalam 30 hari ke depan!
          </span>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Contract Type</th>
              <th>Period</th>
              <th>Status</th>
              <th>Document</th>
              <th style={{textAlign: 'right'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>Loading contracts...</td></tr>
            ) : filteredContracts.length === 0 ? (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>Tidak ada data kontrak ditemukan.</td></tr>
            ) : filteredContracts.map(contract => (
              <tr key={contract.id}>
                <td>
                  <div className="user-info">
                    <div className="avatar" style={{backgroundColor: '#fef3c7', color: '#d97706'}}>
                      <FileText size={18} />
                    </div>
                    <div className="user-details">
                      <span className="font-medium">{getEmployeeName(contract.employee_id)}</span>
                      <span className="text-muted" style={{fontSize: '0.75rem'}}>{getEmployeePosition(contract.employee_id)}</span>
                    </div>
                  </div>
                </td>
                <td>{getTypeBadge(contract.contract_type)}</td>
                <td>
                  <div style={{fontSize: '0.85rem'}}>
                    <div>{contract.start_date ? new Date(contract.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</div>
                    {contract.end_date && (
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>
                        <Clock size={12} style={{marginRight: '4px', verticalAlign: 'middle'}} />
                        s/d {new Date(contract.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    )}
                    {!contract.end_date && contract.contract_type === 'PKWTT' && (
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Permanent</div>
                    )}
                  </div>
                </td>
                <td>{getStatusBadge(contract)}</td>
                <td>
                  {contract.document_url ? (
                    <a 
                      href={contract.document_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn-icon" 
                      title="Download Document"
                      style={{color: 'var(--primary-blue)'}}
                    >
                      <Download size={18} />
                    </a>
                  ) : (
                    <span className="text-muted" style={{fontSize: '0.75rem'}}>No file</span>
                  )}
                </td>
                <td style={{textAlign: 'right'}}>
                  <div className="flex items-center gap-2" style={{justifyContent: 'flex-end'}}>
                    {contract._expiringSoon && (
                      <button 
                        className="btn-icon" 
                        title="Send Renewal Reminder" 
                        onClick={() => {
                          alert(`Simulasi: Email pengingat perpanjangan kontrak telah dikirim ke ${getEmployeeName(contract.employee_id)}.`);
                        }}
                      >
                        <AlertTriangle size={18} style={{color: '#d97706'}} />
                      </button>
                    )}
                    <button className="btn-icon" title="Edit" onClick={() => handleOpenModal(contract)}>
                      <Edit2 size={18} />
                    </button>
                    <button className="btn-icon" style={{color: 'var(--danger)'}} title="Delete" onClick={() => handleDelete(contract.id)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Contract Modal */}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Contract' : 'Add New Contract'}</h2>
              <button className="btn-close" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <label className="form-label">Employee *</label>
                  <select name="employee_id" className="form-control" value={formData.employee_id} onChange={handleChange} required>
                    <option value="">Select Employee...</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} — {e.position}</option>
                    ))}
                  </select>
                </div>
                
                <div style={{display: 'flex', gap: '1rem'}}>
                  <div className="form-row" style={{flex: 1}}>
                    <label className="form-label">Contract Type *</label>
                    <select name="contract_type" className="form-control" value={formData.contract_type} onChange={handleChange} required>
                      <option value="PKWT">PKWT</option>
                      <option value="PKWTT">PKWTT</option>
                      <option value="Magang">Magang</option>
                      <option value="Outsourcing">Outsourcing</option>
                    </select>
                  </div>
                  
                  <div className="form-row" style={{flex: 1}}>
                    <label className="form-label">Status *</label>
                    <select name="contract_status" className="form-control" value={formData.contract_status} onChange={handleChange} required>
                      <option value="Pending">Pending</option>
                      <option value="Active">Active</option>
                      <option value="Expired">Expired</option>
                      <option value="Terminated">Terminated</option>
                    </select>
                  </div>
                </div>

                <div style={{display: 'flex', gap: '1rem'}}>
                  <div className="form-row" style={{flex: 1}}>
                    <label className="form-label">Start Date *</label>
                    <input 
                      type="date" 
                      name="start_date" 
                      className="form-control" 
                      value={formData.start_date} 
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="form-row" style={{flex: 1}}>
                    <label className="form-label">End Date {formData.contract_type !== 'PKWTT' ? '*' : '(optional)'}</label>
                    <input 
                      type="date" 
                      name="end_date" 
                      className="form-control" 
                      value={formData.end_date} 
                      onChange={handleChange}
                      required={formData.contract_type !== 'PKWTT'}
                    />
                  </div>
                </div>

                <div className="form-row" style={{marginBottom: 0}}>
                  <label className="form-label">Contract Document (PDF/Word, max 20MB)</label>
                  <div style={{
                    border: '2px dashed #d1d5db',
                    borderRadius: '10px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: '#f9fafb',
                    transition: 'border-color 0.2s'
                  }}
                    onClick={() => document.getElementById('contract-file-input').click()}
                  >
                    <Upload size={24} style={{color: 'var(--text-muted)', marginBottom: '0.5rem'}} />
                    <p style={{fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0}}>
                      {selectedFile ? (
                        <span style={{color: 'var(--primary-blue)', fontWeight: '500'}}>{selectedFile.name}</span>
                      ) : (
                        'Click to upload or drag & drop'
                      )}
                    </p>
                    <input 
                      id="contract-file-input"
                      type="file" 
                      accept=".pdf,.doc,.docx"
                      style={{display: 'none'}}
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Contracts;
