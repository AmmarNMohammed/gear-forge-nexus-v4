import { useState } from "react";
import { X, Plus, Minus, Trash2, ShoppingBag, Loader2, Tag, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCoupons } from "@/hooks/useCoupons";
import { useInventory } from "@/hooks/useInventory";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export function CartDrawer() {
  const { 
    isOpen, 
    closeCart, 
    getItemsWithProducts, 
    getCartTotal, 
    updateQuantity, 
    removeItem,
    clearCart 
  } = useCart();
  const { user } = useAuth();
  const { t, direction } = useLanguage();
  const { toast } = useToast();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoOpen, setPromoOpen] = useState(false);

  const { 
    isValidating, 
    appliedCoupon, 
    validateCoupon, 
    removeCoupon,
    getDiscountAmount 
  } = useCoupons();

  const items = getItemsWithProducts();
  const productIds = items.map(({ product }) => product.id);
  const { getMaxQuantity, checkAvailability } = useInventory(productIds);

  const subtotal = getCartTotal();
  const discountAmount = getDiscountAmount(subtotal);
  const total = subtotal - discountAmount;

  const handleApplyCoupon = async () => {
    const result = await validateCoupon(promoCode, subtotal);
    if (result.valid) {
      toast({
        title: t("cart.couponApplied"),
        description: `${result.coupon?.discountType === "percentage" 
          ? `${result.coupon?.discountValue}% off` 
          : `$${result.coupon?.discountValue} off`}`,
      });
      setPromoCode("");
    } else {
      toast({
        title: t("cart.invalidCoupon"),
        description: result.error || t("cart.couponNotValid"),
        variant: "destructive",
      });
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;

    setIsCheckingOut(true);
    try {
      // Check inventory availability
      const inventoryCheck = await checkAvailability(
        items.map(({ item, product }) => ({
          productId: product.id,
          quantity: item.quantity,
        }))
      );

      if (!inventoryCheck.allAvailable) {
        const unavailable = inventoryCheck.unavailableItems[0];
        toast({
          title: t("cart.insufficientStock"),
          description: `Only ${unavailable.stockQuantity} available for one of your items.`,
          variant: "destructive",
        });
        setIsCheckingOut(false);
        return;
      }

      const checkoutItems = items.map(({ item, product }) => ({
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        quantity: item.quantity,
      }));

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { 
          items: checkoutItems,
          customerEmail: user?.email,
          couponCode: appliedCoupon?.code,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout failed",
        description: error instanceof Error ? error.message : "Unable to start checkout",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm z-50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 h-full w-full max-w-md bg-card border-border shadow-2xl z-50 transition-transform duration-300 ease-out flex flex-col",
          direction === "rtl" ? "left-0 border-r" : "right-0 border-l",
          isOpen 
            ? "translate-x-0" 
            : direction === "rtl" ? "-translate-x-full" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className={cn("flex items-center justify-between p-4 border-b border-border", direction === "rtl" && "flex-row-reverse")}>
          <h2 className={cn("text-lg font-bold flex items-center gap-2", direction === "rtl" && "flex-row-reverse")}>
            <ShoppingBag className="w-5 h-5 text-primary" />
            {t("cart.title")}
            <span className="text-sm font-normal text-muted-foreground">
              ({items.length} {t("cart.items")})
            </span>
          </h2>
          <Button variant="ghost" size="icon" onClick={closeCart}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-lg font-medium mb-2">{t("cart.empty")}</p>
              <p className="text-sm text-muted-foreground mb-6">
                {t("cart.emptyDesc")}
              </p>
              <Button className="btn-gradient" onClick={closeCart} asChild>
                <Link to="/shop">{t("cart.browseShop")}</Link>
              </Button>
            </div>
          ) : (
            items.map(({ item, product }) => {
              const maxQty = getMaxQuantity(product.id);
              return (
                <div
                  key={item.productId}
                  className={cn("flex gap-4 p-3 bg-muted/30 rounded-lg border border-border", direction === "rtl" && "flex-row-reverse")}
                >
                  <Link 
                    to={`/product/${product.id}`} 
                    onClick={closeCart}
                    className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                  <div className={cn("flex-1 min-w-0", direction === "rtl" && "text-right")}>
                    <Link 
                      to={`/product/${product.id}`} 
                      onClick={closeCart}
                      className="font-medium line-clamp-1 hover:text-primary transition-colors"
                    >
                      {product.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{product.brand}</p>
                    <p className="text-sm font-bold text-primary mt-1">
                      ${product.price.toLocaleString()}
                    </p>
                    
                    <div className={cn("flex items-center justify-between mt-2", direction === "rtl" && "flex-row-reverse")}>
                      <div className={cn("flex items-center gap-2", direction === "rtl" && "flex-row-reverse")}>
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-7 h-7"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-7 h-7"
                          onClick={() => updateQuantity(item.productId, Math.min(item.quantity + 1, maxQty))}
                          disabled={item.quantity >= maxQty}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeItem(item.productId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {item.quantity >= maxQty && maxQty < 99 && (
                      <p className="text-xs text-destructive mt-1">{t("cart.maxAvailable")}: {maxQty}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className={cn("border-t border-border p-4 space-y-4", direction === "rtl" && "text-right")}>
            {/* Promo Code Section */}
            <Collapsible open={promoOpen} onOpenChange={setPromoOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className={cn("w-full justify-between p-0 h-auto font-normal text-muted-foreground hover:text-foreground", direction === "rtl" && "flex-row-reverse")}>
                  <span className={cn("flex items-center gap-2", direction === "rtl" && "flex-row-reverse")}>
                    <Tag className="w-4 h-4" />
                    {t("cart.promoCode")}
                  </span>
                  {promoOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                {appliedCoupon ? (
                  <div className={cn("flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/30", direction === "rtl" && "flex-row-reverse")}>
                    <div className={cn("flex items-center gap-2", direction === "rtl" && "flex-row-reverse")}>
                      <Tag className="w-4 h-4 text-primary" />
                      <span className="font-medium text-primary">{appliedCoupon.code}</span>
                      <span className="text-sm text-muted-foreground">
                        ({appliedCoupon.discountType === "percentage" 
                          ? `${appliedCoupon.discountValue}% off` 
                          : `$${appliedCoupon.discountValue} off`})
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-1 text-destructive hover:text-destructive"
                      onClick={removeCoupon}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className={cn("flex gap-2", direction === "rtl" && "flex-row-reverse")}>
                    <Input
                      placeholder={t("cart.enterCode")}
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      className="flex-1"
                    />
                    <Button 
                      variant="outline" 
                      onClick={handleApplyCoupon}
                      disabled={isValidating || !promoCode}
                    >
                      {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : t("cart.apply")}
                    </Button>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Totals */}
            <div className="space-y-2">
              <div className={cn("flex items-center justify-between text-sm", direction === "rtl" && "flex-row-reverse")}>
                <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
                {discountAmount > 0 && (
                <div className={cn("flex items-center justify-between text-sm text-secondary", direction === "rtl" && "flex-row-reverse")}>
                  <span>{t("cart.discount")}</span>
                  <span>-${discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className={cn("flex items-center justify-between pt-2 border-t border-border", direction === "rtl" && "flex-row-reverse")}>
                <span className="font-medium">{t("cart.total")}</span>
                <span className="text-xl font-bold text-gradient">
                  ${total.toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {t("cart.shippingNote")}
            </p>
            <Button 
              className="w-full btn-gradient h-12"
              onClick={handleCheckout}
              disabled={isCheckingOut}
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className={cn("w-4 h-4 animate-spin", direction === "rtl" ? "ml-2" : "mr-2")} />
                  {t("cart.processing")}
                </>
              ) : (
                t("cart.checkout")
              )}
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={closeCart}
                asChild
              >
                <Link to="/shop">{t("cart.continueShopping")}</Link>
              </Button>
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={clearCart}
              >
                {t("cart.clear")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
