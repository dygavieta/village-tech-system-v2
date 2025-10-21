-- Migration: Create function to get user email from auth schema
-- Description: Helper function to retrieve email from auth.users

CREATE OR REPLACE FUNCTION get_user_email(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;

  RETURN user_email;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_email(UUID) TO authenticated;

-- Comment
COMMENT ON FUNCTION get_user_email IS 'Retrieves email address for a given user ID from auth.users table';
