import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Package, 
  Loader2,
  Mail,
  User,
  Tag,
  Boxes,
  ShoppingBag,
  Layout,
  FolderOpen,
  Bookmark,
  Users,
  Shield
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AdminOrders } from "@/components/admin/AdminOrders";
import { AdminInventory } from "@/components/admin/AdminInventory";
import { AdminCoupons } from "@/components/admin/AdminCoupons";
import { AdminProducts } from "@/components/admin/AdminProducts";
import { AdminSetups } from "@/components/admin/AdminSetups";
import { AdminCategories } from "@/components/admin/AdminCategories";
import { AdminBrands } from "@/components/admin/AdminBrands";
import { AdminEmailConfig } from "@/components/admin/AdminEmailConfig";
import { AdminUsers } from "@/components/admin/AdminUsers";

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
}

interface Order {
  id: string;
  user_id: string | null;
  guest_email: string | null;
  customer_email: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  is_guest: boolean;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  total_amount: number;
  shipping_address: Record<string, unknown> | null;
  created_at: string;
  order_items: OrderItem[];
}

type UserRole = "admin" | "manager" | null;

export default function Admin() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);

  // Check admin/manager status
  useEffect(() => {
    async function checkRole() {
      if (!user) return;
      
      const { data: adminData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      
      if (adminData) {
        setUserRole("admin");
        return;
      }

      const { data: managerData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "manager")
        .maybeSingle();
      
      if (managerData) {
        setUserRole("manager");
        return;
      }
      
      toast({
        title: "Access Denied",
        description: "You don't have admin or manager privileges",
        variant: "destructive",
      });
      navigate("/");
    }
    
    if (!authLoading && user) {
      checkRole();
    } else if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate, toast]);

  // Fetch orders
  useEffect(() => {
    async function fetchOrders() {
      if (!userRole) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("admin-get-orders", {
          body: null,
        });

        if (error) throw error;
        setOrders(data.orders || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast({
          title: "Error",
          description: "Failed to load orders",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (userRole) {
      fetchOrders();
    }
  }, [userRole, toast]);

  if (authLoading || (user && !userRole && isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userRole) {
    return null;
  }

  const isAdmin = userRole === "admin";

  return (
    <div className="min-h-screen pt-20 md:pt-24">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold">
              <span className="text-gradient">{isAdmin ? "Admin" : "Manager"}</span> Dashboard
            </h1>
            <Badge variant="outline" className={cn(
              "flex items-center gap-1",
              isAdmin ? "border-primary/50 text-primary" : "border-secondary/50 text-secondary"
            )}>
              <Shield className="w-3 h-3" />
              {isAdmin ? "Admin" : "Manager"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {isAdmin ? "Full access to all settings" : "Manage orders, products, and inventory"}
          </p>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="bg-card border border-border flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Boxes className="w-4 h-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="coupons" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Coupons
            </TabsTrigger>
            <TabsTrigger value="setups" className="flex items-center gap-2">
              <Layout className="w-4 h-4" />
              Setups
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="brands" className="flex items-center gap-2">
              <Bookmark className="w-4 h-4" />
              Brands
            </TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Users
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="orders">
            <AdminOrders orders={orders} setOrders={setOrders} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="products">
            <AdminProducts />
          </TabsContent>

          <TabsContent value="inventory">
            <AdminInventory />
          </TabsContent>

          <TabsContent value="coupons">
            <AdminCoupons />
          </TabsContent>

          <TabsContent value="setups">
            <AdminSetups />
          </TabsContent>

          <TabsContent value="categories">
            <AdminCategories />
          </TabsContent>

          <TabsContent value="brands">
            <AdminBrands />
          </TabsContent>

          {isAdmin && (
            <>
              <TabsContent value="email">
                <AdminEmailConfig />
              </TabsContent>

              <TabsContent value="users">
                <AdminUsers />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}
