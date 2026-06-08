import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, FileText, Briefcase, Download, Upload, Trash2, Plus } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { insforge } from '../lib/insforge';
import './Pages.css';

const EmployeeDetail = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('documents');
  
  const [employee, setEmployee] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadType, setUploadType] = useState('Identity');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchEmployeeData();
  }, [id]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      
      // Fetch employee profile
      const { data: empData, error: empErr } = await insforge
        .database.from('employees')
        .select('*')
        .eq('id', id)
        .single();
        
      if (empErr) throw empErr;
      setEmployee(empData);

      // Fetch related data in parallel
      const [docsRes, contractsRes, assignRes, projRes, clientRes] = await Promise.all([
        insforge.database.from('employee_documents').select('*').eq('employee_id', id),
        insforge.database.from('contracts').select('*').eq('employee_id', id),
        insforge.database.from('project_assignments').select('*').eq('employee_id', id),
        insforge.database.from('projects').select('*'),
        insforge.database.from('clients').select('*')
      ]);

      if (docsRes.data) setDocuments(docsRes.data);
      if (contractsRes.data) setContracts(contractsRes.data);
      if (assignRes.data) setAssignments(assignRes.data);
      if (projRes.data) setProjects(projRes.data);
      if (clientRes.data) setClients(clientRes.data);

    } catch (error) {
      console.error('Error fetching employee details:', error.message);
      alert('Gagal memuat data karyawan.');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getProjectName = (projectId) => {
    const p = projects.find(x => x.id === projectId);
    return p ? p.project_name : '-';
  };

  const getProjectClient = (projectId) => {
    const p = projects.find(x => x.id === projectId);
    if (!p) return '-';
    const c = clients.find(x => x.id === p.client_id);
    return c ? c.name : '-';
  };

  const getProjectStatus = (projectId) => {
    const p = projects.find(x => x.id === projectId);
    return p ? p.status : '-';
  };

  // --- Document Handlers ---

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert('Ukuran maksimal 20MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    
    try {
      setIsUploading(true);
      
      let documentUrl = null;
      try {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `employees/${id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await insforge.storage
          .from('documents')
          .upload(fileName, selectedFile);
        
        if (uploadError) throw uploadError;
        documentUrl = insforge.storage.from('documents').getPublicUrl(fileName);
      } catch (uploadErr) {
        console.warn('File upload failed (mock mode):', uploadErr);
        documentUrl = `mock://documents/${selectedFile.name}`;
      }

      const payload = {
        employee_id: id,
        document_name: selectedFile.name,
        document_type: uploadType,
        document_url: documentUrl
      };

      const { error } = await insforge.database.from('employee_documents').insert([payload]);
      if (error) throw error;
      
      // Refresh documents
      const { data } = await insforge.database.from('employee_documents').select('*').eq('employee_id', id);
      if (data) setDocuments(data);
      
      setIsUploadModalOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading document:', error.message);
      alert('Gagal mengunggah dokumen.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Yakin ingin menghapus dokumen ini?')) return;
    try {
      const { error } = await insforge.database.from('employee_documents').delete().eq('id', docId);
      if (error) throw error;
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (error) {
      console.error('Error deleting document:', error.message);
    }
  };

  if (loading) {
    return <div className="container" style={{padding: '3rem', textAlign: 'center'}}>Loading employee profile...</div>;
  }

  if (!employee) {
    return <div className="container" style={{padding: '3rem', textAlign: 'center'}}>Employee not found.</div>;
  }

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
          {getInitials(employee.name)}
        </div>
        <div style={{flex: 1}}>
          <h2 style={{fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem'}}>{employee.name}</h2>
          <p className="text-muted" style={{marginBottom: '0.5rem'}}>{employee.position} • {employee.department}</p>
          <div className="flex gap-4">
            <span className={employee.status === 'Active' ? 'badge badge-green' : employee.status === 'Inactive' ? 'badge badge-yellow' : 'badge badge-blue'}>
              {employee.status}
            </span>
            <span className="badge badge-blue">{employee.assignment_type}</span>
          </div>
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '200px'}}>
          <div className="text-muted" style={{fontSize: '0.875rem'}}><strong>Email:</strong> {employee.email}</div>
          <div className="text-muted" style={{fontSize: '0.875rem'}}><strong>Phone:</strong> {employee.phone || '-'}</div>
          <div className="text-muted" style={{fontSize: '0.875rem'}}><strong>Hire Date:</strong> {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('en-GB') : '-'}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem'}}>
        <button 
          className={`nav-link ${activeTab === 'documents' ? 'active' : ''}`}
          style={{padding: '0.75rem 0', color: activeTab === 'documents' ? 'var(--primary-blue)' : 'var(--text-muted)', borderBottom: activeTab === 'documents' ? '2px solid var(--primary-blue)' : '2px solid transparent', borderRadius: 0, fontWeight: 600}}
          onClick={() => setActiveTab('documents')}
        >
          <FileText size={18} /> Documents ({documents.length})
        </button>
        <button 
          className={`nav-link ${activeTab === 'contracts' ? 'active' : ''}`}
          style={{padding: '0.75rem 0', color: activeTab === 'contracts' ? 'var(--primary-blue)' : 'var(--text-muted)', borderBottom: activeTab === 'contracts' ? '2px solid var(--primary-blue)' : '2px solid transparent', borderRadius: 0, fontWeight: 600}}
          onClick={() => setActiveTab('contracts')}
        >
          <FileText size={18} /> Contracts ({contracts.length})
        </button>
        <button 
          className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
          style={{padding: '0.75rem 0', color: activeTab === 'history' ? 'var(--primary-blue)' : 'var(--text-muted)', borderBottom: activeTab === 'history' ? '2px solid var(--primary-blue)' : '2px solid transparent', borderRadius: 0, fontWeight: 600}}
          onClick={() => setActiveTab('history')}
        >
          <Briefcase size={18} /> Assignment History ({assignments.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="card">
        {activeTab === 'documents' && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center" style={{marginBottom: '1rem'}}>
              <h3 className="card-title" style={{margin: 0}}>Supporting Documents</h3>
              <button className="btn btn-primary" style={{padding: '0.5rem 1rem'}} onClick={() => setIsUploadModalOpen(true)}>
                <Upload size={16}/> Upload New
              </button>
            </div>
            <table className="data-table">
              <thead><tr><th>Document Name</th><th>Type</th><th>Upload Date</th><th style={{textAlign: 'right'}}>Action</th></tr></thead>
              <tbody>
                {documents.length === 0 ? (
                  <tr><td colSpan="4" style={{textAlign: 'center', padding: '2rem'}}>No documents found.</td></tr>
                ) : (
                  documents.map(doc => (
                    <tr key={doc.id}>
                      <td><span className="font-medium">{doc.document_name}</span></td>
                      <td><span className="badge badge-blue">{doc.document_type}</span></td>
                      <td>{doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString('en-GB') : '-'}</td>
                      <td style={{textAlign: 'right'}}>
                        <div className="flex justify-end gap-2">
                          <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="btn-icon" title="Download">
                            <Download size={16}/>
                          </a>
                          <button className="btn-icon" style={{color: 'var(--danger)'}} onClick={() => handleDeleteDocument(doc.id)} title="Delete">
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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
                {contracts.length === 0 ? (
                  <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>No contracts found.</td></tr>
                ) : (
                  contracts.map(contract => (
                    <tr key={contract.id}>
                      <td><span className="font-medium">{contract.contract_type}</span></td>
                      <td>{contract.start_date ? new Date(contract.start_date).toLocaleDateString('en-GB') : '-'}</td>
                      <td>{contract.end_date ? new Date(contract.end_date).toLocaleDateString('en-GB') : (contract.contract_type === 'PKWTT' ? 'Permanent' : '-')}</td>
                      <td>
                        {contract.contract_status === 'Active' ? <span className="badge badge-green">Active</span> :
                         contract.contract_status === 'Expired' ? <span className="badge badge-yellow">Expired</span> :
                         <span className="badge">{contract.contract_status}</span>}
                      </td>
                      <td style={{textAlign: 'right'}}>
                        {contract.document_url ? (
                           <a href={contract.document_url} target="_blank" rel="noopener noreferrer" className="btn-icon" title="Download">
                            <Download size={16}/>
                          </a>
                        ) : (
                          <span className="text-muted" style={{fontSize: '0.75rem'}}>No file</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
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
              <thead><tr><th>Project Name</th><th>Client</th><th>Status</th></tr></thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr><td colSpan="3" style={{textAlign: 'center', padding: '2rem'}}>No project assignments found.</td></tr>
                ) : (
                  assignments.map(assignment => {
                    const status = getProjectStatus(assignment.project_id);
                    return (
                      <tr key={assignment.id}>
                        <td><span className="font-medium">{getProjectName(assignment.project_id)}</span></td>
                        <td>{getProjectClient(assignment.project_id)}</td>
                        <td>
                          {status === 'Active' ? <span className="badge badge-green">Active</span> :
                           status === 'Completed' ? <span className="badge badge-blue">Completed</span> :
                           <span className="badge">{status}</span>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="modal-overlay" onClick={() => setIsUploadModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Document</h2>
              <button className="btn-close" onClick={() => setIsUploadModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleUploadDocument}>
              <div className="modal-body">
                <div className="form-row">
                  <label className="form-label">Document Type *</label>
                  <select className="form-control" value={uploadType} onChange={(e) => setUploadType(e.target.value)} required>
                    <option value="Identity">Identity (KTP/Passport)</option>
                    <option value="Education">Education (Ijazah)</option>
                    <option value="Certification">Certification</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-row">
                  <label className="form-label">File (Max 20MB) *</label>
                  <input type="file" className="form-control" onChange={handleFileChange} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsUploadModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isUploading || !selectedFile}>
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDetail;
