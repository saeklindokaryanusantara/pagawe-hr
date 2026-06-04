import React, { useState } from 'react';
import { Search, Plus, Building2, Edit2, Trash2, Mail, Phone } from 'lucide-react';
import './Pages.css';

// Mock Data
const initialClients = [
  { id: 1, name: 'PT Petrosea Tbk', email: 'contact@petrosea.com', phone: '+62 21 2906 1800', type: 'Mining', contactPerson: 'Bapak Hendra' },
  { id: 2, name: 'PT Waskita Karya', email: 'info@waskita.co.id', phone: '+62 21 850 8510', type: 'Construction', contactPerson: 'Ibu Ratna' },
  { id: 3, name: 'PT Telkom Indonesia', email: 'corporate@telkom.co.id', phone: '+62 21 809 1502', type: 'Telecommunications', contactPerson: 'Bapak Yudi' },
];

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients] = useState(initialClients);

  return (
    <div className="container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Clients</h1>
        <button className="btn btn-primary">
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
            {clients.filter(client => client.name.toLowerCase().includes(searchTerm.toLowerCase())).map(client => (
              <tr key={client.id}>
                <td>
                  <div className="user-info">
                    <div className="avatar" style={{backgroundColor: '#f3f4f6', color: 'var(--primary-blue)'}}>
                      <Building2 size={18} />
                    </div>
                    <span className="font-medium">{client.name}</span>
                  </div>
                </td>
                <td>
                  <div className="user-details" style={{gap: '0.25rem'}}>
                    <div className="flex items-center gap-2 text-muted" style={{fontSize: '0.75rem'}}>
                      <Mail size={14} /> {client.email}
                    </div>
                    <div className="flex items-center gap-2 text-muted" style={{fontSize: '0.75rem'}}>
                      <Phone size={14} /> {client.phone}
                    </div>
                  </div>
                </td>
                <td><span className="badge badge-blue">{client.type}</span></td>
                <td>{client.contactPerson}</td>
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

export default Clients;
