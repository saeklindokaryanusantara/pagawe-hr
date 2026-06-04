import React, { useState } from 'react';
import { ArrowLeft, User, FileText, Briefcase, Download, Upload } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import './Pages.css';

const mockEmployee = {
  id: 1, 
  name: 'Budi Santoso', 
  email: 'budi@example.com', 
  phone: '+62 812 3456 7890',
  position: 'Senior Welder', 
  department: 'Engineering', 
  hireDate: '2023-01-15',
  status: 'Active', 
  assignmentType: 'Project-based'
};

const EmployeeDetail = () => {
  // In a real app, we would fetch employee data based on id from useParams
  const [activeTab, setActiveTab] = useState('documents');

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="container animate-fade-in" style={{paddingBottom: '3rem'}}>
      <div className="page-header" style={{marginBottom: '1rem'}}>
        <div className="flex items-center gap-4">
          <Link to="/employees" className="btn-icon" style={{color: 'var(--text-main)'}}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="page-title">Employee Profile</h1>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="card" style={{display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '2rem'}}>
        <div style={{width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--primary-blue-light)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold'}}>
          {getInitials(mockEmployee.name)}
        </div>
        <div style={{flex: 1}}>
          <h2 style={{fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem'}}>{mockEmployee.name}</h2>
          <p className="text-muted" style={{marginBottom: '0.5rem'}}>{mockEmployee.position} • {mockEmployee.department}</p>
          <div className="flex gap-4">
            <span className="badge badge-green">{mockEmployee.status}</span>
            <span className="badge badge-blue">{mockEmployee.assignmentType}</span>
          </div>
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '200px'}}>
          <div className="text-muted" style={{fontSize: '0.875rem'}}><strong>Email:</strong> {mockEmployee.email}</div>
          <div className="text-muted" style={{fontSize: '0.875rem'}}><strong>Phone:</strong> {mockEmployee.phone}</div>
          <div className="text-muted" style={{fontSize: '0.875rem'}}><strong>Hire Date:</strong> {new Date(mockEmployee.hireDate).toLocaleDateString()}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem'}}>
        <button 
          className={`nav-link ${activeTab === 'documents' ? 'active' : ''}`}
          style={{padding: '0.75rem 0', color: activeTab === 'documents' ? 'var(--primary-blue)' : 'var(--text-muted)', borderBottom: activeTab === 'documents' ? '2px solid var(--primary-blue)' : '2px solid transparent', borderRadius: 0, fontWeight: 600}}
          onClick={() => setActiveTab('documents')}
        >
          <FileText size={18} /> Documents
        </button>
        <button 
          className={`nav-link ${activeTab === 'contracts' ? 'active' : ''}`}
          style={{padding: '0.75rem 0', color: activeTab === 'contracts' ? 'var(--primary-blue)' : 'var(--text-muted)', borderBottom: activeTab === 'contracts' ? '2px solid var(--primary-blue)' : '2px solid transparent', borderRadius: 0, fontWeight: 600}}
          onClick={() => setActiveTab('contracts')}
        >
          <FileText size={18} /> Contracts
        </button>
        <button 
          className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
          style={{padding: '0.75rem 0', color: activeTab === 'history' ? 'var(--primary-blue)' : 'var(--text-muted)', borderBottom: activeTab === 'history' ? '2px solid var(--primary-blue)' : '2px solid transparent', borderRadius: 0, fontWeight: 600}}
          onClick={() => setActiveTab('history')}
        >
          <Briefcase size={18} /> Assignment History
        </button>
      </div>

      {/* Tab Content */}
      <div className="card">
        {activeTab === 'documents' && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center" style={{marginBottom: '1rem'}}>
              <h3 className="card-title" style={{margin: 0}}>Supporting Documents</h3>
              <button className="btn btn-primary" style={{padding: '0.5rem 1rem'}}><Upload size={16}/> Upload New</button>
            </div>
            <table className="data-table">
              <thead><tr><th>Document Name</th><th>Type</th><th>Upload Date</th><th style={{textAlign: 'right'}}>Action</th></tr></thead>
              <tbody>
                <tr><td>KTP_Budi.pdf</td><td>Identity</td><td>15 Jan 2023</td><td style={{textAlign: 'right'}}><button className="btn-icon"><Download size={16}/></button></td></tr>
                <tr><td>Ijazah_SMK.pdf</td><td>Education</td><td>15 Jan 2023</td><td style={{textAlign: 'right'}}><button className="btn-icon"><Download size={16}/></button></td></tr>
                <tr><td>Sertifikat_Welding.pdf</td><td>Certification</td><td>20 Feb 2024</td><td style={{textAlign: 'right'}}><button className="btn-icon"><Download size={16}/></button></td></tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="animate-fade-in">
             <div className="flex justify-between items-center" style={{marginBottom: '1rem'}}>
              <h3 className="card-title" style={{margin: 0}}>Employment Contracts</h3>
            </div>
            <table className="data-table">
              <thead><tr><th>Contract Type</th><th>Start Date</th><th>End Date</th><th>Status</th><th style={{textAlign: 'right'}}>Action</th></tr></thead>
              <tbody>
                <tr><td>PKWT</td><td>01 Jan 2025</td><td>31 Dec 2025</td><td><span className="badge badge-green">Active</span></td><td style={{textAlign: 'right'}}><button className="btn-icon"><Download size={16}/></button></td></tr>
                <tr><td>PKWT</td><td>01 Jan 2024</td><td>31 Dec 2024</td><td><span className="badge badge-yellow">Expired</span></td><td style={{textAlign: 'right'}}><button className="btn-icon"><Download size={16}/></button></td></tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-fade-in">
             <div className="flex justify-between items-center" style={{marginBottom: '1rem'}}>
              <h3 className="card-title" style={{margin: 0}}>Project Assignments</h3>
            </div>
            <table className="data-table">
              <thead><tr><th>Project Name</th><th>Client</th><th>Assigned Date</th><th>Status</th></tr></thead>
              <tbody>
                <tr><td>Project Alpha - UI</td><td>PT Telkom Indonesia</td><td>15 Jan 2025</td><td><span className="badge badge-green">Active</span></td></tr>
                <tr><td>Delta Support</td><td>PT Telkom Indonesia</td><td>01 Jun 2024</td><td><span className="badge badge-blue">Completed</span></td></tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default EmployeeDetail;
