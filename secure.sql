-- Remove the temporary anon policy
DROP POLICY IF EXISTS "Allow anon to read employees for dev" ON employees;
