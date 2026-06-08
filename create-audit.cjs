// Create audit_logs table via SSH psql command
const { execSync } = require('child_process');

const sql = `
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS audit_logs_select ON audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS audit_logs_insert ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);
`;

try {
  // Write SQL to a temp approach - use echo piped to ssh
  const result = execSync(
    `echo ${JSON.stringify(sql)} | ssh -o ConnectTimeout=10 root@187.77.120.188 "docker exec -i supabase-db psql -U postgres -d postgres"`,
    { timeout: 30000, encoding: 'utf8', shell: 'cmd.exe' }
  );
  console.log('Result:', result);
} catch (err) {
  console.error('SSH approach failed:', err.message);
  
  // Fallback: Try creating a function via PostgREST that creates the table
  console.log('Trying alternative approach...');
}
