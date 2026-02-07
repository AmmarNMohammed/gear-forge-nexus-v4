import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, SlidersHorizontal, Grid3X3, LayoutList, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/ProductCard";
import { useProducts, categories, brands } from "@/hooks/useProducts";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get("category") ? [searchParams.get("category")!] : []
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [showRgbOnly, setShowRgbOnly] = useState(false);
  const [sortBy, setSortBy] = useState("featured");

  const { products, isLoading } = useProducts();
  const { t, direction } = useLanguage();

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.brand.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Category
      if (selectedCategories.length > 0 && !selectedCategories.includes(product.category)) {
        return false;
      }

      // Brand
      if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) {
        return false;
      }

      // Price
      if (product.price < priceRange[0] || product.price > priceRange[1]) {
        return false;
      }

      // RGB
      if (showRgbOnly && !product.hasRgb) {
        return false;
      }

      return true;
    });

    // Sort
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return filtered;
  }, [products, searchQuery, selectedCategories, selectedBrands, priceRange, showRgbOnly, sortBy]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedBrands([]);
    setPriceRange([0, 5000]);
    setShowRgbOnly(false);
    setSortBy("featured");
  };

  const activeFilterCount = 
    selectedCategories.length + 
    selectedBrands.length + 
    (showRgbOnly ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 5000 ? 1 : 0);

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold mb-3">{t("shop.categories")}</h3>
        <div className="space-y-2">
          {categories.map(category => (
            <label key={category.id} className={cn("flex items-center gap-2 cursor-pointer", direction === "rtl" && "flex-row-reverse")}>
              <Checkbox
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => toggleCategory(category.id)}
              />
              <span className="text-sm">{category.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <h3 className="font-semibold mb-3">{t("shop.brands")}</h3>
        <div className="space-y-2">
          {brands.map(brand => (
            <label key={brand} className={cn("flex items-center gap-2 cursor-pointer", direction === "rtl" && "flex-row-reverse")}>
              <Checkbox
                checked={selectedBrands.includes(brand)}
                onCheckedChange={() => toggleBrand(brand)}
              />
              <span className="text-sm">{brand}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold mb-3">{t("shop.priceRange")}</h3>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={5000}
          step={100}
          className="mb-2"
        />
        <div className={cn("flex items-center justify-between text-sm text-muted-foreground", direction === "rtl" && "flex-row-reverse")}>
          <span>${priceRange[0]}</span>
          <span>${priceRange[1]}</span>
        </div>
      </div>

      {/* RGB Filter */}
      <div>
        <label className={cn("flex items-center gap-2 cursor-pointer", direction === "rtl" && "flex-row-reverse")}>
          <Checkbox
            checked={showRgbOnly}
            onCheckedChange={(checked) => setShowRgbOnly(checked as boolean)}
          />
          <span className="text-sm">{t("shop.rgbOnly")}</span>
        </label>
      </div>

      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          {t("shop.clearAllFilters")}
        </Button>
      )}
    </div>
  );

  const ProductSkeleton = () => (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-24" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-20 md:pt-24">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className={cn("mb-8", direction === "rtl" && "text-right")}>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="text-gradient">{t("shop.title")}</span> {t("shop.gamingGear")}
          </h1>
          <p className="text-muted-foreground">
            {isLoading ? t("shop.loadingProducts") : t("shop.productsAvailable").replace("{count}", String(filteredProducts.length))}
          </p>
        </div>

        <div className={cn("flex gap-8", direction === "rtl" && "flex-row-reverse")}>
          {/* Desktop Sidebar */}
          <aside className={cn("hidden lg:block w-64 flex-shrink-0", direction === "rtl" && "text-right")}>
            <div className="sticky top-24 bg-card border border-border rounded-xl p-6">
              <div className={cn("flex items-center justify-between mb-6", direction === "rtl" && "flex-row-reverse")}>
                <h2 className={cn("font-semibold flex items-center gap-2", direction === "rtl" && "flex-row-reverse")}>
                  <Filter className="w-4 h-4" />
                  {t("shop.filters")}
                </h2>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary">{activeFilterCount}</Badge>
                )}
              </div>
              <FilterContent />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className={cn("flex flex-wrap items-center gap-4 mb-6", direction === "rtl" && "flex-row-reverse")}>
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", direction === "rtl" ? "right-3" : "left-3")} />
                <Input
                  placeholder={t("shop.searchProducts")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn("bg-card border-border", direction === "rtl" ? "pr-10" : "pl-10")}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("absolute top-1/2 -translate-y-1/2 w-7 h-7", direction === "rtl" ? "left-1" : "right-1")}
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <SlidersHorizontal className={cn("w-4 h-4", direction === "rtl" ? "ml-2" : "mr-2")} />
                    {t("shop.filters")}
                    {activeFilterCount > 0 && (
                      <Badge className={cn(direction === "rtl" ? "mr-2" : "ml-2")} variant="secondary">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side={direction === "rtl" ? "right" : "left"} className="w-80">
                  <SheetHeader>
                    <SheetTitle>{t("shop.filters")}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-card border border-border rounded-lg px-3 py-2 text-sm"
              >
                <option value="featured">{t("shop.sortFeatured")}</option>
                <option value="price-low">{t("shop.sortPriceLow")}</option>
                <option value="price-high">{t("shop.sortPriceHigh")}</option>
                <option value="rating">{t("shop.sortRating")}</option>
                <option value="name">{t("shop.sortName")}</option>
              </select>

              {/* View Mode */}
              <div className="hidden sm:flex items-center gap-1 border border-border rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => setViewMode("list")}
                >
                  <LayoutList className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Active Filters */}
            {(selectedCategories.length > 0 || selectedBrands.length > 0 || showRgbOnly) && (
              <div className={cn("flex flex-wrap gap-2 mb-6", direction === "rtl" && "flex-row-reverse")}>
                {selectedCategories.map(cat => (
                  <Badge key={cat} variant="secondary" className="cursor-pointer" onClick={() => toggleCategory(cat)}>
                    {categories.find(c => c.id === cat)?.name}
                    <X className={cn("w-3 h-3", direction === "rtl" ? "mr-1" : "ml-1")} />
                  </Badge>
                ))}
                {selectedBrands.map(brand => (
                  <Badge key={brand} variant="secondary" className="cursor-pointer" onClick={() => toggleBrand(brand)}>
                    {brand}
                    <X className={cn("w-3 h-3", direction === "rtl" ? "mr-1" : "ml-1")} />
                  </Badge>
                ))}
                {showRgbOnly && (
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => setShowRgbOnly(false)}>
                    RGB
                    <X className={cn("w-3 h-3", direction === "rtl" ? "mr-1" : "ml-1")} />
                  </Badge>
                )}
              </div>
            )}

            {/* Products Grid */}
            {isLoading ? (
              <div
                className={cn(
                  "grid gap-6",
                  viewMode === "grid"
                    ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                    : "grid-cols-1"
                )}
              >
                {[...Array(6)].map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-lg font-medium mb-2">{t("shop.noProducts")}</p>
                <p className="text-muted-foreground mb-4">{t("shop.tryAdjusting")}</p>
                <Button variant="outline" onClick={clearFilters}>
                  {t("shop.clearFilters")}
                </Button>
              </div>
            ) : (
              <div
                className={cn(
                  "grid gap-6",
                  viewMode === "grid"
                    ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                    : "grid-cols-1"
                )}
              >
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
