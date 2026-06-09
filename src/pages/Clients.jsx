import React, { useState, useEffect } from 'react';
import { Search, Plus, Building2, Edit2, Trash2, Mail, Phone, X } from 'lucide-react';
import { insforge } from '../lib/insforge';
import './Pages.css';

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company_type: '',
    contact_person: '',
    address: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await insforge
        .database.from('clients')
        .select('*')
        .order('name');
      
      if (error) throw error;
      if (data) setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error.message);
      alert('Gagal mengambil data klien: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (client = null) => {
    if (client) {
      setEditingId(client.id);
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        company_type: client.company_type || '',
        contact_person: client.contact_person || '',
        address: client.address || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company_type: '',
        contact_person: '',
        address: ''
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
      if (editingId) {
        // Update
        const { error } = await insforge
          .database.from('clients')
          .update(formData)
          .eq('id', editingId);
        
        if (error) throw error;
      } else {
        // Insert
        const { error } = await insforge
          .database.from('clients')
          .insert([formData]);
        
        if (error) throw error;
      }
      handleCloseModal();
      fetchClients();
    } catch (error) {
      console.error('Error saving client:', error.message);
      alert('Gagal menyimpan klien: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus klien "${name}"?`)) {
      return;
    }
    
    try {
      const { error } = await insforge
        .database.from('clients')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error.message);
      alert('Gagal menghapus klien. Mungkin klien ini masih memiliki proyek aktif. Error: ' + error.message);
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Clients</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} />
          Add Client
        </button>
      </div>

      <div className="actions-bar">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search clients by company name..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Contact Info</th>
              <th>Industry Type</th>
              <th>Contact Person</th>
              <th style={{textAlign: 'right'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>Loading clients...</td></tr>
            ) : filteredClients.length === 0 ? (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>Tidak ada data klien ditemukan.</td></tr>
            ) : filteredClients.map(client => (
              <tr key={client.id}>
                <td>
                  <div className="user-info">
                    <div className="avatar" style={{backgroundColor: '#f3f4f6', color: 'var(--primary-blue)'}}>
                      <Building2 size={18} />
                    </div>
                    <div>
                      <span className="font-medium" style={{ display: 'block' }}>{client.name}</span>
                      {client.address && (
                        <span className="text-muted" style={{ fontSize: '0.8rem', display: 'block', marginTop: '2px', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {client.address}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="user-details" style={{gap: '0.25rem'}}>
                    {client.email && (
                      <div className="flex items-center gap-2 text-muted" style={{fontSize: '0.75rem'}}>
                        <Mail size={14} /> {client.email}
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2 text-muted" style={{fontSize: '0.75rem'}}>
                        <Phone size={14} /> {client.phone}
                      </div>
                    )}
                    {!client.email && !client.phone && <span className="text-muted" style={{fontSize: '0.75rem'}}>-</span>}
                  </div>
                </td>
                <td>
                  {client.company_type ? 
                    <span className="badge badge-blue">{client.company_type}</span> : 
                    '-'
                  }
                </td>
                <td>{client.contact_person || '-'}</td>
                <td style={{textAlign: 'right'}}>
                  <div className="flex items-center gap-2" style={{justifyContent: 'flex-end'}}>
                    <button className="btn-icon" title="Edit" onClick={() => handleOpenModal(client)}>
                      <Edit2 size={18} />
                    </button>
                    <button className="btn-icon" style={{color: 'var(--danger)'}} title="Delete" onClick={() => handleDelete(client.id, client.name)}>
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

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Client' : 'Add New Client'}</h2>
              <button className="btn-close" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <label className="form-label">Company Name *</label>
                  <input 
                    type="text" 
                    name="name" 
                    className="form-control" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                    placeholder="e.g. PT Maju Bersama"
                  />
                </div>
                
                <div style={{display: 'flex', gap: '1rem'}}>
                  <div className="form-row" style={{flex: 1}}>
                    <label className="form-label">Email</label>
                    <input 
                      type="email" 
                      name="email" 
                      className="form-control" 
                      value={formData.email} 
                      onChange={handleChange} 
                      placeholder="contact@company.com"
                    />
                  </div>
                  
                  <div className="form-row" style={{flex: 1}}>
                    <label className="form-label">Phone</label>
                    <input 
                      type="text" 
                      name="phone" 
                      className="form-control" 
                      value={formData.phone} 
                      onChange={handleChange} 
                      placeholder="+62 21..."
                    />
                  </div>
                </div>

                <div style={{display: 'flex', gap: '1rem'}}>
                  <div className="form-row" style={{flex: 1}}>
                    <label className="form-label">Industry Type</label>
                    <input 
                      type="text" 
                      name="company_type" 
                      className="form-control" 
                      value={formData.company_type} 
                      onChange={handleChange} 
                      placeholder="e.g. Manufacturing, Mining"
                    />
                  </div>
                  
                  <div className="form-row" style={{flex: 1}}>
                    <label className="form-label">Contact Person</label>
                    <input 
                      type="text" 
                      name="contact_person" 
                      className="form-control" 
                      value={formData.contact_person} 
                      onChange={handleChange} 
                      placeholder="PIC Name"
                    />
                  </div>
                </div>

                <div className="form-row" style={{marginBottom: 0}}>
                  <label className="form-label">Address</label>
                  <textarea 
                    name="address" 
                    className="form-control" 
                    value={formData.address} 
                    onChange={handleChange} 
                    placeholder="Company full address..."
                  ></textarea>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Clients;
