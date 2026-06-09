import { createClient } from '@supabase/supabase-js';

const insforgeUrl = import.meta.env.VITE_INSFORGE_URL;
const insforgeAnonKey = import.meta.env.VITE_INSFORGE_ANON_KEY;

console.log('DEBUG [insforge.js] VITE_INSFORGE_URL:', insforgeUrl);
console.log('DEBUG [insforge.js] VITE_INSFORGE_ANON_KEY:', insforgeAnonKey ? 'PRESENT' : 'MISSING');

const _realClient = createClient(
  insforgeUrl ? insforgeUrl.trim() : 'http://localhost:7130',
  insforgeAnonKey ? insforgeAnonKey.trim() : 'dummy'
);

// --- MOCK DATABASE FOR PROTOTYPE ---
// Backend InsForge saat ini offline, jadi kita gunakan mock database layer
// yang mengembalikan data dummy agar UI tetap bisa diuji.

const mockTables = {
  clients: [
    { id: 1, name: 'PT Telkom Indonesia', email: 'contact@telkom.co.id', phone: '+62 21 1234567', company_type: 'Telecommunications', contact_person: 'Budi Santoso', address: 'Jakarta' },
    { id: 2, name: 'PT Pertamina', email: 'info@pertamina.com', phone: '+62 21 7654321', company_type: 'Energy', contact_person: 'Siti Aminah', address: 'Jakarta' },
    { id: 3, name: 'PT Waskita Karya', email: 'info@waskita.co.id', phone: '+62 21 5551234', company_type: 'Construction', contact_person: 'Agus Prabowo', address: 'Jakarta' }
  ],
  employees: [
    { id: 1, name: 'Ahmad Mulyadi', email: 'ahmad@pagawe.com', position: 'Software Engineer', department: 'IT', status: 'Active', assignment_type: 'Regular', phone: '0812345678' },
    { id: 2, name: 'Dina Lestari', email: 'dina@pagawe.com', position: 'HR Staff', department: 'HR', status: 'Active', assignment_type: 'Regular', phone: '0812987654' },
    { id: 3, name: 'Rizky Pratama', email: 'rizky@pagawe.com', position: 'Network Engineer', department: 'IT', status: 'Active', assignment_type: 'Outsourcing', phone: '0813456789' },
    { id: 4, name: 'Sari Wulandari', email: 'sari@pagawe.com', position: 'Project Manager', department: 'Operations', status: 'Active', assignment_type: 'Regular', phone: '0814567890' },
    { id: 5, name: 'Budi Setiawan', email: 'budi@pagawe.com', position: 'Technician', department: 'Field', status: 'Active', assignment_type: 'Project-based', phone: '0815678901' }
  ],
  projects: [
    { id: 1, project_name: 'Project Alpha - UI', client_id: 1, location: 'Jakarta', status: 'Active', start_date: '2025-01-15', end_date: '2025-12-31', budget: 500000000, description: 'UI Development for Telkom portal' },
    { id: 2, project_name: 'Beta Migration', client_id: 2, location: 'Kalimantan', status: 'Active', start_date: '2025-03-01', end_date: null, budget: 750000000, description: 'Data center migration project' },
    { id: 3, project_name: 'Gamma Setup', client_id: 1, location: 'Surabaya', status: 'Pending', start_date: '2025-07-10', end_date: null, budget: null, description: 'New infrastructure setup' }
  ],
  project_assignments: [
    { id: 1, employee_id: 1, project_id: 1 },
    { id: 2, employee_id: 4, project_id: 1 },
    { id: 3, employee_id: 3, project_id: 2 },
    { id: 4, employee_id: 5, project_id: 2 }
  ],
  contracts: [
    { id: 1, employee_id: 1, contract_type: 'PKWT', contract_status: 'Active', start_date: '2025-01-15', end_date: '2025-12-31', document_url: null },
    { id: 2, employee_id: 2, contract_type: 'PKWTT', contract_status: 'Active', start_date: '2024-06-01', end_date: null, document_url: null },
    { id: 3, employee_id: 3, contract_type: 'Outsourcing', contract_status: 'Active', start_date: '2025-03-01', end_date: '2025-07-15', document_url: null },
    { id: 4, employee_id: 5, contract_type: 'Magang', contract_status: 'Pending', start_date: '2025-08-01', end_date: '2025-11-30', document_url: null }
  ],
  employee_documents: [
    { id: 1, employee_id: 1, document_name: 'KTP_Ahmad.pdf', document_type: 'Identity', document_url: 'mock://docs/KTP_Ahmad.pdf', uploaded_at: '2025-01-05T10:00:00Z' },
    { id: 2, employee_id: 1, document_name: 'Ijazah_S1.pdf', document_type: 'Education', document_url: 'mock://docs/Ijazah_S1.pdf', uploaded_at: '2025-01-05T10:05:00Z' },
    { id: 3, employee_id: 2, document_name: 'Sertifikat_HR.pdf', document_type: 'Certification', document_url: 'mock://docs/Sertifikat_HR.pdf', uploaded_at: '2025-01-10T09:30:00Z' }
  ],
  audit_logs: [],
  departments: [
    { id: 1, name: 'Engineering', description: 'Software & Hardware Engineering', created_at: '2025-01-01T00:00:00Z' },
    { id: 2, name: 'HSE', description: 'Health, Safety and Environment', created_at: '2025-01-01T00:00:00Z' },
    { id: 3, name: 'Operations', description: 'General Operations', created_at: '2025-01-01T00:00:00Z' },
    { id: 4, name: 'Finance', description: 'Finance and Accounting', created_at: '2025-01-01T00:00:00Z' },
    { id: 5, name: 'Human Resources', description: 'HR Management', created_at: '2025-01-01T00:00:00Z' }
  ]
};

