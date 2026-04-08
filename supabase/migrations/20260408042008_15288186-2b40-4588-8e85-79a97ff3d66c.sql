-- Primary admin config table
CREATE TABLE public.primary_admin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.primary_admin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view primary admin" ON public.primary_admin
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.primary_admin (email) VALUES ('bshima577@gmail.com');

-- Prevent deleting primary admin email from admin_emails
CREATE OR REPLACE FUNCTION public.prevent_primary_admin_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.primary_admin WHERE email = OLD.email) THEN
    RAISE EXCEPTION 'Cannot delete primary admin email';
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER check_primary_admin_delete
  BEFORE DELETE ON public.admin_emails
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_primary_admin_delete();

-- Prevent deleting primary admin role
CREATE OR REPLACE FUNCTION public.prevent_primary_admin_role_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role = 'admin' AND EXISTS (
    SELECT 1 FROM public.primary_admin pa
    JOIN public.profiles p ON p.email = pa.email
    WHERE p.user_id = OLD.user_id
  ) THEN
    RAISE EXCEPTION 'Cannot remove admin role from primary admin';
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER check_primary_admin_role_delete
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_primary_admin_role_delete();

-- Function to transfer primary admin
CREATE OR REPLACE FUNCTION public.transfer_primary_admin(new_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.primary_admin pa
    JOIN public.profiles p ON p.email = pa.email
    WHERE p.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the primary admin can transfer this role';
  END IF;
  UPDATE public.primary_admin SET email = new_email;
  INSERT INTO public.admin_emails (email) VALUES (new_email) ON CONFLICT DO NOTHING;
END;
$$;

INSERT INTO public.admin_emails (email) VALUES ('bshima577@gmail.com') ON CONFLICT DO NOTHING;