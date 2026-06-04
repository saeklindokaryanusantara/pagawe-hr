-- Insert mock employees
INSERT INTO employees (name, email, phone, position, department, hire_date, salary, status, assignment_type)
VALUES
('Budi Santoso', 'budi@example.com', '08123456789', 'Senior Welder', 'Engineering', '2023-01-15', 8000000, 'Active', 'Project-based'),
('Siti Aminah', 'siti@example.com', '08198765432', 'Safety Officer', 'HSE', '2022-06-10', 9500000, 'Active', 'Regular'),
('Agus Pratama', 'agus@example.com', '08211223344', 'Heavy Equipment Operator', 'Operations', '2024-03-01', 7500000, 'On Leave', 'Outsourcing'),
('Dewi Lestari', 'dewi@example.com', '08155667788', 'Admin Support', 'Administration', '2025-01-20', 5000000, 'Inactive', 'Magang'),
('Rizki Rahman', 'rizki@example.com', '08569988776', 'Electrician', 'Engineering', '2023-09-05', 6000000, 'Active', 'Project-based')
ON CONFLICT (email) DO NOTHING;

-- Temporarily allow anon to select employees for development purposes
CREATE POLICY "Allow anon to read employees for dev" ON employees FOR SELECT TO anon USING (true);
