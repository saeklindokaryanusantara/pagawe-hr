-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Enums
CREATE TYPE employee_status AS ENUM ('Active', 'Inactive', 'On Leave');
CREATE TYPE assignment_type AS ENUM ('Regular', 'Outsourcing', 'Project-based', 'Magang');
CREATE TYPE project_status AS ENUM ('Pending', 'Active', 'Completed', 'On Hold');
CREATE TYPE contract_type AS ENUM ('PKWT', 'PKWTT', 'Magang', 'Outsourcing');
CREATE TYPE contract_status AS ENUM ('Pending', 'Active', 'Expired', 'Terminated');
CREATE TYPE user_role AS ENUM ('System Admin', 'HR Admin');

-- 2. Create Tables

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'HR Admin',
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    position TEXT NOT NULL,
    department TEXT NOT NULL,
    hire_date DATE,
    salary NUMERIC,
    status employee_status NOT NULL DEFAULT 'Active',
    assignment_type assignment_type,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    company_type TEXT,
    contact_person TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_name TEXT NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    location TEXT,
    status project_status NOT NULL DEFAULT 'Pending',
    start_date DATE,
    end_date DATE,
    budget NUMERIC,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Assignments table (Many-to-Many between employees and projects)
CREATE TABLE project_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, project_id)
);

-- Contracts table
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    contract_type contract_type NOT NULL,
    contract_status contract_status NOT NULL DEFAULT 'Pending',
    start_date DATE NOT NULL,
    end_date DATE,
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes on foreign key columns (prevent full table scans on JOINs and CASCADE)
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_project_assignments_employee_id ON project_assignments(employee_id);
CREATE INDEX idx_project_assignments_project_id ON project_assignments(project_id);
CREATE INDEX idx_contracts_employee_id ON contracts(employee_id);

-- 3. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- 4. Basic RLS Policies
-- Restrict access to users who have a valid profile

-- Profiles: Users can read all profiles, but only insert/update/delete their own
CREATE POLICY "Allow authenticated users to read profiles" ON profiles FOR SELECT TO authenticated USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Allow authenticated users to insert profiles" ON profiles FOR INSERT TO authenticated WITH CHECK (id = (select auth.uid()));
CREATE POLICY "Allow authenticated users to update profiles" ON profiles FOR UPDATE TO authenticated USING (id = (select auth.uid()));
CREATE POLICY "Allow authenticated users to delete profiles" ON profiles FOR DELETE TO authenticated USING (id = (select auth.uid()));

-- Business tables: Restrict to valid internal users (must exist in profiles)
CREATE POLICY "Allow authenticated users to read employees" ON employees FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to insert employees" ON employees FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to update employees" ON employees FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to delete employees" ON employees FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));

CREATE POLICY "Allow authenticated users to read clients" ON clients FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to insert clients" ON clients FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to update clients" ON clients FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to delete clients" ON clients FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));

CREATE POLICY "Allow authenticated users to read projects" ON projects FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to insert projects" ON projects FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to update projects" ON projects FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to delete projects" ON projects FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));

CREATE POLICY "Allow authenticated users to read project_assignments" ON project_assignments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to insert project_assignments" ON project_assignments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to update project_assignments" ON project_assignments FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to delete project_assignments" ON project_assignments FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));

CREATE POLICY "Allow authenticated users to read contracts" ON contracts FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to insert contracts" ON contracts FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to update contracts" ON contracts FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to delete contracts" ON contracts FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));

-- 5. Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (new.id, split_part(new.email, '@', 1), 'HR Admin');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Lock down: only callable by trigger, not directly by any user
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
