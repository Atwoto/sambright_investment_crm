-- migrations/002_create_update_user_role_function.sql

CREATE OR REPLACE FUNCTION update_user_role(user_id_to_update uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the currently authenticated user is a super_admin
  IF (
    SELECT role
    FROM public.profiles
    WHERE id = auth.uid()
  ) != 'super_admin' THEN
    RAISE EXCEPTION 'Only super_admins can change user roles.';
  END IF;

  -- Update the user's role in the profiles table
  UPDATE public.profiles
  SET role = new_role
  WHERE id = user_id_to_update;
END;
$$;

-- Grant execute permission on the function to the authenticated role
GRANT EXECUTE ON FUNCTION public.update_user_role(uuid, text) TO authenticated;

COMMENT ON FUNCTION public.update_user_role(uuid, text) IS 'Allows a super_admin to update the role of any user.';
