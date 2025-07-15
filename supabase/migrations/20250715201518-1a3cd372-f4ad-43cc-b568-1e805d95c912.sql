-- Create monthly usage tracking table
CREATE TABLE public.monthly_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  month_year DATE NOT NULL, -- First day of the month (e.g., 2024-01-01)
  posts_created INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, month_year)
);

-- Enable RLS
ALTER TABLE public.monthly_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for monthly usage
CREATE POLICY "Users can view their own monthly usage" 
ON public.monthly_usage 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own monthly usage" 
ON public.monthly_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monthly usage" 
ON public.monthly_usage 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Function to increment monthly usage counter
CREATE OR REPLACE FUNCTION public.increment_monthly_usage(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month DATE;
  current_count INTEGER;
BEGIN
  -- Get the first day of current month
  current_month := date_trunc('month', now())::DATE;
  
  -- Insert or update monthly usage
  INSERT INTO public.monthly_usage (user_id, month_year, posts_created)
  VALUES (user_uuid, current_month, 1)
  ON CONFLICT (user_id, month_year) 
  DO UPDATE SET 
    posts_created = monthly_usage.posts_created + 1,
    updated_at = now();
  
  -- Return the updated count
  SELECT posts_created INTO current_count
  FROM public.monthly_usage
  WHERE user_id = user_uuid AND month_year = current_month;
  
  RETURN current_count;
END;
$$;

-- Function to get current monthly usage count
CREATE OR REPLACE FUNCTION public.get_monthly_usage_count(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month DATE;
  usage_count INTEGER;
BEGIN
  -- Get the first day of current month
  current_month := date_trunc('month', now())::DATE;
  
  -- Get current month's usage count
  SELECT posts_created INTO usage_count
  FROM public.monthly_usage
  WHERE user_id = user_uuid AND month_year = current_month;
  
  -- Return 0 if no record found
  RETURN COALESCE(usage_count, 0);
END;
$$;

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_monthly_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_monthly_usage_updated_at
BEFORE UPDATE ON public.monthly_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_monthly_usage_updated_at();