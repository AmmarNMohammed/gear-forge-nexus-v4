import { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2, Loader2, Star, Layout, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Setup, SetupProduct } from "@/hooks/useSetups";
import { useProducts } from "@/hooks/useProducts";
import { ImageUpload } from "./ImageUpload";

const STYLES = ["minimal", "rgb", "streamer", "esports", "budget", "luxury"];

interface SetupFormData {
  id: string;
  name: string;
  description: string;
  image: string;
  totalPrice: number;
  style: string;
  isCurated: boolean;
  isFeatured: boolean;
  tags: string;
  products: SetupProduct[];
}

const defaultFormData: SetupFormData = {
  id: "",
  name: "",
  description: "",
  image: "",
  totalPrice: 0,
  style: "minimal",
  isCurated: false,
  isFeatured: false,
  tags: "",
  products: [],
};

export function AdminSetups() {
  const { toast } = useToast();
  const { products: allProducts, isLoading: productsLoading } = useProducts();
  const [setups, setSetups] = useState<Setup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingCurated, setTogglingCurated] = useState<string | null>(null);
  const [togglingFeatured, setTogglingFeatured] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSetup, setEditingSetup] = useState<Setup | null>(null);
  const [deletingSetup, setDeletingSetup] = useState<Setup | null>(null);
  const [formData, setFormData] = useState<SetupFormData>(defaultFormData);
  const [searchQuery, setSearchQuery] = useState("");
  const [productSearchQuery, setProductSearchQuery] = useState("");

  const fetchSetups = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("setups")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedSetups = (data || []).map((setup) => ({
        ...setup,
        products: (setup.products as unknown as SetupProduct[]) || [],
      }));

      setSetups(formattedSetups);
    } catch (error) {
      console.error("Error fetching setups:", error);
      toast({
        title: "Error",
        description: "Failed to load setups",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSetups();
  }, []);

  // Calculate total price from selected products
  const calculatedPrice = useMemo(() => {
    return formData.products.reduce((total, setupProduct) => {
      const product = allProducts.find((p) => p.id === setupProduct.productId);
      return total + (product?.price || 0) * setupProduct.quantity;
    }, 0);
  }, [formData.products, allProducts]);

  // Auto-update total price when products change
  useEffect(() => {
    setFormData((prev) => ({ ...prev, totalPrice: calculatedPrice }));
  }, [calculatedPrice]);

  const filteredSetups = setups.filter(
    (setup) =>
      setup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      setup.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      setup.style.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProducts = allProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(productSearchQuery.toLowerCase())
  );

  const generateId = (name: string) => {
    return `setup-${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
  };

  const openCreateDialog = () => {
    setEditingSetup(null);
    setFormData(defaultFormData);
    setProductSearchQuery("");
    setDialogOpen(true);
  };

  const openEditDialog = (setup: Setup) => {
    setEditingSetup(setup);
    setFormData({
      id: setup.id,
      name: setup.name,
      description: setup.description,
      image: setup.image,
      totalPrice: setup.total_price,
      style: setup.style,
      isCurated: setup.is_curated,
      isFeatured: setup.is_featured,
      tags: setup.tags.join(", "),
      products: setup.products,
    });
    setProductSearchQuery("");
    setDialogOpen(true);
  };

  const addProductToSetup = (productId: string) => {
    const existing = formData.products.find((p) => p.productId === productId);
    if (existing) {
      setFormData({
        ...formData,
        products: formData.products.map((p) =>
          p.productId === productId ? { ...p, quantity: p.quantity + 1 } : p
        ),
      });
    } else {
      setFormData({
        ...formData,
        products: [...formData.products, { productId, quantity: 1 }],
      });
    }
  };

  const removeProductFromSetup = (productId: string) => {
    setFormData({
      ...formData,
      products: formData.products.filter((p) => p.productId !== productId),
    });
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeProductFromSetup(productId);
      return;
    }
    setFormData({
      ...formData,
      products: formData.products.map((p) =>
        p.productId === productId ? { ...p, quantity } : p
      ),
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.description || !formData.image) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const setupData = {
        id: editingSetup ? formData.id : generateId(formData.name),
        name: formData.name,
        description: formData.description,
        image: formData.image,
        totalPrice: calculatedPrice,
        style: formData.style,
        isCurated: formData.isCurated,
        isFeatured: formData.isFeatured,
        tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
        products: formData.products,
      };

      const { error } = await supabase.functions.invoke("admin-manage-setups", {
        body: {
          action: editingSetup ? "update" : "create",
          setup: setupData,
        },
      });

      if (error) throw error;

      toast({
        title: editingSetup ? "Setup Updated" : "Setup Created",
        description: `${formData.name} has been ${editingSetup ? "updated" : "created"} successfully.`,
      });

      setDialogOpen(false);
      fetchSetups();
    } catch (error) {
      console.error("Error saving setup:", error);
      toast({
        title: "Error",
        description: "Failed to save setup",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSetup) return;

    try {
      const { error } = await supabase.functions.invoke("admin-manage-setups", {
        body: {
          action: "delete",
          setup: { id: deletingSetup.id },
        },
      });

      if (error) throw error;

      toast({
        title: "Setup Deleted",
        description: `${deletingSetup.name} has been deleted.`,
      });

      setDeleteDialogOpen(false);
      setDeletingSetup(null);
      fetchSetups();
    } catch (error) {
      console.error("Error deleting setup:", error);
      toast({
        title: "Error",
        description: "Failed to delete setup",
        variant: "destructive",
      });
    }
  };

  const toggleCurated = async (setup: Setup) => {
    setTogglingCurated(setup.id);
    try {
      const { error } = await supabase.functions.invoke("admin-manage-setups", {
        body: {
          action: "update",
          setup: {
            id: setup.id,
            name: setup.name,
            description: setup.description,
            image: setup.image,
            totalPrice: setup.total_price,
            style: setup.style,
            isCurated: !setup.is_curated,
            isFeatured: setup.is_featured,
            tags: setup.tags,
            products: setup.products,
          },
        },
      });

      if (error) throw error;

      toast({
        title: setup.is_curated ? "Removed from Curated" : "Added to Curated",
        description: `${setup.name} is ${setup.is_curated ? "no longer" : "now"} in curated setups.`,
      });

      fetchSetups();
    } catch (error) {
      console.error("Error toggling curated:", error);
      toast({
        title: "Error",
        description: "Failed to update setup",
        variant: "destructive",
      });
    } finally {
      setTogglingCurated(null);
    }
  };

  const toggleFeatured = async (setup: Setup) => {
    setTogglingFeatured(setup.id);
    try {
      const { error } = await supabase.functions.invoke("admin-manage-setups", {
        body: {
          action: "update",
          setup: {
            id: setup.id,
            name: setup.name,
            description: setup.description,
            image: setup.image,
            totalPrice: setup.total_price,
            style: setup.style,
            isCurated: setup.is_curated,
            isFeatured: !setup.is_featured,
            tags: setup.tags,
            products: setup.products,
          },
        },
      });

      if (error) throw error;

      toast({
        title: setup.is_featured ? "Removed from Explore" : "Added to Explore",
        description: `${setup.name} is ${setup.is_featured ? "no longer" : "now"} in explore setups.`,
      });

      fetchSetups();
    } catch (error) {
      console.error("Error toggling featured:", error);
      toast({
        title: "Error",
        description: "Failed to update setup",
        variant: "destructive",
      });
    } finally {
      setTogglingFeatured(null);
    }
  };

  if (isLoading || productsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Setups ({setups.length})</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="btn-gradient">
              <Plus className="w-4 h-4 mr-2" />
              Add Setup
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSetup ? "Edit Setup" : "Create New Setup"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. RGB Beast"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this setup..."
                />
              </div>

              <ImageUpload
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
                label="Setup Image *"
                folder="setups"
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Total Price (auto-calculated)</Label>
                  <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted text-foreground flex items-center font-bold">
                    ${calculatedPrice.toLocaleString()}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="style">Style</Label>
                  <Select
                    value={formData.style}
                    onValueChange={(value) => setFormData({ ...formData, style: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STYLES.map((style) => (
                        <SelectItem key={style} value={style}>
                          {style.charAt(0).toUpperCase() + style.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Products Selection */}
              <div className="grid gap-2">
                <Label>Products in Setup</Label>
                
                {/* Selected Products */}
                {formData.products.length > 0 && (
                  <div className="space-y-2 p-3 border border-border rounded-lg bg-card mb-2">
                    {formData.products.map((setupProduct) => {
                      const product = allProducts.find((p) => p.id === setupProduct.productId);
                      if (!product) return null;
                      return (
                        <div key={setupProduct.productId} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-10 h-10 rounded object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder.svg";
                              }}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{product.name}</p>
                              <p className="text-xs text-muted-foreground">${product.price.toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="1"
                              value={setupProduct.quantity}
                              onChange={(e) =>
                                updateProductQuantity(setupProduct.productId, parseInt(e.target.value) || 1)
                              }
                              className="w-16 h-8 text-center"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeProductFromSetup(setupProduct.productId)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Product Search & Add */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products to add..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {productSearchQuery && (
                  <div className="max-h-48 overflow-y-auto border border-border rounded-lg">
                    {filteredProducts
                      .filter((p) => !formData.products.some((sp) => sp.productId === p.id))
                      .slice(0, 10)
                      .map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer"
                          onClick={() => {
                            addProductToSetup(product.id);
                            setProductSearchQuery("");
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-8 h-8 rounded object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder.svg";
                              }}
                            />
                            <div>
                              <p className="text-sm font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.brand}</p>
                            </div>
                          </div>
                          <span className="text-sm font-medium">${product.price.toLocaleString()}</span>
                        </div>
                      ))}
                    {filteredProducts.filter((p) => !formData.products.some((sp) => sp.productId === p.id)).length === 0 && (
                      <div className="p-3 text-center text-muted-foreground text-sm">
                        No products found
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="RGB Lighting, Premium, Show-Off"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isCurated"
                    checked={formData.isCurated}
                    onCheckedChange={(checked) => setFormData({ ...formData, isCurated: checked })}
                  />
                  <Label htmlFor="isCurated">Show in Curated Setups</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                  />
                  <Label htmlFor="isFeatured">Show in Explore More</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="btn-gradient">
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingSetup ? "Update" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search setups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4">
        {filteredSetups.map((setup) => (
          <div
            key={setup.id}
            className="flex items-center gap-4 p-4 bg-card rounded-lg border border-border"
          >
            <img
              src={setup.image}
              alt={setup.name}
              className="w-24 h-16 object-cover rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{setup.name}</h3>
              <p className="text-sm text-muted-foreground truncate">{setup.description}</p>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline">{setup.style}</Badge>
                <Badge variant="secondary">${setup.total_price.toLocaleString()}</Badge>
                <Badge variant="outline" className="text-xs">
                  {setup.products.length} products
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {setup.is_curated && (
                <Badge className="bg-primary/20 text-primary border-primary/30">Curated</Badge>
              )}
              {setup.is_featured && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Explore</Badge>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant={setup.is_curated ? "default" : "outline"}
                onClick={() => toggleCurated(setup)}
                disabled={togglingCurated === setup.id}
                title={setup.is_curated ? "Remove from Curated" : "Add to Curated"}
              >
                {togglingCurated === setup.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Star className={`w-4 h-4 ${setup.is_curated ? "fill-current" : ""}`} />
                )}
              </Button>
              <Button
                size="sm"
                variant={setup.is_featured ? "default" : "outline"}
                onClick={() => toggleFeatured(setup)}
                disabled={togglingFeatured === setup.id}
                title={setup.is_featured ? "Remove from Explore" : "Add to Explore"}
              >
                {togglingFeatured === setup.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Layout className={`w-4 h-4 ${setup.is_featured ? "fill-current" : ""}`} />
                )}
              </Button>
              <Button size="sm" variant="outline" onClick={() => openEditDialog(setup)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setDeletingSetup(setup);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

        {filteredSetups.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {searchQuery ? "No setups match your search." : "No setups yet. Click \"Add Setup\" to create one."}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Setup</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingSetup?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
