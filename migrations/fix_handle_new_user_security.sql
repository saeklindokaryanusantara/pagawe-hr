-- Migration: Fix critical security issue on public.handle_new_user()
-- Issue: SECURITY DEFINER function callable by public role (privilege escalation risk)
-- Date: 2026-06-04
--
-- Solusi: Tetap SECURITY DEFINER (dibutuhkan agar trigger bisa INSERT ke profiles),
-- tapi dikunci ketat dengan REVOKE dan search_path lockdown.

-- Step 1: Recreate function - tetap SECURITY DEFINER tapi dengan search_path terkunci
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (new.id, split_part(new.email, '@', 1), 'HR Admin');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Step 2: Cabut akses eksekusi langsung dari semua role publik
-- Fungsi ini HANYA bisa dipanggil oleh trigger internal, bukan oleh user secara langsung
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
