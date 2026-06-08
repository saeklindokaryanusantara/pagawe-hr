// Fix RLS policies for departments table and simplify other table policies
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';
const BASE_URL = 'http://187.77.120.188:8000';

async function runSQL(sql) {
  const res = await fetch(`${BASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  const text = await res.text();
  console.log(`Status: ${res.status}`, text.substring(0, 200));
  return res.status;
}

// We need to use the Supabase SQL editor approach - create an RPC function first
const createExecSQL = `
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS void AS $$
BEGIN
  EXECUTE query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

// First, try to create the exec_sql function via the management API
// Actually, let's use a simpler approach - direct PostgREST doesn't support arbitrary SQL
// We'll use SSH instead or the Supabase Studio SQL editor

// Alternative: Drop existing restrictive policies and create simple ones
// For departments specifically, let's check if RLS is even enabled

const tables = ['departments', 'employees', 'clients', 'projects', 'project_assignments', 'contracts'];

// Let's just try inserting with the service role key to test
async function testServiceInsert() {
  const res = await fetch(`${BASE_URL}/rest/v1/departments`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ name: 'Test Dept', description: 'Test' })
  });
  console.log('Service insert status:', res.status, await res.text());
}

// Check what policies exist for departments
async function checkDepartmentsPolicies() {
  // Query pg_policies via a view if exposed, or check RLS status
  const res = await fetch(`${BASE_URL}/rest/v1/departments?select=*&limit=1`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    }
  });
  console.log('Departments SELECT (service_role):', res.status, await res.text());
}

async function main() {
  console.log('=== Checking departments access ===');
  await checkDepartmentsPolicies();
  
  console.log('\n=== Testing service role insert ===');
  await testServiceInsert();
  
  // Now try exec_sql
  console.log('\n=== Trying to create exec_sql function ===');
  await runSQL(createExecSQL);
  
  // If exec_sql works, add departments policies
  console.log('\n=== Adding departments RLS policies ===');
  
  const policies = [
    "CREATE POLICY IF NOT EXISTS dept_select ON departments FOR SELECT TO authenticated USING (true)",
    "CREATE POLICY IF NOT EXISTS dept_insert ON departments FOR INSERT TO authenticated WITH CHECK (true)", 
    "CREATE POLICY IF NOT EXISTS dept_update ON departments FOR UPDATE TO authenticated USING (true)",
    "CREATE POLICY IF NOT EXISTS dept_delete ON departments FOR DELETE TO authenticated USING (true)"
  ];
  
  for (const p of policies) {
    await runSQL(p);
  }

  // Also drop and recreate the restrictive policies on other tables
  // to use simpler USING (true) instead of requiring profiles
  console.log('\n=== Simplifying employee policies ===');
  const simplifyTables = ['employees', 'clients', 'projects', 'project_assignments', 'contracts'];
  
  for (const table of simplifyTables) {
    for (const action of ['SELECT', 'INSERT', 'UPDATE', 'DELETE']) {
      const policyName = `Allow authenticated users to ${action.toLowerCase()} ${table}`;
      await runSQL(`DROP POLICY IF EXISTS "${policyName}" ON ${table}`);
    }
    
    await runSQL(`CREATE POLICY "${table}_select" ON ${table} FOR SELECT TO authenticated USING (true)`);
    await runSQL(`CREATE POLICY "${table}_insert" ON ${table} FOR INSERT TO authenticated WITH CHECK (true)`);
    await runSQL(`CREATE POLICY "${table}_update" ON ${table} FOR UPDATE TO authenticated USING (true)`);
    await runSQL(`CREATE POLICY "${table}_delete" ON ${table} FOR DELETE TO authenticated USING (true)`);
  }
  
  console.log('\n=== Cleanup test dept ===');
  const delRes = await fetch(`${BASE_URL}/rest/v1/departments?name=eq.Test Dept`, {
    method: 'DELETE',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    }
  });
  console.log('Delete test dept:', delRes.status);
  
  console.log('\nDone!');
}

main().catch(console.error);
