
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SupportEmailRequest {
  name: string;
  email: string;
  subject: string;
  priority: 'low' | 'medium' | 'high';
  message: string;
  userTier: string;
  userId: string;
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
      name, 
      email, 
      subject, 
      priority, 
      message, 
      userTier, 
      userId 
    }: SupportEmailRequest = await req.json();

    // Verify user has email support access
    if (!userTier || !['Starter', 'Pro', 'Premium'].includes(userTier)) {
      throw new Error('Email support not available for your plan');
    }

    const priorityEmoji = {
      low: '🟢',
      medium: '🟡',
      high: '🔴'
    };

    // Send email to support team
    const supportEmailResponse = await resend.emails.send({
      from: "Support <support@yourdomain.com>",
      to: ["support@yourdomain.com"], // Replace with your support email
      subject: `${priorityEmoji[priority]} Support Request: ${subject}`,
      html: `
        <h2>New Support Request</h2>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>User ID:</strong> ${userId}</p>
          <p><strong>Plan:</strong> ${userTier}</p>
          <p><strong>Priority:</strong> ${priority.toUpperCase()}</p>
          <p><strong>Subject:</strong> ${subject}</p>
        </div>
        <h3>Message:</h3>
        <div style="background: #fff; padding: 15px; border-left: 4px solid #2563eb; margin: 15px 0;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <hr>
        <p><small>This message was sent from the support form on your website.</small></p>
      `,
    });

    // Send confirmation email to user
    const confirmationEmailResponse = await resend.emails.send({
      from: "Support <support@yourdomain.com>",
      to: [email],
      subject: "We received your support request",
      html: `
        <h1>Thank you for contacting support, ${name}!</h1>
        <p>We have received your support request and will get back to you within 24 hours.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Your Request Details:</h3>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Priority:</strong> ${priority.charAt(0).toUpperCase() + priority.slice(1)}</p>
          <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <p>In the meantime, you can check our <a href="https://yourdomain.com/docs">documentation</a> or visit your <a href="https://yourdomain.com/dashboard">dashboard</a>.</p>
        
        <p>Best regards,<br>The Support Team</p>
      `,
    });

    console.log("Support emails sent successfully:", {
      supportEmail: supportEmailResponse,
      confirmationEmail: confirmationEmailResponse
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: "Support request sent successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-support-email function:", error);
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
