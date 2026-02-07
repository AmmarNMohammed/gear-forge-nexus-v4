import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin or manager role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "manager"])
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Unauthorized - admin or manager only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, setup } = await req.json();
    console.log(`Admin setup action: ${action}`, setup?.id);

    switch (action) {
      case "create": {
        const { data, error } = await supabase
          .from("setups")
          .insert({
            id: setup.id,
            name: setup.name,
            description: setup.description,
            image: setup.image,
            total_price: setup.totalPrice,
            style: setup.style,
            is_curated: setup.isCurated || false,
            is_featured: setup.isFeatured || false,
            tags: setup.tags || [],
            products: setup.products || [],
          })
          .select()
          .single();

        if (error) throw error;
        console.log(`Setup created: ${data.id}`);
        return new Response(JSON.stringify({ success: true, setup: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update": {
        const { data, error } = await supabase
          .from("setups")
          .update({
            name: setup.name,
            description: setup.description,
            image: setup.image,
            total_price: setup.totalPrice,
            style: setup.style,
            is_curated: setup.isCurated,
            is_featured: setup.isFeatured,
            tags: setup.tags || [],
            products: setup.products || [],
          })
          .eq("id", setup.id)
          .select()
          .single();

        if (error) throw error;
        console.log(`Setup updated: ${data.id}`);
        return new Response(JSON.stringify({ success: true, setup: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete": {
        const { error } = await supabase
          .from("setups")
          .delete()
          .eq("id", setup.id);

        if (error) throw error;
        console.log(`Setup deleted: ${setup.id}`);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("Error in admin-manage-setups:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
