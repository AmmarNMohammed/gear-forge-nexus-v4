import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Heart, Package, LogOut, Loader2, ShoppingBag, Trash2, Gift, Shield, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProductCard } from "@/components/ProductCard";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useWishlist } from "@/hooks/useWishlist";
import { useOrders } from "@/hooks/useOrders";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AddressManager } from "@/components/account/AddressManager";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  shipped: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  delivered: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30"
};

export default function Account() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { t, direction } = useLanguage();
  const { getWishlistProducts, isLoading: wishlistLoading, removeFromWishlist } = useWishlist();
  const { orders, isLoading: ordersLoading, refetch: refetchOrders } = useOrders();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("wishlist");
  const [isClaimingOrders, setIsClaimingOrders] = useState(false);
  const [claimedOrders, setClaimedOrders] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  const wishlistProducts = getWishlistProducts();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Check admin status and claim guest orders on login
  useEffect(() => {
    async function checkAdminAndClaimOrders() {
      if (!user) return;
      
      // Check admin status
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      
      setIsAdmin(!!roleData);

      // Try to claim guest orders
      try {
        const { data, error } = await supabase.functions.invoke("claim-guest-orders");
        
        if (!error && data?.claimedCount > 0) {
          setClaimedOrders(data.claimedCount);
          refetchOrders();
          toast({
            title: "Orders linked!",
            description: `Found ${data.claimedCount} order(s) from your previous purchases`,
          });
        }
      } catch (e) {
        console.error("Error claiming orders:", e);
      }
    }

    if (user) {
      checkAdminAndClaimOrders();
    }
  }, [user, refetchOrders, toast]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen pt-20 md:pt-24">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className={cn(
          "flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8",
          direction === "rtl" && "md:flex-row-reverse text-right"
        )}>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              <span className="text-gradient">{direction === "ltr" ? "My" : ""}</span> {t("account.myAccount")}
            </h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <div className={cn("flex items-center gap-3", direction === "rtl" && "flex-row-reverse")}>
            {isAdmin && (
              <Button asChild variant="outline" className="border-primary/50">
                <Link to="/admin" className={cn("flex items-center", direction === "rtl" && "flex-row-reverse")}>
                  <Shield className={cn("w-4 h-4", direction === "rtl" ? "ml-2" : "mr-2")} />
                  {t("account.adminDashboard")}
                </Link>
              </Button>
            )}
            <Button variant="outline" onClick={handleSignOut} className={cn("border-destructive text-destructive hover:bg-destructive/10", direction === "rtl" && "flex-row-reverse")}>
              <LogOut className={cn("w-4 h-4", direction === "rtl" ? "ml-2" : "mr-2")} />
              {t("account.signOut")}
            </Button>
          </div>
        </div>

        {/* Guest Orders Claimed Alert */}
        {claimedOrders > 0 && (
          <Alert className="mb-6 border-green-500/30 bg-green-500/10">
            <Gift className="w-4 h-4 text-green-500" />
            <AlertDescription className="text-green-400">
              {t("account.ordersLinked").replace("{count}", claimedOrders.toString())}
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="wishlist" className={cn("gap-2", direction === "rtl" && "flex-row-reverse")}>
              <Heart className="w-4 h-4" />
              {t("account.wishlist")}
              {wishlistProducts.length > 0 && (
                <Badge variant="secondary" className={direction === "rtl" ? "mr-1" : "ml-1"}>
                  {wishlistProducts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="orders" className={cn("gap-2", direction === "rtl" && "flex-row-reverse")}>
              <Package className="w-4 h-4" />
              {t("account.orders")}
              {orders.length > 0 && (
                <Badge variant="secondary" className={direction === "rtl" ? "mr-1" : "ml-1"}>
                  {orders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="addresses" className={cn("gap-2", direction === "rtl" && "flex-row-reverse")}>
              <MapPin className="w-4 h-4" />
              {t("address.myAddresses")}
            </TabsTrigger>
            <TabsTrigger value="profile" className={cn("gap-2", direction === "rtl" && "flex-row-reverse")}>
              <User className="w-4 h-4" />
              {t("account.profile")}
            </TabsTrigger>
          </TabsList>

          {/* Wishlist Tab */}
          <TabsContent value="wishlist">
            <div className={cn("bg-card border border-border rounded-xl p-6", direction === "rtl" && "text-right")}>
              <h2 className="text-xl font-bold mb-6">{t("account.myWishlist")}</h2>
              
              {wishlistLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : wishlistProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">{t("account.wishlistEmpty")}</p>
                  <p className="text-muted-foreground mb-6">
                    {t("account.saveItemsHeart")}
                  </p>
                  <Button asChild className="btn-gradient">
                    <Link to="/shop">{t("cart.browseShop")}</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {wishlistProducts.map(product => (
                    <div key={product.id} className="relative">
                      <ProductCard product={product} />
                      <Button
                        size="icon"
                        variant="destructive"
                        className={cn(
                          "absolute top-3 w-8 h-8 z-10",
                          direction === "rtl" ? "left-3" : "right-3"
                        )}
                        onClick={() => removeFromWishlist(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <div className={cn("bg-card border border-border rounded-xl p-6", direction === "rtl" && "text-right")}>
              <h2 className="text-xl font-bold mb-6">{t("account.orderHistory")}</h2>
              
              {ordersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">{t("account.noOrdersYet")}</p>
                  <p className="text-muted-foreground mb-6">
                    {t("account.orderHistoryAppear")}
                  </p>
                  <Button asChild className="btn-gradient">
                    <Link to="/shop">{t("account.startShopping")}</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div
                      key={order.id}
                      className="border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
                    >
                      <div className={cn(
                        "flex flex-wrap items-center justify-between gap-4 mb-4",
                        direction === "rtl" && "flex-row-reverse"
                      )}>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {t("account.order")} #{order.id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString(direction === "rtl" ? "ar-SA" : "en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric"
                            })}
                          </p>
                        </div>
                        <div className={cn("flex items-center gap-3", direction === "rtl" && "flex-row-reverse")}>
                          <Badge
                            variant="outline"
                            className={cn("capitalize", statusColors[order.status])}
                          >
                            {order.status}
                          </Badge>
                          <span className="font-bold text-primary">
                            ${order.total_amount.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div className="border-t border-border pt-4">
                          <p className="text-sm text-muted-foreground mb-2">{t("account.items")}:</p>
                          <div className="space-y-2">
                            {order.items.map(item => (
                              <div
                                key={item.id}
                                className={cn(
                                  "flex items-center justify-between text-sm",
                                  direction === "rtl" && "flex-row-reverse"
                                )}
                              >
                                <span>
                                  {item.product_name} × {item.quantity}
                                </span>
                                <span className="text-muted-foreground">
                                  ${(item.product_price * item.quantity).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            <div className={cn("bg-card border border-border rounded-xl p-6", direction === "rtl" && "text-right")}>
              <AddressManager />
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className={cn("bg-card border border-border rounded-xl p-6", direction === "rtl" && "text-right")}>
              <h2 className="text-xl font-bold mb-6">{t("account.profileSettings")}</h2>
              
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="text-sm text-muted-foreground">{t("auth.email")}</label>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">{t("account.accountCreated")}</label>
                  <p className="font-medium">
                    {new Date(user.created_at).toLocaleDateString(direction === "rtl" ? "ar-SA" : "en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">{t("account.userId")}</label>
                  <p className="font-mono text-sm text-muted-foreground">{user.id}</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
