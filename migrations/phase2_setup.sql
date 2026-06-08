-- Pagawe HR Management System: Phase 2 Enhancements
-- This migration script creates the audit_logs table, employee_documents table,
-- and the trigger function for the audit trail.

-- 1. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action_type TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster querying of audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by ON audit_logs(changed_by);

-- 2. Audit Trigger Function
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS trigger AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Try to get the current user ID from Supabase/InsForge auth context
    BEGIN
        user_id := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        user_id := NULL;
    END;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, record_id, action_type, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW)::jsonb, user_id);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, record_id, action_type, old_data, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, user_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, record_id, action_type, old_data, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD)::jsonb, user_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Attach trigger to business tables
DO $$ 
BEGIN
    -- Employees
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_employees_changes') THEN
        CREATE TRIGGER audit_employees_changes
        AFTER INSERT OR UPDATE OR DELETE ON employees
        FOR EACH ROW EXECUTE PROCEDURE log_audit_event();
    END IF;
    
    -- Projects
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_projects_changes') THEN
        CREATE TRIGGER audit_projects_changes
        AFTER INSERT OR UPDATE OR DELETE ON projects
        FOR EACH ROW EXECUTE PROCEDURE log_audit_event();
    END IF;

    -- Clients
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_clients_changes') THEN
        CREATE TRIGGER audit_clients_changes
        AFTER INSERT OR UPDATE OR DELETE ON clients
        FOR EACH ROW EXECUTE PROCEDURE log_audit_event();
    END IF;

    -- Contracts
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_contracts_changes') THEN
        CREATE TRIGGER audit_contracts_changes
        AFTER INSERT OR UPDATE OR DELETE ON contracts
        FOR EACH ROW EXECUTE PROCEDURE log_audit_event();
    END IF;
END $$;

-- 3. Create Employee Documents Table
CREATE TABLE IF NOT EXISTS employee_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    document_type TEXT NOT NULL, -- e.g., 'KTP', 'Ijazah', 'Sertifikat'
    document_url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id ON employee_documents(employee_id);

-- Enable RLS on new tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for new tables

-- Audit Logs (Only viewable by authenticated users who have a profile, perhaps restrict to Admin later)
CREATE POLICY "Allow authenticated users to read audit_logs" ON audit_logs 
    FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
    
-- (No INSERT/UPDATE/DELETE policies for audit_logs via API - it should only be populated by the trigger)

-- Employee Documents
CREATE POLICY "Allow authenticated users to read employee_documents" ON employee_documents 
    FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to insert employee_documents" ON employee_documents 
    FOR INSERT TO authenticated 
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to delete employee_documents" ON employee_documents 
    FOR DELETE TO authenticated 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
