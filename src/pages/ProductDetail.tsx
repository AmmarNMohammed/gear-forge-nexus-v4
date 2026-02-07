import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ShoppingCart, Heart, Share2, Star, Check, Truck, Shield, RotateCcw, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useInventory } from "@/hooks/useInventory";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function ProductDetail() {
  const { id } = useParams();
  const { getProductById, getProductsByCategory, isLoading } = useProducts();
  const product = getProductById(id || "");
  const { addItem, openCart } = useCart();
  const { t, direction } = useLanguage();
  const { toast } = useToast();
  const { getStockStatus, getInventory, getMaxQuantity } = useInventory(product ? [product.id] : []);
  const [quantity, setQuantity] = useState(1);

  const ArrowBackIcon = direction === "rtl" ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 md:pt-24">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-6 w-32 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-6">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-48" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t("product.notFound")}</h1>
          <Button asChild>
            <Link to="/shop">{t("product.backToShop")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const relatedProducts = getProductsByCategory(product.category)
    .filter(p => p.id !== product.id)
    .slice(0, 4);

  const stockStatus = getStockStatus(product.id);
  const inventory = getInventory(product.id);
  const maxQty = getMaxQuantity(product.id);
  const isOutOfStock = stockStatus === "out-of-stock";

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast({
        title: t("common.outOfStock"),
        description: "This item is currently unavailable.",
        variant: "destructive",
      });
      return;
    }
    addItem(product.id, quantity);
    openCart();
  };

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen pt-20 md:pt-24">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className={cn("mb-8", direction === "rtl" && "text-right")}>
          <Link
            to="/shop"
            className={cn("inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors", direction === "rtl" && "flex-row-reverse")}
          >
            <ArrowBackIcon className="w-4 h-4" />
            {t("product.backToShop")}
          </Link>
        </div>

        {/* Product Section */}
        <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16", direction === "rtl" && "lg:grid-flow-dense")}>
          {/* Images */}
          <div className={cn("space-y-4", direction === "rtl" && "lg:col-start-2")}>
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-card border border-border">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
              {discount > 0 && (
                <Badge className={cn("absolute top-4 bg-secondary text-secondary-foreground font-semibold text-lg px-3 py-1", direction === "rtl" ? "right-4" : "left-4")}>
                  -{discount}%
                </Badge>
              )}
              {product.hasRgb && (
                <Badge variant="outline" className={cn("absolute top-4 bg-background/80 backdrop-blur-sm border-primary/50 text-primary", direction === "rtl" ? "left-4" : "right-4")}>
                  <Sparkles className={cn("w-3 h-3", direction === "rtl" ? "ml-1" : "mr-1")} />
                  RGB
                </Badge>
              )}
            </div>
          </div>

          {/* Details */}
          <div className={cn("space-y-6", direction === "rtl" && "lg:col-start-1 text-right")}>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
                {product.brand}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{product.name}</h1>
              
              {/* Rating */}
              <div className={cn("flex items-center gap-2 mb-4", direction === "rtl" && "flex-row-reverse")}>
                <div className={cn("flex items-center gap-1", direction === "rtl" && "flex-row-reverse")}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-5 h-5",
                        i < Math.floor(product.rating)
                          ? "fill-primary text-primary"
                          : "text-muted-foreground"
                      )}
                    />
                  ))}
                </div>
                <span className="font-medium">{product.rating}</span>
                <span className="text-muted-foreground">({product.reviews} {t("common.reviews")})</span>
              </div>

              <p className="text-muted-foreground">{product.description}</p>
            </div>

            {/* Price */}
            <div className={cn("flex items-baseline gap-3", direction === "rtl" && "flex-row-reverse")}>
              <span className="text-4xl font-bold text-gradient">
                ${product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-xl text-muted-foreground line-through">
                  ${product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className={cn("flex items-center gap-2", direction === "rtl" && "flex-row-reverse")}>
              {isOutOfStock ? (
                <>
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <span className="text-destructive font-medium">{t("common.outOfStock")}</span>
                </>
              ) : stockStatus === "low-stock" && inventory ? (
                <>
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <span className="text-destructive font-medium">{t("common.onlyLeft").replace("{count}", String(inventory.stockQuantity))}</span>
                </>
              ) : inventory?.trackInventory ? (
                <>
                  <Check className="w-5 h-5 text-secondary" />
                  <span className="text-secondary font-medium">{t("common.inStock")} ({inventory.stockQuantity} {t("common.available")})</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 text-secondary" />
                  <span className="text-secondary font-medium">{t("common.inStock")}</span>
                </>
              )}
            </div>

            {/* Quantity & Add to Cart */}
            <div className={cn("flex flex-wrap items-center gap-4", direction === "rtl" && "flex-row-reverse")}>
              <div className={cn("flex items-center border border-border rounded-lg", direction === "rtl" && "flex-row-reverse")}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                >
                  -
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.min(quantity + 1, maxQty))}
                  disabled={quantity >= maxQty || isOutOfStock}
                >
                  +
                </Button>
              </div>

              <Button
                className={cn("flex-1 h-12", isOutOfStock ? "bg-muted text-muted-foreground" : "btn-gradient")}
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                <ShoppingCart className={cn("w-5 h-5", direction === "rtl" ? "ml-2" : "mr-2")} />
                {isOutOfStock ? t("common.outOfStock") : t("common.addToCart")}
              </Button>

              <Button variant="outline" size="icon" className="h-12 w-12 border-border">
                <Heart className="w-5 h-5" />
              </Button>

              <Button variant="outline" size="icon" className="h-12 w-12 border-border">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
            
            {quantity >= maxQty && maxQty < 99 && !isOutOfStock && (
              <p className="text-sm text-destructive">{t("product.maxQuantity")}</p>
            )}

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
              <div className="text-center">
                <Truck className="w-6 h-6 mx-auto text-primary mb-2" />
                <p className="text-sm font-medium">{t("product.freeShipping")}</p>
                <p className="text-xs text-muted-foreground">{t("product.freeShippingDesc")}</p>
              </div>
              <div className="text-center">
                <Shield className="w-6 h-6 mx-auto text-primary mb-2" />
                <p className="text-sm font-medium">{t("product.warranty")}</p>
                <p className="text-xs text-muted-foreground">{t("product.warrantyFull")}</p>
              </div>
              <div className="text-center">
                <RotateCcw className="w-6 h-6 mx-auto text-primary mb-2" />
                <p className="text-sm font-medium">{t("product.returns")}</p>
                <p className="text-xs text-muted-foreground">{t("product.easyReturns")}</p>
              </div>
            </div>

            {/* Tags */}
            {product.tags && (
              <div className={cn("flex flex-wrap gap-2 pt-4", direction === "rtl" && "flex-row-reverse")}>
                {product.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="border-border">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="specs" className="mb-16">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="specs">{t("product.specifications")}</TabsTrigger>
            <TabsTrigger value="reviews">{t("product.reviewsTab")}</TabsTrigger>
            <TabsTrigger value="shipping">{t("product.shipping")}</TabsTrigger>
          </TabsList>

          <TabsContent value="specs" className="mt-6">
            <div className={cn("bg-card border border-border rounded-xl p-6", direction === "rtl" && "text-right")}>
              {product.specs ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(product.specs).map(([key, value]) => (
                    <div key={key} className={cn("flex justify-between py-3 border-b border-border last:border-0", direction === "rtl" && "flex-row-reverse")}>
                      <span className="text-muted-foreground">{key}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">{t("product.noSpecs")}</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <div className={cn("bg-card border border-border rounded-xl p-6", direction === "rtl" && "text-right")}>
              <p className="text-muted-foreground">{t("product.reviewsComing")}</p>
            </div>
          </TabsContent>

          <TabsContent value="shipping" className="mt-6">
            <div className={cn("bg-card border border-border rounded-xl p-6 space-y-4", direction === "rtl" && "text-right")}>
              <div>
                <h3 className="font-semibold mb-2">{t("product.freeShipping")}</h3>
                <p className="text-muted-foreground">{t("product.freeShippingInfo")}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">{t("product.expressDelivery")}</h3>
                <p className="text-muted-foreground">{t("product.expressDeliveryInfo")}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">{t("product.internationalShipping")}</h3>
                <p className="text-muted-foreground">{t("product.internationalInfo")}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className={direction === "rtl" ? "text-right" : ""}>
            <h2 className="text-2xl font-bold mb-6">{t("product.relatedProducts")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
