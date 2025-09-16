/*
  # Fix user signup trigger

  1. Database Functions
    - Create `handle_new_user()` function to automatically create profiles for new users
    
  2. Triggers
    - Add trigger to execute `handle_new_user()` after user registration
    
  3. Security
    - Function runs with SECURITY DEFINER to ensure proper permissions
    
  This migration fixes the "Database error saving new user" issue by ensuring
  a profile is automatically created whenever a new user signs up.
*/

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();