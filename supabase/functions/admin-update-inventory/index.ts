import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InventoryUpdate {
  productId: string;
  stockQuantity?: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
}

interface UpdateInventoryRequest {
  action: "list" | "update" | "bulk-update";
  updates?: InventoryUpdate[];
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-UPDATE-INVENTORY] ${step}${detailsStr}`);
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

    const { action, updates }: UpdateInventoryRequest = await req.json();

    switch (action) {
      case "list": {
        const { data: inventory, error } = await supabaseAdmin
          .from("product_inventory")
          .select("*")
          .order("product_id", { ascending: true });

        if (error) throw error;

        logStep("Listed inventory", { count: inventory?.length });
        return new Response(
          JSON.stringify({ inventory }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      case "update": {
        if (!updates || updates.length !== 1) {
          throw new Error("Single update required");
        }

        const update = updates[0];
        
        // Upsert inventory record
        const { data: updated, error } = await supabaseAdmin
          .from("product_inventory")
          .upsert({
            product_id: update.productId,
            stock_quantity: update.stockQuantity ?? 0,
            low_stock_threshold: update.lowStockThreshold ?? 5,
            track_inventory: update.trackInventory ?? true,
            updated_at: new Date().toISOString(),
          }, { onConflict: "product_id" })
          .select()
          .single();

        if (error) throw error;

        logStep("Updated inventory", { productId: update.productId });
        return new Response(
          JSON.stringify({ inventory: updated }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      case "bulk-update": {
        if (!updates || updates.length === 0) {
          throw new Error("Updates required");
        }

        const results = [];
        for (const update of updates) {
          const { data, error } = await supabaseAdmin
            .from("product_inventory")
            .upsert({
              product_id: update.productId,
              stock_quantity: update.stockQuantity ?? 0,
              low_stock_threshold: update.lowStockThreshold ?? 5,
              track_inventory: update.trackInventory ?? true,
              updated_at: new Date().toISOString(),
            }, { onConflict: "product_id" })
            .select()
            .single();

          if (!error && data) {
            results.push(data);
          }
        }

        logStep("Bulk updated inventory", { count: results.length });
        return new Response(
          JSON.stringify({ inventory: results }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      default:
        throw new Error("Invalid action");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in admin-update-inventory", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
