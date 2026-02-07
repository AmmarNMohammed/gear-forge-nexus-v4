import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ValidateCouponRequest {
  code: string;
  orderTotal: number;
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VALIDATE-COUPON] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { code, orderTotal }: ValidateCouponRequest = await req.json();
    
    if (!code) {
      throw new Error("Coupon code is required");
    }

    logStep("Validating coupon", { code, orderTotal });

    // Get the coupon from database
    const { data: coupon, error } = await supabaseClient
      .from("coupons")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      logStep("Database error", { error: error.message });
      throw new Error("Error validating coupon");
    }

    if (!coupon) {
      logStep("Coupon not found");
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid coupon code" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    logStep("Coupon found", { coupon });

    // Check if coupon has started
    if (coupon.valid_from && new Date(coupon.valid_from) > new Date()) {
      return new Response(
        JSON.stringify({ valid: false, error: "This coupon is not yet active" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check if coupon has expired
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      return new Response(
        JSON.stringify({ valid: false, error: "This coupon has expired" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check usage limits
    if (coupon.max_uses !== null && coupon.times_used >= coupon.max_uses) {
      return new Response(
        JSON.stringify({ valid: false, error: "This coupon has reached its usage limit" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check minimum order amount
    if (coupon.min_order_amount && orderTotal < coupon.min_order_amount) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: `Minimum order of $${coupon.min_order_amount} required for this coupon` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Calculate discount amount
    let discountAmount: number;
    if (coupon.discount_type === "percentage") {
      discountAmount = (orderTotal * coupon.discount_value) / 100;
    } else {
      discountAmount = Math.min(coupon.discount_value, orderTotal);
    }

    logStep("Coupon validated successfully", { discountAmount });

    return new Response(
      JSON.stringify({
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          discountType: coupon.discount_type,
          discountValue: coupon.discount_value,
          discountAmount: Math.round(discountAmount * 100) / 100,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in validate-coupon", { message: errorMessage });
    return new Response(
      JSON.stringify({ valid: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
