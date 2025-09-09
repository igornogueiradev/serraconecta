-- Remove the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a security definer function to check if a user has active drivers or trips
CREATE OR REPLACE FUNCTION public.user_has_active_content(target_user_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.drivers 
    WHERE user_id = target_user_id AND status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM public.trips 
    WHERE user_id = target_user_id AND status = 'active'
  );
$$;

-- Create more restrictive policies for profile visibility
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view profiles of users with active content"
ON public.profiles
FOR SELECT
USING (public.user_has_active_content(user_id));

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.user_has_active_content(uuid) TO authenticated;