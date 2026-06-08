import React, { useState, useEffect } from 'react';
import { Users, Activity, Briefcase, Building } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { insforge } from '../lib/insforge';
import './Dashboard.css';

const COLORS = ['#2563eb', '#e5e7eb'];

const Dashboard = () => {
  const [kpiData, setKpiData] = useState({ assignedStaff: 0, idleStaff: 0, activeProjects: 0, utilizationRate: 0 });
  const [topProjectsData, setTopProjectsData] = useState([]);
  const [utilizationData, setUtilizationData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [empRes, projRes, assignRes] = await Promise.all([
        insforge.database.from('employees').select('*'),
        insforge.database.from('projects').select('*'),
        insforge.database.from('project_assignments').select('*'),
      ]);

      const employees = empRes.data || [];
      const projects = projRes.data || [];
      const assignments = assignRes.data || [];

      // KPI calculations
      const activeEmployees = employees.filter(e => e.status === 'Active');
      const assignedEmployeeIds = [...new Set(assignments.map(a => a.employee_id))];
      const assignedCount = activeEmployees.filter(e => assignedEmployeeIds.includes(e.id)).length;
      const idleCount = activeEmployees.length - assignedCount;
      const activeProjectCount = projects.filter(p => p.status === 'Active').length;
      const rate = activeEmployees.length > 0 ? Math.round((assignedCount / activeEmployees.length) * 100) : 0;

      setKpiData({
        assignedStaff: assignedCount,
        idleStaff: idleCount,
        activeProjects: activeProjectCount,
        utilizationRate: rate
      });

      // Top projects chart data
      const projectChartData = projects
        .map(p => ({
          name: p.project_name?.length > 18 ? p.project_name.substring(0, 18) + '...' : p.project_name,
          workers: assignments.filter(a => a.project_id === p.id).length
        }))
        .sort((a, b) => b.workers - a.workers)
        .slice(0, 6);
      setTopProjectsData(projectChartData);

      // Utilization pie data
      setUtilizationData([
        { name: 'Assigned', value: assignedCount },
        { name: 'Idle', value: idleCount }
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="dashboard-hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Welcome to Pagawe</h1>
            <p className="hero-subtitle">
              Manage your workforce, track project assignments, and monitor utilization across all client engagements.
            </p>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="kpi-section">
        <div className="container">
          <div className="kpi-grid">
            
            <div className="kpi-card delay-100">
              <div className="kpi-header">
                <span className="kpi-title">Assigned Staff</span>
                <div className="kpi-icon-wrapper kpi-icon-blue">
                  <Users size={20} />
                </div>
              </div>
              <div className="kpi-value">{loading ? '...' : kpiData.assignedStaff}</div>
            </div>

            <div className="kpi-card delay-200">
              <div className="kpi-header">
                <span className="kpi-title">Idle Staff</span>
                <div className="kpi-icon-wrapper kpi-icon-orange">
                  <Activity size={20} />
                </div>
              </div>
              <div className="kpi-value">{loading ? '...' : kpiData.idleStaff}</div>
            </div>

            <div className="kpi-card delay-300">
              <div className="kpi-header">
                <span className="kpi-title">Active Projects</span>
                <div className="kpi-icon-wrapper kpi-icon-green">
                  <Briefcase size={20} />
                </div>
              </div>
              <div className="kpi-value">{loading ? '...' : kpiData.activeProjects}</div>
            </div>

            <div className="kpi-card delay-300">
              <div className="kpi-header">
                <span className="kpi-title">Utilization Rate</span>
                <div className="kpi-icon-wrapper kpi-icon-purple">
                  <Building size={20} />
                </div>
              </div>
              <div className="kpi-value">{loading ? '...' : `${kpiData.utilizationRate}%`}</div>
            </div>

          </div>
        </div>
      </section>

      {/* Charts Section */}
      <section className="charts-section">
        <div className="container">
          <div className="charts-grid">
            
            {/* Bar Chart */}
            <div className="chart-card">
              <div className="chart-header">
                <h2 className="chart-title">Top Projects by Assignment</h2>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProjectsData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
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

            {/* Donut Chart */}
            <div className="chart-card">
              <div className="chart-header">
                <h2 className="chart-title">Workforce Utilization</h2>
              </div>
              <div className="chart-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative'}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={utilizationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {utilizationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text for Donut */}
                <div style={{position: 'absolute', textAlign: 'center', pointerEvents: 'none'}}>
                   <div style={{fontSize: '2rem', fontWeight: '700', color: 'var(--text-main)', lineHeight: '1'}}>{kpiData.utilizationRate}%</div>
                   <div style={{fontSize: '0.875rem', color: 'var(--text-muted)'}}>Utilized</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};

export default Dashboard;
