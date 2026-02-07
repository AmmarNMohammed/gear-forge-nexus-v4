import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CouponData {
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount?: number;
  max_uses?: number;
  valid_from?: string;
  valid_until?: string;
  is_active?: boolean;
}

interface ManageCouponsRequest {
  action: "list" | "create" | "update" | "delete" | "toggle";
  couponId?: string;
  data?: CouponData;
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-MANAGE-COUPONS] ${step}${detailsStr}`);
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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Verify admin status
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Invalid authentication");
    }

    // Check admin or manager role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "manager"])
      .maybeSingle();

    if (!roleData) {
      throw new Error("Admin or manager access required");
    }

    logStep("Role verified", { userId: user.id, role: roleData.role });

    const { action, couponId, data }: ManageCouponsRequest = await req.json();

    switch (action) {
      case "list": {
        const { data: coupons, error } = await supabaseAdmin
          .from("coupons")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        logStep("Listed coupons", { count: coupons?.length });
        return new Response(
          JSON.stringify({ coupons }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      case "create": {
        if (!data) throw new Error("Coupon data required");

        const { data: newCoupon, error } = await supabaseAdmin
          .from("coupons")
          .insert({
            code: data.code.toUpperCase(),
            discount_type: data.discount_type,
            discount_value: data.discount_value,
            min_order_amount: data.min_order_amount || 0,
            max_uses: data.max_uses || null,
            valid_from: data.valid_from || new Date().toISOString(),
            valid_until: data.valid_until || null,
            is_active: data.is_active ?? true,
          })
          .select()
          .single();

        if (error) throw error;

        logStep("Created coupon", { code: data.code });
        return new Response(
          JSON.stringify({ coupon: newCoupon }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      case "update": {
        if (!couponId || !data) throw new Error("Coupon ID and data required");

        const { data: updatedCoupon, error } = await supabaseAdmin
          .from("coupons")
          .update({
            code: data.code?.toUpperCase(),
            discount_type: data.discount_type,
            discount_value: data.discount_value,
            min_order_amount: data.min_order_amount,
            max_uses: data.max_uses,
            valid_from: data.valid_from,
            valid_until: data.valid_until,
            is_active: data.is_active,
          })
          .eq("id", couponId)
          .select()
          .single();

        if (error) throw error;

        logStep("Updated coupon", { couponId });
        return new Response(
          JSON.stringify({ coupon: updatedCoupon }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      case "toggle": {
        if (!couponId) throw new Error("Coupon ID required");

        // Get current status
        const { data: current } = await supabaseAdmin
          .from("coupons")
          .select("is_active")
          .eq("id", couponId)
          .single();

        const { data: toggled, error } = await supabaseAdmin
          .from("coupons")
          .update({ is_active: !current?.is_active })
          .eq("id", couponId)
          .select()
          .single();

        if (error) throw error;

        logStep("Toggled coupon", { couponId, is_active: toggled?.is_active });
        return new Response(
          JSON.stringify({ coupon: toggled }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      case "delete": {
        if (!couponId) throw new Error("Coupon ID required");

        const { error } = await supabaseAdmin
          .from("coupons")
          .delete()
          .eq("id", couponId);

        if (error) throw error;

        logStep("Deleted coupon", { couponId });
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      default:
        throw new Error("Invalid action");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in admin-manage-coupons", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
