import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendEmailRequest {
  to: string | string[];
  subject: string;
  body: string;
  emailType?: string;
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-SEND-EMAIL] ${step}${detailsStr}`);
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

    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const userId = userData.user?.id;
    if (!userId) throw new Error("User not found");

    // Check if user is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      throw new Error("Unauthorized: Admin access required");
    }
    logStep("Admin verified", { userId });

    const { to, subject, body, emailType = "custom" }: SendEmailRequest = await req.json();
    logStep("Request received", { to, subject, emailType });

    // Validate input
    if (!to || !subject || !body) {
      throw new Error("Missing required fields: to, subject, body");
    }

    // Get SMTP settings
    const { data: smtpSettings, error: smtpError } = await supabaseAdmin
      .from("email_settings")
      .select("*")
      .eq("is_active", true)
      .single();

    if (smtpError || !smtpSettings) {
      throw new Error("SMTP not configured. Please configure email settings in admin.");
    }
    logStep("SMTP settings loaded", { host: smtpSettings.smtp_host, port: smtpSettings.smtp_port });

    // Create SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: smtpSettings.smtp_host,
        port: smtpSettings.smtp_port,
        tls: smtpSettings.smtp_secure,
        auth: {
          username: smtpSettings.smtp_user,
          password: smtpSettings.smtp_password,
        },
      },
    });

    const recipients = Array.isArray(to) ? to : [to];
    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const recipient of recipients) {
      try {
        // Log the email attempt
        const { data: logEntry, error: logError } = await supabaseAdmin
          .from("email_logs")
          .insert({
            to_email: recipient,
            subject,
            body,
            email_type: emailType,
            status: "pending",
          })
          .select()
          .single();

        if (logError) {
          logStep("Failed to create log entry", { error: logError.message });
        }

        // Send email
        await client.send({
          from: `${smtpSettings.from_name} <${smtpSettings.from_email}>`,
          to: recipient,
          subject,
          html: body,
        });

        // Update log status
        if (logEntry) {
          await supabaseAdmin
            .from("email_logs")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", logEntry.id);
        }

        results.push({ email: recipient, success: true });
        logStep("Email sent successfully", { recipient });
      } catch (sendError) {
        const errorMessage = sendError instanceof Error ? sendError.message : String(sendError);
        
        // Log the failure
        await supabaseAdmin
          .from("email_logs")
          .insert({
            to_email: recipient,
            subject,
            body,
            email_type: emailType,
            status: "failed",
            error_message: errorMessage,
          });

        results.push({ email: recipient, success: false, error: errorMessage });
        logStep("Email send failed", { recipient, error: errorMessage });
      }
    }

    await client.close();

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({ 
        success: failCount === 0, 
        sent: successCount, 
        failed: failCount,
        results 
      }),
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
