
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CampaignInvitationRequest {
  email: string;
  campaignName: string;
  inviterName: string;
  role: string;
  invitationId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { 
      email, 
      campaignName, 
      inviterName, 
      role,
      invitationId 
    }: CampaignInvitationRequest = await req.json();

    // For now, we'll just log the invitation details
    // In a real implementation, you would integrate with an email service
    console.log('Campaign invitation request:', {
      email,
      campaignName,
      inviterName,
      role,
      invitationId
    });

    // Send a simple email using fetch to a webhook or email service
    // This is a placeholder - you'll need to integrate with your preferred email service
    const emailData = {
      to: email,
      subject: `You're invited to join "${campaignName}" campaign`,
      html: `
        <h1>Campaign Invitation</h1>
        <p>Hi there!</p>
        <p><strong>${inviterName}</strong> has invited you to collaborate on the campaign "<strong>${campaignName}</strong>" as a <strong>${role}</strong>.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>What you can do as a ${role}:</h3>
          ${role === 'editor' ? `
            <ul>
              <li>Create and edit content</li>
              <li>Schedule posts</li>
              <li>Collaborate with team members</li>
              <li>Access campaign analytics</li>
            </ul>
          ` : `
            <ul>
              <li>View campaign content</li>
              <li>Add comments and feedback</li>
              <li>Access campaign analytics</li>
            </ul>
          `}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'vercel.app') || 'https://your-app.com'}/dashboard" 
             style="background-color: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        
        <p>If you don't have an account yet, you'll be able to sign up using the same email address.</p>
        
        <p>This invitation will expire in 7 days.</p>
        
        <p>Best regards,<br>The Team</p>
        
        <hr>
        <p><small>If you didn't expect this invitation, you can safely ignore this email.</small></p>
      `,
    };

    console.log("Campaign invitation email prepared:", emailData);

    return new Response(JSON.stringify({ 
      success: true,
      message: "Campaign invitation processed successfully",
      emailData: emailData
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-campaign-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
