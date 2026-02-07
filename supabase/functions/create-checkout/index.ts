import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CartItem {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  image?: string;
}

interface CheckoutRequest {
  items: CartItem[];
  customerEmail?: string;
  couponCode?: string;
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Create Supabase client to check for authenticated user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { items, customerEmail, couponCode }: CheckoutRequest = await req.json();
    logStep("Received checkout request", { itemCount: items.length, customerEmail, couponCode });

    if (!items || items.length === 0) {
      throw new Error("Cart is empty");
    }

    // Check inventory before proceeding
    const inventoryItems = items.map(i => ({ productId: i.productId, quantity: i.quantity }));
    const { data: inventoryData, error: invError } = await supabaseClient
      .from("product_inventory")
      .select("*")
      .in("product_id", inventoryItems.map(i => i.productId));

    if (!invError && inventoryData) {
      for (const item of items) {
        const inv = inventoryData.find(i => i.product_id === item.productId);
        if (inv && inv.track_inventory && inv.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${item.productName}. Only ${inv.stock_quantity} available.`);
        }
      }
    }
    logStep("Inventory check passed");

    // Validate coupon if provided
    let stripeCouponId: string | undefined;
    if (couponCode) {
      const orderTotal = items.reduce((sum, i) => sum + i.productPrice * i.quantity, 0);
      const { data: coupon, error: couponError } = await supabaseClient
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (couponError || !coupon) {
        throw new Error("Invalid coupon code");
      }

      // Validate coupon constraints
      if (coupon.valid_from && new Date(coupon.valid_from) > new Date()) {
        throw new Error("Coupon is not yet active");
      }
      if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
        throw new Error("Coupon has expired");
      }
      if (coupon.max_uses !== null && coupon.times_used >= coupon.max_uses) {
        throw new Error("Coupon usage limit reached");
      }
      if (coupon.min_order_amount && orderTotal < coupon.min_order_amount) {
        throw new Error(`Minimum order of $${coupon.min_order_amount} required`);
      }

      // Create Stripe coupon
      const stripeCoupon = await stripe.coupons.create({
        ...(coupon.discount_type === "percentage" 
          ? { percent_off: coupon.discount_value }
          : { amount_off: Math.round(coupon.discount_value * 100), currency: "usd" }),
        duration: "once",
        metadata: { supabase_coupon_id: coupon.id },
      });
      stripeCouponId = stripeCoupon.id;
      logStep("Stripe coupon created", { stripeCouponId });
    }

    // Try to get authenticated user
    let user = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      user = data.user;
      logStep("User authenticated", { userId: user?.id, email: user?.email });
    } else {
      logStep("Guest checkout - no auth header");
    }

    const email = user?.email || customerEmail;

    // Check if a Stripe customer exists
    let customerId: string | undefined;
    if (email) {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found existing Stripe customer", { customerId });
      }
    }

    // Create line items for Stripe Checkout
    const lineItems = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.productName,
          metadata: {
            productId: item.productId,
          },
        },
        unit_amount: Math.round(item.productPrice * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    logStep("Created line items", { count: lineItems.length });

    const origin = req.headers.get("origin") || "http://localhost:3000";

    // Store cart metadata for order creation
    const metadata = {
      userId: user?.id || "guest",
      couponCode: couponCode || "",
      items: JSON.stringify(items.map(i => ({ 
        productId: i.productId, 
        productName: i.productName,
        productPrice: i.productPrice,
        quantity: i.quantity 
      }))),
    };

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      metadata,
      ...(stripeCouponId && { discounts: [{ coupon: stripeCouponId }] }),
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "AU", "DE", "FR", "JP"],
      },
      billing_address_collection: "required",
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
