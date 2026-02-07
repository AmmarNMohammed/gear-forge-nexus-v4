import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CheckInventoryRequest {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

interface InventoryStatus {
  productId: string;
  available: boolean;
  stockQuantity: number;
  requestedQuantity: number;
  isLowStock: boolean;
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-INVENTORY] ${step}${detailsStr}`);
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

    const { items }: CheckInventoryRequest = await req.json();
    
    if (!items || items.length === 0) {
      throw new Error("Items are required");
    }

    logStep("Checking inventory", { itemCount: items.length });

    const productIds = items.map(item => item.productId);

    // Get inventory for all requested products
    const { data: inventoryData, error } = await supabaseClient
      .from("product_inventory")
      .select("*")
      .in("product_id", productIds);

    if (error) {
      logStep("Database error", { error: error.message });
      throw new Error("Error checking inventory");
    }

    // Create a map for quick lookup
    const inventoryMap = new Map(
      inventoryData?.map(inv => [inv.product_id, inv]) || []
    );

    // Check each item
    const results: InventoryStatus[] = items.map(item => {
      const inventory = inventoryMap.get(item.productId);
      
      if (!inventory || !inventory.track_inventory) {
        // If no inventory record or tracking disabled, assume available
        return {
          productId: item.productId,
          available: true,
          stockQuantity: 999,
          requestedQuantity: item.quantity,
          isLowStock: false,
        };
      }

      return {
        productId: item.productId,
        available: inventory.stock_quantity >= item.quantity,
        stockQuantity: inventory.stock_quantity,
        requestedQuantity: item.quantity,
        isLowStock: inventory.stock_quantity <= inventory.low_stock_threshold,
      };
    });

    const allAvailable = results.every(r => r.available);
    const unavailableItems = results.filter(r => !r.available);

    logStep("Inventory check complete", { 
      allAvailable, 
      unavailableCount: unavailableItems.length 
    });

    return new Response(
      JSON.stringify({
        allAvailable,
        items: results,
        unavailableItems,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-inventory", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
