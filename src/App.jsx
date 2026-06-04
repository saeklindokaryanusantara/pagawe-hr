import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import TopNavigation from './components/layout/TopNavigation';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import EmployeeDetail from './pages/EmployeeDetail';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

// Placeholder components for other routes
const Contracts = () => <div className="container" style={{paddingTop: '2rem'}}><h2>Contracts Module (WIP Phase 4)</h2></div>;
const Reports = () => <div className="container" style={{paddingTop: '2rem'}}><h2>Reports Module (WIP Phase 4)</h2></div>;

// Layout for authenticated users
const MainLayout = () => (
  <div className="app-container">
    <TopNavigation />
    <main className="main-content">
      <Outlet />
    </main>
  </div>
);

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/employees/:id" element={<EmployeeDetail />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
