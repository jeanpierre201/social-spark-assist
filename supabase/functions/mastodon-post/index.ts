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

    const { message, postId, mediaUrl } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    console.log(`Posting to Mastodon for user ${user.id}:`, message.substring(0, 50) + '...');

    // Build form data for the status
    const formData = new FormData();
    formData.append('status', message);

    // If there's a media URL, upload it first
    let mediaId = null;
    if (mediaUrl) {
      console.log('Uploading media to Mastodon:', mediaUrl);
      
      // Fetch the image
      const imageResponse = await fetch(mediaUrl);
      const imageBlob = await imageResponse.blob();
      
      const mediaFormData = new FormData();
      mediaFormData.append('file', imageBlob, 'image.jpg');
      
      const mediaResponse = await fetch(`${MASTODON_INSTANCE_URL}/api/v2/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MASTODON_ACCESS_TOKEN}`,
        },
        body: mediaFormData,
      });

      if (!mediaResponse.ok) {
        const errorText = await mediaResponse.text();
        console.error('Failed to upload media:', errorText);
      } else {
        const mediaData = await mediaResponse.json();
        mediaId = mediaData.id;
        console.log('Media uploaded successfully, ID:', mediaId);
      }
    }

    // Add media ID if we have one
    if (mediaId) {
      formData.append('media_ids[]', mediaId);
    }

    // Post the status
    const response = await fetch(`${MASTODON_INSTANCE_URL}/api/v1/statuses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MASTODON_ACCESS_TOKEN}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mastodon API error:', errorText);
      throw new Error(`Failed to post to Mastodon: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('Posted successfully to Mastodon, status ID:', result.id);

    // Update post status if postId provided
    if (postId) {
      const { error: updateError } = await supabase
        .from('posts')
        .update({
          status: 'published',
          posted_at: new Date().toISOString(),
          error_message: null,
        })
        .eq('id', postId);

      if (updateError) {
        console.error('Failed to update post status:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        statusId: result.id,
        url: result.url,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error posting to Mastodon:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
