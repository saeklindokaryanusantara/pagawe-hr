-- Migration: Fix overly permissive RLS policies on ALL tables
-- Issue: Policies use USING (true) / WITH CHECK (true) granting unrestricted access
-- Date: 2026-06-04
--
-- Run this in the InsForge SQL Editor.

-- ============================================
-- PROFILES
-- ============================================
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to delete profiles" ON profiles;

CREATE POLICY "Allow authenticated users to read profiles" ON profiles FOR SELECT TO authenticated USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Allow authenticated users to insert profiles" ON profiles FOR INSERT TO authenticated WITH CHECK (id = (select auth.uid()));
CREATE POLICY "Allow authenticated users to update profiles" ON profiles FOR UPDATE TO authenticated USING (id = (select auth.uid()));
CREATE POLICY "Allow authenticated users to delete profiles" ON profiles FOR DELETE TO authenticated USING (id = (select auth.uid()));

-- ============================================
-- EMPLOYEES
-- ============================================
DROP POLICY IF EXISTS "Allow authenticated users to read employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to insert employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to update employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to delete employees" ON employees;

CREATE POLICY "Allow authenticated users to read employees" ON employees FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to insert employees" ON employees FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to update employees" ON employees FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to delete employees" ON employees FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));

-- ============================================
-- CLIENTS
-- ============================================
DROP POLICY IF EXISTS "Allow authenticated users to read clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to insert clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to update clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to delete clients" ON clients;

CREATE POLICY "Allow authenticated users to read clients" ON clients FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to insert clients" ON clients FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to update clients" ON clients FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to delete clients" ON clients FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));

-- ============================================
-- PROJECTS
-- ============================================
DROP POLICY IF EXISTS "Allow authenticated users to read projects" ON projects;
DROP POLICY IF EXISTS "Allow authenticated users to insert projects" ON projects;
DROP POLICY IF EXISTS "Allow authenticated users to update projects" ON projects;
DROP POLICY IF EXISTS "Allow authenticated users to delete projects" ON projects;

CREATE POLICY "Allow authenticated users to read projects" ON projects FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to insert projects" ON projects FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to update projects" ON projects FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to delete projects" ON projects FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));

-- ============================================
-- PROJECT_ASSIGNMENTS
-- ============================================
DROP POLICY IF EXISTS "Allow authenticated users to read project_assignments" ON project_assignments;
DROP POLICY IF EXISTS "Allow authenticated users to insert project_assignments" ON project_assignments;
DROP POLICY IF EXISTS "Allow authenticated users to update project_assignments" ON project_assignments;
DROP POLICY IF EXISTS "Allow authenticated users to delete project_assignments" ON project_assignments;

CREATE POLICY "Allow authenticated users to read project_assignments" ON project_assignments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to insert project_assignments" ON project_assignments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to update project_assignments" ON project_assignments FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to delete project_assignments" ON project_assignments FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));

-- ============================================
-- CONTRACTS
-- ============================================
DROP POLICY IF EXISTS "Allow authenticated users to read contracts" ON contracts;
DROP POLICY IF EXISTS "Allow authenticated users to insert contracts" ON contracts;
DROP POLICY IF EXISTS "Allow authenticated users to update contracts" ON contracts;
DROP POLICY IF EXISTS "Allow authenticated users to delete contracts" ON contracts;

CREATE POLICY "Allow authenticated users to read contracts" ON contracts FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to insert contracts" ON contracts FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to update contracts" ON contracts FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
CREATE POLICY "Allow authenticated users to delete contracts" ON contracts FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid())));
