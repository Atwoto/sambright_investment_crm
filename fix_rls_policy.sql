-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.user_profiles;

-- Create new policy: Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Create new policy: Super admins can read all profiles
CREATE POLICY "Super admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
