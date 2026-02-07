import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-GET-ORDERS] ${step}${detailsStr}`);
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

    // Parse query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Build query
    let query = supabaseAdmin
      .from("orders")
      .select("*, order_items(*)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data: orders, error: ordersError, count } = await query;

    if (ordersError) {
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }

    // Enrich orders with customer email, name, and phone
    const enrichedOrders = await Promise.all(
      (orders || []).map(async (order) => {
        let customerEmail = order.guest_email;
        let customerName: string | null = null;
        let customerPhone: string | null = null;
        
        if (order.user_id) {
          // Get auth user data (email, phone)
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
          if (authUser.user) {
            customerEmail = customerEmail || authUser.user.email || null;
            customerPhone = authUser.user.phone || null;
          }

          // Get profile data (display_name)
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("display_name")
            .eq("user_id", order.user_id)
            .maybeSingle();

          if (profile) {
            customerName = profile.display_name;
          }
        }

        return {
          ...order,
          customer_email: customerEmail,
          customer_name: customerName,
          customer_phone: customerPhone,
          is_guest: !order.user_id,
        };
      })
    );

    logStep("Orders fetched", { count, returned: enrichedOrders.length });

    return new Response(
      JSON.stringify({ orders: enrichedOrders, total: count }),
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
