import { Link } from "react-router-dom";
import { ShoppingCart, ArrowRight, ArrowLeft, Package, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Setup } from "@/hooks/useSetups";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useProducts, Product } from "@/hooks/useProducts";
import { useInventory } from "@/hooks/useInventory";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SetupCardProps {
  setup: Setup;
  className?: string;
  showProducts?: boolean;
}

const styleColors: Record<string, string> = {
  minimal: "from-blue-500/20 to-cyan-500/20",
  rgb: "from-pink-500/20 to-purple-500/20",
  streamer: "from-green-500/20 to-emerald-500/20",
  esports: "from-orange-500/20 to-red-500/20",
  budget: "from-yellow-500/20 to-amber-500/20",
  luxury: "from-amber-500/20 to-yellow-500/20"
};

const styleBadgeColors: Record<string, string> = {
  minimal: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  rgb: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  streamer: "bg-green-500/20 text-green-400 border-green-500/30",
  esports: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  budget: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  luxury: "bg-amber-500/20 text-amber-400 border-amber-500/30"
};

export function SetupCard({ setup, className, showProducts = false }: SetupCardProps) {
  const { addItem, openCart } = useCart();
  const { t, direction } = useLanguage();
  const { products, getProductById } = useProducts();
  const productIds = setup.products.map(p => p.productId);
  const { getStockStatus, getMaxQuantity } = useInventory(productIds);

  // Get actual product details for this setup
  const setupProductsWithDetails = setup.products
    .map(sp => {
      const product = getProductById(sp.productId);
      return product ? { ...sp, product } : null;
    })
    .filter((item): item is { productId: string; quantity: number; product: Product } => item !== null);

  const handleAddAllToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (setupProductsWithDetails.length === 0) {
      toast.error("No products found in this setup");
      return;
    }

    let addedCount = 0;
    let skippedCount = 0;

    setupProductsWithDetails.forEach(({ productId, quantity, product }) => {
      const stockStatus = getStockStatus(productId);
      const maxQty = getMaxQuantity(productId);
      
      if (stockStatus === "out-of-stock") {
        skippedCount++;
        return;
      }

      const qtyToAdd = Math.min(quantity, maxQty);
      if (qtyToAdd > 0) {
        addItem(productId, qtyToAdd);
        addedCount++;
      } else {
        skippedCount++;
      }
    });

    if (addedCount > 0) {
      toast.success(`Added ${addedCount} product${addedCount > 1 ? 's' : ''} to cart`);
      openCart();
    }
    
    if (skippedCount > 0) {
      toast.warning(`${skippedCount} product${skippedCount > 1 ? 's' : ''} unavailable`);
    }
  };

  const availableProducts = setupProductsWithDetails.filter(
    ({ productId }) => getStockStatus(productId) !== "out-of-stock"
  );

  const ArrowIcon = direction === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <div
      className={cn(
        "group relative block bg-card rounded-xl border border-border overflow-hidden card-glow transition-all duration-300 hover:-translate-y-1",
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={setup.image}
          alt={setup.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.svg";
          }}
        />
        
        {/* Gradient Overlay */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t opacity-60",
          styleColors[setup.style] || "from-primary/20 to-secondary/20"
        )} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        {/* Style Badge */}
        <div className={cn("absolute top-4 flex gap-2", direction === "rtl" ? "right-4 flex-row-reverse" : "left-4")}>
          <Badge 
            variant="outline" 
            className={cn(
              "uppercase font-semibold tracking-wider",
              styleBadgeColors[setup.style]
            )}
          >
            {setup.style}
          </Badge>
          {setupProductsWithDetails.length > 0 && (
            <Badge variant="secondary" className="bg-background/80">
              <Package className={cn("w-3 h-3", direction === "rtl" ? "ml-1" : "mr-1")} />
              {setupProductsWithDetails.length} {t("setups.items")}
            </Badge>
          )}
        </div>

        {/* Content Overlay */}
        <div className={cn("absolute bottom-0 left-0 right-0 p-4 md:p-6", direction === "rtl" && "text-right")}>
          <h3 className="text-xl md:text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
            {setup.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {setup.description}
          </p>
          
          {/* Tags */}
          <div className={cn("flex flex-wrap gap-2 mb-4", direction === "rtl" && "flex-row-reverse")}>
            {setup.tags.slice(0, 3).map(tag => (
              <span 
                key={tag}
                className="text-xs px-2 py-1 bg-muted/50 rounded-full text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Price and Actions */}
          <div className={cn("flex items-center justify-between", direction === "rtl" && "flex-row-reverse")}>
            <div className={direction === "rtl" ? "text-right" : ""}>
              <p className="text-xs text-muted-foreground">{t("setups.completeSetup")}</p>
              <p className="text-2xl font-bold text-gradient">
                ${setup.total_price.toLocaleString()}
              </p>
            </div>
            <div className={cn("flex gap-2", direction === "rtl" && "flex-row-reverse")}>
              <Button 
                size="sm" 
                className="btn-neon"
                onClick={handleAddAllToCart}
                disabled={availableProducts.length === 0}
              >
                <ShoppingCart className={cn("w-4 h-4", direction === "rtl" ? "ml-2" : "mr-2")} />
                {t("setups.addAll")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-primary hover:bg-primary/10"
                asChild
              >
                <Link to="/setups">
                  <ArrowIcon className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Products List (when showProducts is true) */}
      {showProducts && setupProductsWithDetails.length > 0 && (
        <div className={cn("p-4 border-t border-border bg-muted/30", direction === "rtl" && "text-right")}>
          <h4 className={cn("text-sm font-semibold mb-3 flex items-center gap-2", direction === "rtl" && "flex-row-reverse")}>
            <Package className="w-4 h-4" />
            {t("setups.includedProducts")}
          </h4>
          <div className="space-y-2">
            {setupProductsWithDetails.map(({ productId, quantity, product }) => {
              const stockStatus = getStockStatus(productId);
              return (
                <div 
                  key={productId}
                  className={cn("flex items-center gap-3 p-2 rounded-lg bg-background/50", direction === "rtl" && "flex-row-reverse")}
                >
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-10 h-10 object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                  <div className={cn("flex-1 min-w-0", direction === "rtl" && "text-right")}>
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("setups.qty")}: {quantity} × ${product.price.toLocaleString()}
                    </p>
                  </div>
                  {stockStatus === "out-of-stock" && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className={cn("w-3 h-3", direction === "rtl" ? "ml-1" : "mr-1")} />
                      {t("common.outOfStock")}
                    </Badge>
                  )}
                  {stockStatus === "low-stock" && (
                    <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-400">
                      {t("setups.lowStock")}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
