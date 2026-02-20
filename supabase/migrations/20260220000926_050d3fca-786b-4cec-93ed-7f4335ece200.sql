ALTER TABLE public.campaigns
ADD COLUMN platforms jsonb DEFAULT '[]'::jsonb,
ADD COLUMN style_lock boolean DEFAULT true;