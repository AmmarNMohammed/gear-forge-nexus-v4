import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ManageUsersRequest {
  action: "list" | "add-role" | "remove-role";
  userId?: string;
  role?: "manager";
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-MANAGE-USERS] ${step}${detailsStr}`);
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

    // Verify admin status (only admin, not manager)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Invalid authentication");
    }

    // Check admin role (specifically admin, not manager)
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      throw new Error("Admin access required (managers cannot access user management)");
    }

    logStep("Admin verified", { userId: user.id });

    const { action, userId, role }: ManageUsersRequest = await req.json();

    switch (action) {
      case "list": {
        // Get all users from auth.users via admin API
        const { data: authUsers, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (usersError) throw usersError;

        // Get all user roles
        const { data: allRoles, error: rolesError } = await supabaseAdmin
          .from("user_roles")
          .select("user_id, role");

        if (rolesError) throw rolesError;

        // Get all profiles
        const { data: profiles, error: profilesError } = await supabaseAdmin
          .from("profiles")
          .select("user_id, display_name");

        if (profilesError) throw profilesError;

        // Map users with their roles and profiles
        const users = authUsers.users.map(authUser => {
          const userRoles = allRoles
            ?.filter(r => r.user_id === authUser.id)
            .map(r => r.role) || [];
          const profile = profiles?.find(p => p.user_id === authUser.id);
          
          return {
            id: authUser.id,
            email: authUser.email,
            display_name: profile?.display_name || null,
            created_at: authUser.created_at,
            roles: userRoles,
            is_admin: userRoles.includes("admin"),
            is_manager: userRoles.includes("manager"),
          };
        });

        logStep("Listed users", { count: users.length });
        return new Response(
          JSON.stringify({ users }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      case "add-role": {
        if (!userId || !role) {
          throw new Error("User ID and role required");
        }

        // Only allow adding manager role (not admin)
        if (role !== "manager") {
          throw new Error("Can only add manager role through this interface");
        }

        // Check if user already has this role
        const { data: existingRole } = await supabaseAdmin
          .from("user_roles")
          .select("id")
          .eq("user_id", userId)
          .eq("role", role)
          .maybeSingle();

        if (existingRole) {
          throw new Error("User already has this role");
        }

        const { error: insertError } = await supabaseAdmin
          .from("user_roles")
          .insert({
            user_id: userId,
            role: role,
          });

        if (insertError) throw insertError;

        logStep("Added role", { userId, role });
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      case "remove-role": {
        if (!userId || !role) {
          throw new Error("User ID and role required");
        }

        // Only allow removing manager role
        if (role !== "manager") {
          throw new Error("Can only remove manager role through this interface");
        }

        const { error: deleteError } = await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", role);

        if (deleteError) throw deleteError;

        logStep("Removed role", { userId, role });
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
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
