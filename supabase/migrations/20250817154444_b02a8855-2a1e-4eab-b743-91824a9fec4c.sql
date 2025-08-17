-- Add encryption for social media tokens at rest
-- Create a secure vault table for encrypted tokens

-- First, create a secure tokens vault table
CREATE TABLE IF NOT EXISTS public.social_tokens_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social_account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  encrypted_access_token TEXT,
  encrypted_refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  encryption_key_id TEXT NOT NULL DEFAULT 'default',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on the vault table
ALTER TABLE public.social_tokens_vault ENABLE ROW LEVEL SECURITY;

-- Create strict RLS policies for the vault
CREATE POLICY "No direct access to vault" 
ON public.social_tokens_vault 
FOR ALL 
USING (false);

-- Create index for performance
CREATE INDEX idx_social_tokens_vault_account_id ON public.social_tokens_vault(social_account_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_social_tokens_vault_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_social_tokens_vault_updated_at
  BEFORE UPDATE ON public.social_tokens_vault
  FOR EACH ROW
  EXECUTE FUNCTION update_social_tokens_vault_updated_at();