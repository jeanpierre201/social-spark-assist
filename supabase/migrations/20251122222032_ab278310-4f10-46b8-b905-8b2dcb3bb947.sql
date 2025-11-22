-- Enable RLS on subscribers table if not already enabled
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own subscription data
CREATE POLICY "Users can read own subscription"
ON subscribers
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  email = auth.email()
);