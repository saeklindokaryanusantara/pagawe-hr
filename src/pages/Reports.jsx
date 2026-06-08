import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Briefcase, Building2, Download, Calendar } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { insforge } from '../lib/insforge';
import './Pages.css';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Reports = () => {
  const [activeTab, setActiveTab] = useState('utilization');
  
  // Data State
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [empRes, projRes, clientRes, assignRes] = await Promise.all([
        insforge.database.from('employees').select('*').order('name'),
        insforge.database.from('projects').select('*').order('project_name'),
        insforge.database.from('clients').select('*').order('name'),
        insforge.database.from('project_assignments').select('*'),
      ]);
      
      if (empRes.data) setEmployees(empRes.data);
      if (projRes.data) setProjects(projRes.data);
      if (clientRes.data) setClients(clientRes.data);
      if (assignRes.data) setAssignments(assignRes.data);
    } catch (error) {
      console.error('Error fetching report data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Date Range Filter Logic ---
  const isDateInRange = (dateString) => {
    if (!dateString) return true;
    const date = new Date(dateString);
    if (startDate && new Date(startDate) > date) return false;
    if (endDate && new Date(endDate) < date) return false;
    return true;
  };

  // Filter datasets based on date
  const filteredAssignments = assignments.filter(a => isDateInRange(a.assigned_at));
  const filteredProjects = projects.filter(p => isDateInRange(p.created_at));
  // Employees and Clients are generally static reference data, but could be filtered by hire_date / created_at if needed.
  // We'll filter them just to be complete.
  const filteredEmployees = employees.filter(e => isDateInRange(e.hire_date || e.created_at));
  const filteredClients = clients.filter(c => isDateInRange(c.created_at));

  // --- Computed Data ---
  const activeEmployees = filteredEmployees.filter(e => e.status === 'Active');
  const assignedEmployeeIds = [...new Set(filteredAssignments.map(a => a.employee_id))];
  const assignedCount = activeEmployees.filter(e => assignedEmployeeIds.includes(e.id)).length;
  const idleCount = activeEmployees.length - assignedCount;
  const utilizationRate = activeEmployees.length > 0 ? Math.round((assignedCount / activeEmployees.length) * 100) : 0;

  const projectAssignmentData = filteredProjects
    .map(p => ({
      name: p.project_name?.length > 20 ? p.project_name.substring(0, 20) + '...' : p.project_name,
      workers: filteredAssignments.filter(a => a.project_id === p.id).length
    }))
    .sort((a, b) => b.workers - a.workers)
    .slice(0, 8);

  const utilizationPieData = [
    { name: 'Assigned', value: assignedCount },
    { name: 'Idle', value: idleCount }
  ];

  const getClientName = (clientId) => {
    const c = clients.find(cl => cl.id === clientId);
    return c ? c.name : '-';
  };

  const getProjectCountForClient = (clientId) => {
    return filteredProjects.filter(p => p.client_id === clientId && p.status === 'Active').length;
  };

  // --- Tab Renderers ---

  const renderUtilization = () => (
    <div className="charts-grid" style={{gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
      <div className="chart-card">
        <div className="chart-header">
          <h2 className="chart-title">Project Assignments</h2>
        </div>
        <div className="chart-container" style={{height: '350px'}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projectAssignmentData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 11}} angle={-15} textAnchor="end" height={60} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
              <Tooltip 
                cursor={{fill: '#f3f4f6'}}
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
              />
              <Bar dataKey="workers" fill="var(--primary-blue)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <h2 className="chart-title">Employee Utilization</h2>
        </div>
        <div className="chart-container" style={{height: '350px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative'}}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={utilizationPieData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {utilizationPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#2563eb' : '#e5e7eb'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{position: 'absolute', textAlign: 'center', pointerEvents: 'none'}}>
            <div style={{fontSize: '2rem', fontWeight: '700', color: 'var(--text-main)', lineHeight: '1'}}>{utilizationRate}%</div>
            <div style={{fontSize: '0.875rem', color: 'var(--text-muted)'}}>Utilized</div>
          </div>
        </div>
        <div style={{display: 'flex', justifyContent: 'center', gap: '2rem', paddingBottom: '1rem'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem'}}>
            <div style={{width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#2563eb'}}></div>
            Assigned ({assignedCount})
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem'}}>
            <div style={{width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#e5e7eb'}}></div>
            Idle ({idleCount})
          </div>
        </div>
      </div>
    </div>
  );

  const renderProjects = () => (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Project Name</th>
            <th>Client</th>
            <th>Status</th>
            <th>Start Date</th>
            <th>Team Size</th>
          </tr>
        </thead>
        <tbody>
          {filteredProjects.map(project => (
            <tr key={project.id}>
              <td><span className="font-medium">{project.project_name}</span></td>
              <td>{getClientName(project.client_id)}</td>
              <td>
                {project.status === 'Active' && <span className="badge badge-green">Active</span>}
                {project.status === 'Pending' && <span className="badge badge-yellow">Pending</span>}
                {project.status === 'Completed' && <span className="badge badge-blue">Completed</span>}
                {project.status === 'On Hold' && <span className="badge" style={{backgroundColor: '#fee2e2', color: '#ef4444'}}>On Hold</span>}
              </td>
              <td>{project.start_date ? new Date(project.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>
              <td>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-muted" />
                  <span className="font-medium">{filteredAssignments.filter(a => a.project_id === project.id).length}</span>
                </div>
              </td>
            </tr>
          ))}
          {filteredProjects.length === 0 && <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>No projects found for the selected date range.</td></tr>}
        </tbody>
      </table>
    </div>
  );

  const renderEmployees = () => (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Position</th>
            <th>Department</th>
            <th>Status</th>
            <th>Assignment Type</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map(emp => (
            <tr key={emp.id}>
              <td><span className="font-medium">{emp.name}</span></td>
              <td>{emp.position || '-'}</td>
              <td>{emp.department || '-'}</td>
              <td>
                {emp.status === 'Active' && <span className="badge badge-green">Active</span>}
                {emp.status === 'Inactive' && <span className="badge badge-yellow">Inactive</span>}
                {emp.status === 'On Leave' && <span className="badge badge-blue">On Leave</span>}
              </td>
              <td>{emp.assignment_type || '-'}</td>
            </tr>
          ))}
          {filteredEmployees.length === 0 && <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>No employees found for the selected date range.</td></tr>}
        </tbody>
      </table>
    </div>
  );

  const renderClients = () => (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Company Name</th>
            <th>Company Type</th>
            <th>Contact Person</th>
            <th>Active Projects</th>
          </tr>
        </thead>
        <tbody>
          {filteredClients.map(client => (
            <tr key={client.id}>
              <td><span className="font-medium">{client.name}</span></td>
              <td>{client.company_type ? <span className="badge badge-blue">{client.company_type}</span> : '-'}</td>
              <td>{client.contact_person || '-'}</td>
              <td>
                <div className="flex items-center gap-2">
                  <Briefcase size={14} className="text-muted" />
                  <span className="font-medium">{getProjectCountForClient(client.id)}</span>
                </div>
              </td>
            </tr>
          ))}
          {filteredClients.length === 0 && <tr><td colSpan="4" style={{textAlign: 'center', padding: '2rem'}}>No clients found for the selected date range.</td></tr>}
        </tbody>
      </table>
    </div>
  );

  const tabs = [
    { id: 'utilization', label: 'Utilization', icon: BarChart3 },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'clients', label: 'Clients', icon: Building2 },
  ];

  // --- Export Helper ---
  const handleExportCSV = () => {
    let dataToExport = [];
    let filename = '';
    
    if (activeTab === 'utilization') {
      dataToExport = filteredEmployees.map(emp => {
        const isAssigned = assignedEmployeeIds.includes(emp.id);
        return {
          Name: emp.name,
          Position: emp.position,
          Department: emp.department,
          Status: emp.status,
          Utilization: isAssigned ? 'Assigned' : 'Idle'
        };
      });
      filename = 'utilization_report.csv';
    } else if (activeTab === 'projects') {
      dataToExport = filteredProjects.map(p => ({
        'Project Name': p.project_name,
        'Client': getClientName(p.client_id),
        'Status': p.status,
        'Start Date': p.start_date || '-',
        'Team Size': filteredAssignments.filter(a => a.project_id === p.id).length
      }));
      filename = 'projects_report.csv';
    } else if (activeTab === 'employees') {
      dataToExport = filteredEmployees.map(emp => ({
        'Name': emp.name,
        'Position': emp.position,
        'Department': emp.department,
        'Status': emp.status,
        'Assignment Type': emp.assignment_type || '-'
      }));
      filename = 'employees_report.csv';
    } else if (activeTab === 'clients') {
      dataToExport = filteredClients.map(client => ({
        'Company Name': client.name,
        'Company Type': client.company_type || '-',
        'Contact Person': client.contact_person || '-',
        'Active Projects': getProjectCountForClient(client.id)
      }));
      filename = 'clients_report.csv';
    }

    if (dataToExport.length === 0) {
      alert('No data to export.');
      return;
    }

    // Convert to CSV string
    const headers = Object.keys(dataToExport[0]).join(',');
    const rows = dataToExport.map(row => 
      Object.values(row).map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    
    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container animate-fade-in">
      <div className="page-header" style={{alignItems: 'center'}}>
        <h1 className="page-title">Reports & Analytics</h1>
        <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', padding: '0.25rem 0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
             <Calendar size={16} className="text-muted" />
             <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{border: 'none', outline: 'none', fontSize: '0.875rem', background: 'transparent'}} />
             <span className="text-muted">-</span>
             <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{border: 'none', outline: 'none', fontSize: '0.875rem', background: 'transparent'}} />
          </div>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.25rem',
        backgroundColor: '#f3f4f6',
        padding: '0.25rem',
        borderRadius: '12px',
        marginBottom: '1.5rem'
      }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1.25rem',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                flex: 1,
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                backgroundColor: activeTab === tab.id ? 'white' : 'transparent',
                color: activeTab === tab.id ? 'var(--primary-blue)' : 'var(--text-muted)',
                boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Summary Cards */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem'}}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.25rem',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem'}}>Filtered Employees</div>
          <div style={{fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)'}}>{filteredEmployees.length}</div>
        </div>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.25rem',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem'}}>Active Projects</div>
          <div style={{fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)'}}>{filteredProjects.filter(p => p.status === 'Active').length}</div>
        </div>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.25rem',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem'}}>Total Clients</div>
          <div style={{fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)'}}>{filteredClients.length}</div>
        </div>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.25rem',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem'}}>Utilization Rate</div>
          <div style={{fontSize: '1.5rem', fontWeight: '700', color: utilizationRate >= 80 ? '#10b981' : '#f59e0b'}}>{utilizationRate}%</div>
        </div>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div style={{textAlign: 'center', padding: '3rem', color: 'var(--text-muted)'}}>Loading report data...</div>
      ) : (
        <>
          {activeTab === 'utilization' && renderUtilization()}
          {activeTab === 'projects' && renderProjects()}
          {activeTab === 'employees' && renderEmployees()}
          {activeTab === 'clients' && renderClients()}
        </>
      )}
    </div>
  );
};

export default Reports;
