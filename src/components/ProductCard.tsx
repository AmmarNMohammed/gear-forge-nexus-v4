import { Link } from "react-router-dom";
import { ShoppingCart, Heart, Star, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/hooks/useProducts";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useWishlist } from "@/hooks/useWishlist";
import { useInventory } from "@/hooks/useInventory";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addItem, openCart } = useCart();
  const { user } = useAuth();
  const { t, direction } = useLanguage();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { getStockStatus, getInventory } = useInventory([product.id]);
  const { toast } = useToast();
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const isWishlisted = isInWishlist(product.id);
  const stockStatus = getStockStatus(product.id);
  const inventory = getInventory(product.id);
  const isOutOfStock = stockStatus === "out-of-stock";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock) {
      toast({
        title: t("common.outOfStock"),
        description: "This item is currently unavailable.",
        variant: "destructive",
      });
      return;
    }
    addItem(product.id);
    openCart();
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: t("wishlist.signInRequired"),
        description: t("wishlist.signInDesc")
      });
      return;
    }

    setWishlistLoading(true);
    
    if (isWishlisted) {
      await removeFromWishlist(product.id);
      toast({
        title: t("wishlist.removed"),
        description: `${product.name}`
      });
    } else {
      await addToWishlist(product.id);
      toast({
        title: t("wishlist.added"),
        description: `${product.name}`
      });
    }
    
    setWishlistLoading(false);
  };

  const discount = product.originalPrice 
    ? Math.round((1 - product.price / product.originalPrice) * 100) 
    : 0;

  return (
    <Link
      to={`/product/${product.id}`}
      className={cn(
        "group relative block bg-card rounded-xl border border-border overflow-hidden card-glow transition-all duration-300 hover:-translate-y-1",
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Quick Actions */}
        <div className={cn(
          "absolute top-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300",
          direction === "rtl" ? "left-3 -translate-x-2 group-hover:translate-x-0" : "right-3 translate-x-2 group-hover:translate-x-0"
        )}>
          <Button
            size="icon"
            variant="secondary"
            className={cn(
              "w-9 h-9 bg-background/80 backdrop-blur-sm border-border",
              isWishlisted 
                ? "bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground" 
                : "hover:bg-primary hover:text-primary-foreground"
            )}
            onClick={handleWishlistToggle}
            disabled={wishlistLoading}
          >
            {wishlistLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Heart className={cn("w-4 h-4", isWishlisted && "fill-current")} />
            )}
          </Button>
        </div>

        {/* Badges */}
        <div className={cn("absolute top-3 flex flex-col gap-2", direction === "rtl" ? "right-3" : "left-3")}>
          {discount > 0 && (
            <Badge className="bg-secondary text-secondary-foreground font-semibold">
              -{discount}%
            </Badge>
          )}
          {product.hasRgb && (
            <Badge variant="outline" className="bg-background/80 backdrop-blur-sm border-primary/50 text-primary">
              <Sparkles className={cn("w-3 h-3", direction === "rtl" ? "ml-1" : "mr-1")} />
              RGB
            </Badge>
          )}
          {stockStatus === "low-stock" && inventory && (
            <Badge className="bg-destructive/20 text-destructive border-destructive/30">
              <AlertCircle className={cn("w-3 h-3", direction === "rtl" ? "ml-1" : "mr-1")} />
              {t("common.onlyLeft").replace("{count}", String(inventory.stockQuantity))}
            </Badge>
          )}
          {isOutOfStock && (
            <Badge className="bg-muted text-muted-foreground">
              {t("common.outOfStock")}
            </Badge>
          )}
        </div>

        {/* Add to Cart Button */}
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <Button 
            className={cn("w-full", isOutOfStock ? "bg-muted text-muted-foreground cursor-not-allowed" : "btn-neon")}
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            <ShoppingCart className={cn("w-4 h-4", direction === "rtl" ? "ml-2" : "mr-2")} />
            {isOutOfStock ? t("common.outOfStock") : t("common.addToCart")}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className={cn("p-4", direction === "rtl" && "text-right")}>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          {product.brand}
        </p>
        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        
        {/* Rating */}
        <div className={cn("flex items-center gap-1 mt-2", direction === "rtl" && "flex-row-reverse")}>
          <Star className="w-4 h-4 fill-primary text-primary" />
          <span className="text-sm font-medium">{product.rating}</span>
          <span className="text-xs text-muted-foreground">({product.reviews})</span>
        </div>

        {/* Price */}
        <div className={cn("flex items-center gap-2 mt-3", direction === "rtl" && "flex-row-reverse")}>
          <span className="text-lg font-bold text-gradient">
            ${product.price.toLocaleString()}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              ${product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
