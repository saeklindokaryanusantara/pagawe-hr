-- Pagawe HR Management System: Phase 3 Enhancements
-- This migration script creates the departments table and updates user_role ENUM.

-- 1. Add 'HR Manager' to user_role ENUM
-- PostgreSQL doesn't support ADD VALUE IF NOT EXISTS easily in a transactional block,
-- so we wrap it in a DO block.
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'user_role' AND e.enumlabel = 'HR Manager'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'HR Manager';
  END IF;
END $$;

-- 2. Create Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies for Departments
CREATE POLICY "Allow authenticated users to read departments" ON departments 
    FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
    
CREATE POLICY "Allow authenticated users to insert departments" ON departments 
    FOR INSERT TO authenticated 
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
    
CREATE POLICY "Allow authenticated users to update departments" ON departments 
    FOR UPDATE TO authenticated 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
    
CREATE POLICY "Allow authenticated users to delete departments" ON departments 
    FOR DELETE TO authenticated 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));

-- 3. Insert Default Departments
INSERT INTO departments (name, description) VALUES
('Engineering', 'Software & Hardware Engineering'),
('HSE', 'Health, Safety and Environment'),
('Operations', 'General Operations'),
('Finance', 'Finance and Accounting'),
('Human Resources', 'HR Management')
ON CONFLICT (name) DO NOTHING;

-- 4. Audit Log Trigger for Departments
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_departments_changes') THEN
        CREATE TRIGGER audit_departments_changes
        AFTER INSERT OR UPDATE OR DELETE ON departments
        FOR EACH ROW EXECUTE PROCEDURE public.log_audit_event();
    END IF;
END $$;
