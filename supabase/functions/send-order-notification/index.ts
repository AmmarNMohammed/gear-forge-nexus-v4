import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationRequest {
  orderId: string;
  newStatus: "shipped" | "delivered";
  trackingNumber?: string;
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-ORDER-NOTIFICATION] ${step}${detailsStr}`);
};

const getStatusEmailContent = (status: string, orderNumber: string, trackingNumber?: string) => {
  if (status === "shipped") {
    return {
      subject: `Your order #${orderNumber} has shipped! 📦`,
      heading: "Your Order is On Its Way!",
      message: "Great news! Your gaming gear has been shipped and is on its way to you.",
      details: trackingNumber 
        ? `<p style="color: #22c55e; font-weight: bold;">Tracking Number: ${trackingNumber}</p>` 
        : "",
      icon: "📦",
    };
  }
  
  return {
    subject: `Your order #${orderNumber} has been delivered! 🎮`,
    heading: "Your Order Has Arrived!",
    message: "Your gaming gear has been delivered. Time to level up!",
    details: "",
    icon: "🎮",
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY is not set");
    logStep("Resend key verified");

    const resend = new Resend(resendKey);

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

    // Check if user is admin or manager
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "manager"])
      .maybeSingle();

    if (!roleData) {
      throw new Error("Unauthorized: Admin or manager access required");
    }
    logStep("Role verified", { userId, role: roleData.role });

    const { orderId, newStatus, trackingNumber }: NotificationRequest = await req.json();
    logStep("Request received", { orderId, newStatus, trackingNumber });

    // Fetch order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    // Get customer email
    let customerEmail: string | null = null;
    
    if (order.user_id) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
      customerEmail = userData.user?.email ?? null;
    } else if (order.guest_email) {
      customerEmail = order.guest_email;
    }

    if (!customerEmail) {
      throw new Error("No customer email found for this order");
    }

    logStep("Customer email found", { customerEmail });

    // Update order status
    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (updateError) {
      throw new Error(`Failed to update order: ${updateError.message}`);
    }
    logStep("Order status updated", { newStatus });

    // Send email notification
    const orderNumber = orderId.slice(0, 8).toUpperCase();
    const emailContent = getStatusEmailContent(newStatus, orderNumber, trackingNumber);

    const itemsList = order.order_items
      ?.map((item: { product_name: string; quantity: number }) => 
        `<li>${item.product_name} × ${item.quantity}</li>`
      )
      .join("") || "";

    const { error: emailError } = await resend.emails.send({
      from: "NexusGear <onboarding@resend.dev>",
      to: [customerEmail],
      subject: emailContent.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #fff; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { text-align: center; margin-bottom: 40px; }
            .icon { font-size: 64px; margin-bottom: 20px; }
            h1 { color: #22c55e; margin: 0; font-size: 28px; }
            .card { background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 24px; margin: 20px 0; }
            .order-number { color: #888; font-size: 14px; margin-bottom: 10px; }
            .items-list { list-style: none; padding: 0; margin: 0; }
            .items-list li { padding: 8px 0; border-bottom: 1px solid #333; color: #ccc; }
            .items-list li:last-child { border-bottom: none; }
            .footer { text-align: center; margin-top: 40px; color: #666; font-size: 14px; }
            .btn { display: inline-block; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="icon">${emailContent.icon}</div>
              <h1>${emailContent.heading}</h1>
            </div>
            
            <div class="card">
              <p class="order-number">Order #${orderNumber}</p>
              <p>${emailContent.message}</p>
              ${emailContent.details}
              
              ${itemsList ? `
                <h3 style="color: #22c55e; margin-top: 20px;">Order Items</h3>
                <ul class="items-list">${itemsList}</ul>
              ` : ''}
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${req.headers.get("origin") || "https://nexusgear.lovable.app"}/account" class="btn">
                View Your Order
              </a>
            </div>
            
            <div class="footer">
              <p>Thank you for shopping with NexusGear!</p>
              <p style="color: #444;">© 2026 NexusGear. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (emailError) {
      logStep("Email send failed", { error: emailError });
      // Don't throw - order was updated, just log the email failure
      return new Response(
        JSON.stringify({ 
          success: true, 
          orderUpdated: true, 
          emailSent: false,
          emailError: emailError.message 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    logStep("Email sent successfully", { to: customerEmail });

    return new Response(
      JSON.stringify({ success: true, orderUpdated: true, emailSent: true }),
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
