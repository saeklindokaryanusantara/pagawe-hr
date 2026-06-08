import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { insforge } from '../lib/insforge';
import './Pages.css';

const Settings = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  
  // Form State for Adding/Editing
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const { data, error } = await insforge
        .database.from('departments')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (dept) => {
    setEditingId(dept.id);
    setFormData({ name: dept.name, description: dept.description || '' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', description: '' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId === 'new') {
        const { error } = await insforge.database.from('departments').insert([formData]);
        if (error) throw error;
      } else {
        const { error } = await insforge.database.from('departments')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
      }
      handleCancelEdit();
      fetchDepartments();
    } catch (error) {
      console.error('Error saving department:', error.message, error);
      alert('Failed to save department: ' + (error.message || JSON.stringify(error)));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      const { error } = await insforge.database.from('departments').delete().eq('id', id);
      if (error) throw error;
      fetchDepartments();
    } catch (error) {
      console.error('Error deleting department:', error.message, error);
      alert('Failed to delete department: ' + (error.message || JSON.stringify(error)));
    }
  };

  return (
    <div className="container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title"><SettingsIcon size={24} style={{display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom'}}/> System Settings</h1>
      </div>

      <div className="card" style={{marginBottom: '2rem'}}>
        <div className="flex justify-between items-center" style={{marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem'}}>
          <h2 className="card-title" style={{margin: 0}}>Department Configuration</h2>
          <button 
            className="btn btn-primary" 
            onClick={() => { setEditingId('new'); setFormData({name: '', description: ''}); }}
            disabled={editingId !== null}
          >
            <Plus size={16} /> Add Department
          </button>
        </div>

        {loading ? (
          <div style={{textAlign: 'center', padding: '2rem', color: 'var(--text-muted)'}}>Loading departments...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{width: '30%'}}>Department Name</th>
                  <th style={{width: '50%'}}>Description</th>
                  <th style={{width: '20%', textAlign: 'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {editingId === 'new' && (
                  <tr>
                    <td>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Name" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        autoFocus
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Description" 
                        value={formData.description} 
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                      />
                    </td>
                    <td style={{textAlign: 'right'}}>
                      <div className="flex justify-end gap-2">
                         <button className="btn btn-primary" onClick={handleSave} style={{padding: '0.4rem 0.75rem'}}><Save size={14}/></button>
                         <button className="btn btn-secondary" onClick={handleCancelEdit} style={{padding: '0.4rem 0.75rem'}}><X size={14}/></button>
                      </div>
                    </td>
                  </tr>
                )}
                
                {departments.map(dept => (
                  <tr key={dept.id}>
                    {editingId === dept.id ? (
                      <>
                        <td>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={formData.name} 
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={formData.description} 
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                          />
                        </td>
                        <td style={{textAlign: 'right'}}>
                           <div className="flex justify-end gap-2">
                             <button className="btn btn-primary" onClick={handleSave} style={{padding: '0.4rem 0.75rem'}}><Save size={14}/></button>
                             <button className="btn btn-secondary" onClick={handleCancelEdit} style={{padding: '0.4rem 0.75rem'}}><X size={14}/></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td><span className="font-medium">{dept.name}</span></td>
                        <td><span className="text-muted">{dept.description || '-'}</span></td>
                        <td style={{textAlign: 'right'}}>
                          <div className="flex justify-end gap-2">
                            <button className="btn-icon" onClick={() => handleEdit(dept)} title="Edit"><Edit2 size={18} /></button>
                            <button className="btn-icon" style={{color: 'var(--danger)'}} onClick={() => handleDelete(dept.id)} title="Delete"><Trash2 size={18} /></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {departments.length === 0 && editingId !== 'new' && (
                  <tr><td colSpan="3" style={{textAlign: 'center', padding: '2rem'}}>No departments configured.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
