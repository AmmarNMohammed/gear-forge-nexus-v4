import { useState, useEffect } from "react";
import { Package, Loader2, Plus, Pencil, Trash2, X, Save, Star, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCategories } from "@/hooks/useCategories";
import { useBrands } from "@/hooks/useBrands";
import { ProductImageUpload } from "./ProductImageUpload";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  image: string;
  category: string;
  brand: string;
  rating: number;
  reviews: number;
  in_stock: boolean;
  has_rgb: boolean;
  featured: boolean;
  specs: Record<string, string>;
  tags: string[];
}

const defaultProduct: Omit<Product, "id"> = {
  name: "",
  description: "",
  price: 0,
  original_price: null,
  image: "",
  category: "pcs",
  brand: "NexusForge",
  rating: 0,
  reviews: 0,
  in_stock: true,
  has_rgb: false,
  featured: false,
  specs: {},
  tags: [],
};

export function AdminProducts() {
  const { toast } = useToast();
  const { categories } = useCategories();
  const { brands } = useBrands();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingFeatured, setTogglingFeatured] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Omit<Product, "id"> & { id?: string }>(defaultProduct);
  const [tagsInput, setTagsInput] = useState("");
  const [specsInput, setSpecsInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-manage-products", {
        body: { action: "list" },
      });

      if (error) throw error;
      setProducts(data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFeatured = async (product: Product) => {
    setTogglingFeatured(product.id);
    try {
      const { error } = await supabase.functions.invoke("admin-manage-products", {
        body: {
          action: "update",
          product: {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            originalPrice: product.original_price,
            image: product.image,
            category: product.category,
            brand: product.brand,
            rating: product.rating,
            reviews: product.reviews,
            inStock: product.in_stock,
            hasRgb: product.has_rgb,
            featured: !product.featured,
            specs: product.specs,
            tags: product.tags,
          },
        },
      });

      if (error) throw error;

      toast({
        title: product.featured ? "Removed from Trending" : "Added to Trending",
        description: `${product.name} is ${product.featured ? "no longer" : "now"} a trending product.`,
      });

      fetchProducts();
    } catch (error) {
      console.error("Error toggling featured:", error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    } finally {
      setTogglingFeatured(null);
    }
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    setFormData({
      ...defaultProduct,
      category: categories[0]?.slug || "pcs",
      brand: brands[0]?.name || "NexusForge",
    });
    setTagsInput("");
    setSpecsInput("");
    setDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      original_price: product.original_price,
      image: product.image,
      category: product.category,
      brand: product.brand,
      rating: product.rating,
      reviews: product.reviews,
      in_stock: product.in_stock,
      has_rgb: product.has_rgb,
      featured: product.featured,
      specs: product.specs,
      tags: product.tags,
    });
    setTagsInput(product.tags?.join(", ") || "");
    setSpecsInput(
      Object.entries(product.specs || {})
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n")
    );
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.description || !formData.price) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Parse tags
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      // Parse specs
      const specs: Record<string, string> = {};
      specsInput.split("\n").forEach((line) => {
        const [key, ...valueParts] = line.split(":");
        if (key && valueParts.length) {
          specs[key.trim()] = valueParts.join(":").trim();
        }
      });

      const productData = {
        id: editingProduct ? editingProduct.id : `product-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        price: formData.price,
        originalPrice: formData.original_price,
        image: formData.image,
        category: formData.category,
        brand: formData.brand,
        rating: formData.rating,
        reviews: formData.reviews,
        inStock: formData.in_stock,
        hasRgb: formData.has_rgb,
        featured: formData.featured,
        specs,
        tags,
      };

      const { error } = await supabase.functions.invoke("admin-manage-products", {
        body: {
          action: editingProduct ? "update" : "create",
          product: productData,
        },
      });

      if (error) throw error;

      toast({
        title: editingProduct ? "Product Updated" : "Product Created",
        description: `${formData.name} has been ${editingProduct ? "updated" : "created"} successfully.`,
      });

      setDialogOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.functions.invoke("admin-manage-products", {
        body: {
          action: "delete",
          productId: productToDelete.id,
        },
      });

      if (error) throw error;

      toast({
        title: "Product Deleted",
        description: `${productToDelete.name} has been deleted.`,
      });

      setDeleteDialogOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Products ({products.length})
          </CardTitle>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="flex flex-wrap items-center gap-4 p-4 border border-border rounded-lg hover:border-primary/30 transition-colors"
              >
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="w-16 h-16 rounded-lg object-cover bg-muted"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />

                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{product.name}</h3>
                    {product.featured && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {product.brand} • {product.category}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-primary">${product.price.toLocaleString()}</p>
                  {product.original_price && (
                    <p className="text-sm text-muted-foreground line-through">
                      ${product.original_price.toLocaleString()}
                    </p>
                  )}
                </div>

                <Badge variant={product.in_stock ? "secondary" : "destructive"}>
                  {product.in_stock ? "In Stock" : "Out of Stock"}
                </Badge>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={product.featured ? "default" : "outline"}
                    onClick={() => toggleFeatured(product)}
                    disabled={togglingFeatured === product.id}
                    title={product.featured ? "Remove from Trending" : "Add to Trending"}
                  >
                    {togglingFeatured === product.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Star className={`w-4 h-4 ${product.featured ? "fill-current" : ""}`} />
                    )}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(product)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setProductToDelete(product);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery ? "No products match your search." : "No products found. Click \"Add Product\" to create one."}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Product name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Select
                  value={formData.brand}
                  onValueChange={(value) => setFormData({ ...formData, brand: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.name}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="originalPrice">Original Price</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  min="0"
                  value={formData.original_price || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      original_price: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  placeholder="For sale items"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.slug}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <ProductImageUpload
              value={formData.image}
              onChange={(url) => setFormData({ ...formData, image: url })}
            />

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Gaming, RGB, High-end"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specs">Specifications (one per line, key: value)</Label>
              <Textarea
                id="specs"
                value={specsInput}
                onChange={(e) => setSpecsInput(e.target.value)}
                placeholder="CPU: Intel i9&#10;GPU: RTX 4090&#10;RAM: 64GB"
                rows={4}
              />
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="inStock"
                  checked={formData.in_stock}
                  onCheckedChange={(checked) => setFormData({ ...formData, in_stock: checked })}
                />
                <Label htmlFor="inStock">In Stock</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="hasRgb"
                  checked={formData.has_rgb}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_rgb: checked })}
                />
                <Label htmlFor="hasRgb">Has RGB</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
                <Label htmlFor="featured">Featured</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingProduct ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
