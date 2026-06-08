-- Migration: Add missing indexes on foreign key columns
-- Issue: JOINs cause full table scans, CASCADE locks block all writes
-- Date: 2026-06-04
--
-- Run this in the InsForge SQL Editor.

CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_project_assignments_employee_id ON project_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_project_assignments_project_id ON project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_employee_id ON contracts(employee_id);
