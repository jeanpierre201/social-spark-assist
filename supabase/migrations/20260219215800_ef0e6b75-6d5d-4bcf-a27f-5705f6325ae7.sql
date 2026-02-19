ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS visual_style text DEFAULT 'clean-minimal',
  ADD COLUMN IF NOT EXISTS logo_placement text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS watermark_enabled boolean DEFAULT false;