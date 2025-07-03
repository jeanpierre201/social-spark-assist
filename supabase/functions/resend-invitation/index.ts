
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ResendInvitationRequest {
  email: string;
  campaignName: string;
  role: string;
  invitationId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not set");
    }

    const { 
      email, 
      campaignName, 
      role,
      invitationId 
    }: ResendInvitationRequest = await req.json();

    console.log('Resending campaign invitation:', {
      email,
      campaignName,
      role,
      invitationId
    });

    // Send the email using native fetch to Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "Team Collaboration <onboarding@resend.dev>",
        to: [email],
        subject: `Reminder: You're invited to join "${campaignName}" campaign`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #8B5CF6;">Campaign Invitation Reminder</h1>
            <p>Hi there!</p>
            <p>This is a friendly reminder that you've been invited to collaborate on the campaign "<strong>${campaignName}</strong>" as a <strong>${role}</strong>.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8B5CF6;">
              <h3 style="margin-top: 0; color: #333;">What you can do as a ${role}:</h3>
              ${role === 'editor' ? `
                <ul style="color: #666;">
                  <li>Create and edit content</li>
                  <li>Schedule posts</li>
                  <li>Collaborate with team members</li>
                  <li>Access campaign analytics</li>
                </ul>
              ` : `
                <ul style="color: #666;">
                  <li>View campaign content</li>
                  <li>Add comments and feedback</li>
                  <li>Access campaign analytics</li>
                </ul>
              `}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'vercel.app') || 'https://your-app.com'}/dashboard" 
                 style="background-color: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Accept Invitation
              </a>
            </div>
            
            <p style="color: #666;">If you don't have an account yet, you'll be able to sign up using the same email address.</p>
            
            <p style="color: #666; font-size: 14px;">This invitation will expire in 7 days from the original send date.</p>
            
            <p style="color: #333;">Best regards,<br>The Team</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", { status: emailResponse.status, error: errorText });
      throw new Error(`Resend API error: ${emailResponse.status} - ${errorText}`);
    }

    const emailData = await emailResponse.json();
    console.log("Campaign invitation resent successfully:", emailData);

    return new Response(JSON.stringify({ 
      success: true,
      message: "Campaign invitation resent successfully",
      emailId: emailData.id
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in resend-invitation function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Failed to resend campaign invitation"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
