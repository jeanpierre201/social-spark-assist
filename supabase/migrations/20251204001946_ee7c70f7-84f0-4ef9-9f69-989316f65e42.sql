-- Remove duplicate tokens, keeping only the most recent one per social account
DELETE FROM social_tokens_vault 
WHERE id NOT IN (
  SELECT DISTINCT ON (social_account_id) id 
  FROM social_tokens_vault 
  ORDER BY social_account_id, updated_at DESC
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE social_tokens_vault 
ADD CONSTRAINT social_tokens_vault_social_account_id_unique UNIQUE (social_account_id);