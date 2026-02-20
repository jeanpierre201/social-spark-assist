ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS color_primary text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS color_secondary text DEFAULT NULL;