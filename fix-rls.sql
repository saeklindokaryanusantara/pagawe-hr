-- Fix RLS policies for departments table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'departments') THEN
    EXECUTE 'DROP POLICY IF EXISTS "dept_select" ON departments';
    EXECUTE 'CREATE POLICY "dept_select" ON departments FOR SELECT TO authenticated USING (true)';
    
    EXECUTE 'DROP POLICY IF EXISTS "dept_insert" ON departments';
    EXECUTE 'CREATE POLICY "dept_insert" ON departments FOR INSERT TO authenticated WITH CHECK (true)';
    
    EXECUTE 'DROP POLICY IF EXISTS "dept_update" ON departments';
    EXECUTE 'CREATE POLICY "dept_update" ON departments FOR UPDATE TO authenticated USING (true)';
    
    EXECUTE 'DROP POLICY IF EXISTS "dept_delete" ON departments';
    EXECUTE 'CREATE POLICY "dept_delete" ON departments FOR DELETE TO authenticated USING (true)';
  END IF;
END $$;

-- Drop existing restrictive policies on business tables and replace with simpler ones
-- Employees
DROP POLICY IF EXISTS "Allow authenticated users to read employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to insert employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to update employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to delete employees" ON employees;
CREATE POLICY "employees_select" ON employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "employees_insert" ON employees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "employees_update" ON employees FOR UPDATE TO authenticated USING (true);
CREATE POLICY "employees_delete" ON employees FOR DELETE TO authenticated USING (true);

-- Clients
DROP POLICY IF EXISTS "Allow authenticated users to read clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to insert clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to update clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to delete clients" ON clients;
CREATE POLICY "clients_select" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "clients_insert" ON clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "clients_update" ON clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "clients_delete" ON clients FOR DELETE TO authenticated USING (true);

-- Projects
DROP POLICY IF EXISTS "Allow authenticated users to read projects" ON projects;
DROP POLICY IF EXISTS "Allow authenticated users to insert projects" ON projects;
DROP POLICY IF EXISTS "Allow authenticated users to update projects" ON projects;
DROP POLICY IF EXISTS "Allow authenticated users to delete projects" ON projects;
CREATE POLICY "projects_select" ON projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "projects_insert" ON projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "projects_update" ON projects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "projects_delete" ON projects FOR DELETE TO authenticated USING (true);

-- Project Assignments
DROP POLICY IF EXISTS "Allow authenticated users to read project_assignments" ON project_assignments;
DROP POLICY IF EXISTS "Allow authenticated users to insert project_assignments" ON project_assignments;
DROP POLICY IF EXISTS "Allow authenticated users to update project_assignments" ON project_assignments;
DROP POLICY IF EXISTS "Allow authenticated users to delete project_assignments" ON project_assignments;
CREATE POLICY "project_assignments_select" ON project_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "project_assignments_insert" ON project_assignments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "project_assignments_update" ON project_assignments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "project_assignments_delete" ON project_assignments FOR DELETE TO authenticated USING (true);

-- Contracts
DROP POLICY IF EXISTS "Allow authenticated users to read contracts" ON contracts;
DROP POLICY IF EXISTS "Allow authenticated users to insert contracts" ON contracts;
DROP POLICY IF EXISTS "Allow authenticated users to update contracts" ON contracts;
DROP POLICY IF EXISTS "Allow authenticated users to delete contracts" ON contracts;
CREATE POLICY "contracts_select" ON contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "contracts_insert" ON contracts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "contracts_update" ON contracts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "contracts_delete" ON contracts FOR DELETE TO authenticated USING (true);

-- Employee Documents (if table exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employee_documents') THEN
    EXECUTE 'DROP POLICY IF EXISTS "employee_documents_select" ON employee_documents';
    EXECUTE 'CREATE POLICY "employee_documents_select" ON employee_documents FOR SELECT TO authenticated USING (true)';
    
    EXECUTE 'DROP POLICY IF EXISTS "employee_documents_insert" ON employee_documents';
    EXECUTE 'CREATE POLICY "employee_documents_insert" ON employee_documents FOR INSERT TO authenticated WITH CHECK (true)';
    
    EXECUTE 'DROP POLICY IF EXISTS "employee_documents_update" ON employee_documents';
    EXECUTE 'CREATE POLICY "employee_documents_update" ON employee_documents FOR UPDATE TO authenticated USING (true)';
    
    EXECUTE 'DROP POLICY IF EXISTS "employee_documents_delete" ON employee_documents';
    EXECUTE 'CREATE POLICY "employee_documents_delete" ON employee_documents FOR DELETE TO authenticated USING (true)';
  END IF;
END $$;
