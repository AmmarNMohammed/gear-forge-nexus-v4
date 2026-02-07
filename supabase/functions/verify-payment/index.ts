import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OrderItem {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Use service role to create orders
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { sessionId } = await req.json();
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    logStep("Verifying session", { sessionId });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "customer"],
    });

    logStep("Session retrieved", { 
      status: session.payment_status,
      customerEmail: session.customer_email 
    });

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    // Parse the order items from metadata
    const metadata = session.metadata;
    const userId = metadata?.userId;
    const couponCode = metadata?.couponCode;
    const items: OrderItem[] = metadata?.items ? JSON.parse(metadata.items) : [];

    logStep("Parsed order data", { userId, itemCount: items.length, couponCode });

    // Calculate total
    const totalAmount = items.reduce(
      (sum, item) => sum + item.productPrice * item.quantity,
      0
    );

    // Create shipping address from Stripe data
    const shippingAddress = session.shipping_details ? {
      name: session.shipping_details.name,
      address: session.shipping_details.address,
    } : null;

    // Check if order already exists for this session
    const { data: existingOrder } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    let orderId: string | null = null;

    if (existingOrder) {
      orderId = existingOrder.id;
      logStep("Order already exists", { orderId });
    } else {
      // Create the order - for both authenticated users and guests
      const orderInsert: Record<string, unknown> = {
        total_amount: totalAmount,
        shipping_address: shippingAddress,
        status: "processing",
        stripe_session_id: sessionId,
      };

      // Set user_id for authenticated users, guest_email for guests
      if (userId && userId !== "guest") {
        orderInsert.user_id = userId;
      } else {
        orderInsert.guest_email = session.customer_email;
      }

      const { data: orderData, error: orderError } = await supabaseAdmin
        .from("orders")
        .insert(orderInsert)
        .select()
        .single();

      if (orderError) {
        logStep("Error creating order", { error: orderError.message });
        throw new Error(`Failed to create order: ${orderError.message}`);
      }

      orderId = orderData.id;
      logStep("Order created", { orderId, isGuest: !userId || userId === "guest" });

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: orderId,
        product_id: item.productId,
        product_name: item.productName,
        product_price: item.productPrice,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabaseAdmin
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        logStep("Error creating order items", { error: itemsError.message });
      } else {
        logStep("Order items created", { count: orderItems.length });
      }

      // Decrement inventory for each item
      for (const item of items) {
        const { error: invError } = await supabaseAdmin.rpc("decrement_inventory", {
          p_product_id: item.productId,
          p_quantity: item.quantity,
        });

        if (invError) {
          // If RPC doesn't exist, do it manually
          const { data: inv } = await supabaseAdmin
            .from("product_inventory")
            .select("stock_quantity")
            .eq("product_id", item.productId)
            .single();

          if (inv) {
            await supabaseAdmin
              .from("product_inventory")
              .update({ 
                stock_quantity: Math.max(0, inv.stock_quantity - item.quantity),
                updated_at: new Date().toISOString()
              })
              .eq("product_id", item.productId);
          }
        }
      }
      logStep("Inventory decremented");

      // Increment coupon usage if used
      if (couponCode) {
        const { data: coupon } = await supabaseAdmin
          .from("coupons")
          .select("id, times_used")
          .eq("code", couponCode.toUpperCase())
          .single();

        if (coupon) {
          await supabaseAdmin
            .from("coupons")
            .update({ times_used: (coupon.times_used || 0) + 1 })
            .eq("id", coupon.id);
          logStep("Coupon usage incremented", { code: couponCode });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_email,
        amountTotal: session.amount_total,
        shippingAddress,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
