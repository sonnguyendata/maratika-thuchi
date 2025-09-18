-- SQL script to create profile for existing admin user and set up automatic profile creation

-- 1. First, let's create a profile for your existing admin user
-- Replace 'admin@maratika.asia' with your actual email and get the user_id from Supabase Auth
INSERT INTO public.profiles (user_id, email, role, full_name, created_at)
SELECT 
  au.id as user_id,
  au.email,
  'admin' as role,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Admin User') as full_name,
  NOW() as created_at
FROM auth.users au
WHERE au.email = 'admin@maratika.asia'
AND NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = au.id
);

-- 2. Create a function to automatically create profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, role, full_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    'user', -- default role for new users
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create a trigger to automatically call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.profiles TO service_role;
