import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ProductData {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  image: string;
  category: string;
  brand: string;
  rating?: number;
  reviews?: number;
  inStock?: boolean;
  hasRgb?: boolean;
  featured?: boolean;
  specs?: Record<string, string>;
  tags?: string[];
}

interface ManageProductsRequest {
  action: "list" | "create" | "update" | "delete";
  product?: ProductData;
  productId?: string;
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-MANAGE-PRODUCTS] ${step}${detailsStr}`);
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

    const { action, product, productId }: ManageProductsRequest = await req.json();

    switch (action) {
      case "list": {
        const { data: products, error } = await supabaseAdmin
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        logStep("Listed products", { count: products?.length });
        return new Response(
          JSON.stringify({ products }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      case "create": {
        if (!product) {
          throw new Error("Product data required");
        }

        const { data: newProduct, error } = await supabaseAdmin
          .from("products")
          .insert({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            original_price: product.originalPrice,
            image: product.image,
            category: product.category,
            brand: product.brand,
            rating: product.rating ?? 0,
            reviews: product.reviews ?? 0,
            in_stock: product.inStock ?? true,
            has_rgb: product.hasRgb ?? false,
            featured: product.featured ?? false,
            specs: product.specs ?? {},
            tags: product.tags ?? [],
          })
          .select()
          .single();

        if (error) throw error;

        logStep("Created product", { productId: newProduct.id });
        return new Response(
          JSON.stringify({ product: newProduct }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      case "update": {
        if (!product || !product.id) {
          throw new Error("Product data with ID required");
        }

        const { data: updatedProduct, error } = await supabaseAdmin
          .from("products")
          .update({
            name: product.name,
            description: product.description,
            price: product.price,
            original_price: product.originalPrice,
            image: product.image,
            category: product.category,
            brand: product.brand,
            rating: product.rating,
            reviews: product.reviews,
            in_stock: product.inStock,
            has_rgb: product.hasRgb,
            featured: product.featured,
            specs: product.specs,
            tags: product.tags,
          })
          .eq("id", product.id)
          .select()
          .single();

        if (error) throw error;

        logStep("Updated product", { productId: updatedProduct.id });
        return new Response(
          JSON.stringify({ product: updatedProduct }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      case "delete": {
        if (!productId) {
          throw new Error("Product ID required");
        }

        const { error } = await supabaseAdmin
          .from("products")
          .delete()
          .eq("id", productId);

        if (error) throw error;

        logStep("Deleted product", { productId });
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
    logStep("ERROR in admin-manage-products", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
