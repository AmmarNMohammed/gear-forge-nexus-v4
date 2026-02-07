import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CLAIM-GUEST-ORDERS] ${step}${detailsStr}`);
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

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    logStep("User authenticated", { userId: user.id, email: user.email });

    // Find guest orders with matching email
    const { data: guestOrders, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("id, total_amount, created_at")
      .eq("guest_email", user.email)
      .is("user_id", null);

    if (fetchError) {
      throw new Error(`Failed to fetch guest orders: ${fetchError.message}`);
    }

    logStep("Found guest orders", { count: guestOrders?.length || 0 });

    if (!guestOrders || guestOrders.length === 0) {
      return new Response(
        JSON.stringify({ success: true, claimedCount: 0, message: "No guest orders found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Claim the orders by setting user_id
    const orderIds = guestOrders.map(o => o.id);
    
    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({ user_id: user.id })
      .in("id", orderIds);

    if (updateError) {
      throw new Error(`Failed to claim orders: ${updateError.message}`);
    }

    logStep("Orders claimed successfully", { orderIds });

    return new Response(
      JSON.stringify({ 
        success: true, 
        claimedCount: guestOrders.length,
        orders: guestOrders 
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
