import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? `: ${JSON.stringify(details)}` : '';
  console.log(`[REDEEM-PROMO] ${step}${detailsStr}`);
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Processing promo code redemption request');

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logStep('Error: No authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      logStep('Error: Invalid user token', { error: userError?.message });
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('User authenticated', { userId: user.id, email: user.email });

    // Parse request body
    const { promoCode } = await req.json();

    if (!promoCode || typeof promoCode !== 'string') {
      logStep('Error: Invalid promo code format');
      return new Response(
        JSON.stringify({ success: false, error: 'Promo code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedCode = promoCode.toUpperCase().trim();
    logStep('Attempting to redeem code', { code: normalizedCode });

    // Call the database function to redeem the promo code
    const { data, error } = await supabase.rpc('redeem_promo_code', {
      promo_code_input: normalizedCode,
      user_uuid: user.id,
      user_email_input: user.email
    });

    if (error) {
      logStep('Database error during redemption', { error: error.message });
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to redeem promo code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('Redemption result', data);

    if (!data.success) {
      return new Response(
        JSON.stringify({ success: false, error: data.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully redeemed! You now have ${data.tier} subscription until ${new Date(data.subscription_end).toLocaleDateString()}.`,
        tier: data.tier,
        subscriptionEnd: data.subscription_end
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logStep('Unexpected error', { error: error.message });
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
