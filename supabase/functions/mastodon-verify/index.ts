import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MASTODON_INSTANCE_URL = Deno.env.get('MASTODON_INSTANCE_URL');
    const MASTODON_ACCESS_TOKEN = Deno.env.get('MASTODON_ACCESS_TOKEN');

    if (!MASTODON_INSTANCE_URL || !MASTODON_ACCESS_TOKEN) {
      throw new Error('Missing Mastodon configuration');
    }

    // Verify user authentication
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log(`Verifying Mastodon credentials for user ${user.id}`);

    // Verify the access token by fetching account info
    const response = await fetch(`${MASTODON_INSTANCE_URL}/api/v1/accounts/verify_credentials`, {
      headers: {
        'Authorization': `Bearer ${MASTODON_ACCESS_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mastodon verification failed:', errorText);
      throw new Error('Invalid Mastodon credentials');
    }

    const account = await response.json();
    console.log('Mastodon account verified:', account.username);

    // Check if account already exists for this user
    const { data: existingAccount } = await supabase
      .from('social_accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('platform', 'mastodon')
      .single();

    if (existingAccount) {
      // Update existing account
      const { error: updateError } = await supabase
        .from('social_accounts')
        .update({
          username: account.username,
          platform_user_id: account.id,
          account_data: {
            display_name: account.display_name,
            avatar: account.avatar,
            instance: MASTODON_INSTANCE_URL,
            followers_count: account.followers_count,
            following_count: account.following_count,
          },
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAccount.id);

      if (updateError) {
        console.error('Failed to update account:', updateError);
        throw new Error('Failed to update account');
      }
    } else {
      // Create new account
      const { error: insertError } = await supabase
        .from('social_accounts')
        .insert({
          user_id: user.id,
          platform: 'mastodon',
          platform_user_id: account.id,
          username: account.username,
          account_data: {
            display_name: account.display_name,
            avatar: account.avatar,
            instance: MASTODON_INSTANCE_URL,
            followers_count: account.followers_count,
            following_count: account.following_count,
          },
          is_active: true,
        });

      if (insertError) {
        console.error('Failed to create account:', insertError);
        throw new Error('Failed to save account');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        account: {
          id: account.id,
          username: account.username,
          display_name: account.display_name,
          avatar: account.avatar,
          instance: MASTODON_INSTANCE_URL,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error verifying Mastodon:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
