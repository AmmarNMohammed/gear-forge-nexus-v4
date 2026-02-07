import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AuthEmailRequest {
  email: string;
  emailType: "password_reset" | "email_verification" | "magic_link";
  redirectUrl?: string;
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-AUTH-EMAIL] ${step}${detailsStr}`);
};

const getEmailTemplate = (
  emailType: string,
  actionUrl: string,
  fromName: string
) => {
  const templates: Record<string, { subject: string; heading: string; message: string; buttonText: string }> = {
    password_reset: {
      subject: "Reset Your Password",
      heading: "Password Reset Request",
      message: "You requested to reset your password. Click the button below to set a new password. This link will expire in 1 hour.",
      buttonText: "Reset Password",
    },
    email_verification: {
      subject: "Verify Your Email",
      heading: "Verify Your Email Address",
      message: "Thanks for signing up! Please verify your email address by clicking the button below.",
      buttonText: "Verify Email",
    },
    magic_link: {
      subject: "Your Login Link",
      heading: "Magic Login Link",
      message: "Click the button below to log in to your account. This link will expire in 1 hour.",
      buttonText: "Log In",
    },
  };

  const template = templates[emailType] || templates.magic_link;

  return {
    subject: `${fromName} - ${template.subject}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #fff; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 40px; }
          .logo { font-size: 28px; font-weight: bold; background: linear-gradient(135deg, #22c55e, #16a34a); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          h1 { color: #22c55e; margin: 20px 0; font-size: 24px; }
          .card { background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 32px; margin: 20px 0; text-align: center; }
          p { color: #ccc; line-height: 1.6; margin: 16px 0; }
          .btn { display: inline-block; background: linear-gradient(135deg, #22c55e, #16a34a); color: white !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 24px 0; }
          .footer { text-align: center; margin-top: 40px; color: #666; font-size: 14px; }
          .link { color: #22c55e; word-break: break-all; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">${fromName}</div>
          </div>
          
          <div class="card">
            <h1>${template.heading}</h1>
            <p>${template.message}</p>
            <a href="${actionUrl}" class="btn">${template.buttonText}</a>
            <p style="font-size: 12px; color: #888;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p class="link" style="font-size: 12px;">${actionUrl}</p>
          </div>
          
          <div class="footer">
            <p>If you didn't request this email, you can safely ignore it.</p>
            <p style="color: #444;">© ${new Date().getFullYear()} ${fromName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { email, emailType, redirectUrl }: AuthEmailRequest = await req.json();
    logStep("Request received", { email, emailType });

    if (!email || !emailType) {
      throw new Error("Email and emailType are required");
    }

    // Fetch SMTP settings from database
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from("email_settings")
      .select("*")
      .eq("is_active", true)
      .single();

    if (settingsError || !settings) {
      logStep("No active SMTP settings found, using default Supabase auth");
      
      // Fall back to Supabase's built-in auth emails
      if (emailType === "password_reset") {
        const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl || `${req.headers.get("origin")}/reset-password`,
        });
        if (error) throw error;
      } else if (emailType === "magic_link") {
        const { error } = await supabaseAdmin.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: redirectUrl || req.headers.get("origin") || undefined,
          },
        });
        if (error) throw error;
      }
      
      return new Response(
        JSON.stringify({ success: true, method: "supabase_default" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    logStep("SMTP settings found", { host: settings.smtp_host, fromEmail: settings.from_email });

    // Generate the appropriate action URL based on email type
    let actionUrl: string;
    const origin = redirectUrl || req.headers.get("origin") || "https://gear-forge-nexus.lovable.app";

    if (emailType === "password_reset") {
      // Generate password reset link using Supabase
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: {
          redirectTo: `${origin}/reset-password`,
        },
      });
      
      if (error) throw error;
      actionUrl = data.properties.action_link;
    } else if (emailType === "email_verification") {
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: "signup",
        email,
        password: crypto.randomUUID(), // Temporary, user already has password
        options: {
          redirectTo: origin,
        },
      });
      
      if (error) throw error;
      actionUrl = data.properties.action_link;
    } else {
      // Magic link
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: {
          redirectTo: origin,
        },
      });
      
      if (error) throw error;
      actionUrl = data.properties.action_link;
    }

    logStep("Generated action URL");

    // Get email content
    const emailContent = getEmailTemplate(emailType, actionUrl, settings.from_name);

    // Send via custom SMTP
    const client = new SMTPClient({
      connection: {
        hostname: settings.smtp_host,
        port: settings.smtp_port,
        tls: settings.smtp_secure,
        auth: {
          username: settings.smtp_user,
          password: settings.smtp_password,
        },
      },
    });

    await client.send({
      from: `${settings.from_name} <${settings.from_email}>`,
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    await client.close();
    logStep("Email sent via custom SMTP");

    // Log the email
    await supabaseAdmin.from("email_logs").insert({
      to_email: email,
      subject: emailContent.subject,
      body: emailContent.html,
      email_type: emailType,
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ success: true, method: "custom_smtp" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