// Simple chainable mock query builder
function createMockQueryBuilder(table) {
  let filters = {};
  
    let isSingle = false;
    
    const builder = {
      select: () => builder,
      insert: (payload) => {
        console.warn(`[Mock DB] Insert into ${table}:`, payload);
        return builder;
      },
      update: (payload) => {
        console.warn(`[Mock DB] Update ${table}:`, payload);
        return builder;
      },
      delete: () => {
        console.warn(`[Mock DB] Delete from ${table}`);
        return builder;
      },
      eq: (col, val) => {
        filters[col] = val;
        return builder;
      },
      order: () => builder,
      limit: () => builder,
      single: () => {
        isSingle = true;
        return builder;
      },
      maybeSingle: () => {
        isSingle = true;
        return builder;
      },
      then: (resolve, reject) => {
        // This makes it thenable/awaitable
        let data = mockTables[table] ? [...mockTables[table]] : [];
        
        // Apply eq filters
        Object.entries(filters).forEach(([col, val]) => {
          data = data.filter(row => String(row[col]) === String(val));
        });
        
        if (isSingle) {
          data = data.length > 0 ? data[0] : null;
        }
        
        const result = { data, error: null, count: Array.isArray(data) ? data.length : 1 };
        return Promise.resolve(result).then(resolve, reject);
      }
    };
  return builder;
}

// Compatibility layer: @insforge/sdk used `client.database.from()`,
// but @supabase/supabase-js uses `client.from()` directly.
// Adding a `database` property so all existing code works without changes.

const originalFrom = _realClient.from.bind(_realClient);

_realClient.from = (table) => {
  try {
    const mockUserStr = localStorage.getItem('mock_user');
    if (mockUserStr) {
      const mockUser = JSON.parse(mockUserStr);
      if (mockUser.isMock) {
        return createMockQueryBuilder(table);
      }
    }
  } catch (e) {
    // ignore
  }
  return originalFrom(table);
};

_realClient.database = _realClient;

// Export a combined client: real auth + real database mapping
export const insforge = _realClient;
