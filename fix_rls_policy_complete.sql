-- Drop ALL existing policies on profiles table
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Only super admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only super admins can delete profiles" ON public.profiles;

-- SELECT: Users can read their own profile, super admins can read all
CREATE POLICY "Enable read access for own profile" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id 
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- INSERT: Allow the trigger to insert (service role) and super admins
CREATE POLICY "Enable insert for authenticated users via trigger" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- UPDATE: Users can update their own profile
CREATE POLICY "Enable update for own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- DELETE: Only super admins can delete
CREATE POLICY "Enable delete for super admins only" ON public.profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
