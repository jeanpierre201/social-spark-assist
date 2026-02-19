
ALTER TABLE public.campaigns
ADD COLUMN visual_style text DEFAULT 'auto',
ADD COLUMN audience_type text DEFAULT 'general',
ADD COLUMN audience_refinement text;
