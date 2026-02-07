import { useState, useEffect } from "react";
import { Package, Loader2, Save, AlertCircle, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";

interface InventoryItem {
  id: string;
  product_id: string;
  stock_quantity: number;
  low_stock_threshold: number;
  track_inventory: boolean;
  updated_at: string;
}

export function AdminInventory() {
  const { toast } = useToast();
  const { products, isLoading: productsLoading } = useProducts();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, { quantity: number; threshold: number; track: boolean }>>({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-update-inventory", {
        body: { action: "list" },
      });

      if (error) throw error;

      const inventoryData = data.inventory || [];
      setInventory(inventoryData);
      
      // Initialize edit values when products are available
      if (products.length > 0) {
        const values: Record<string, { quantity: number; threshold: number; track: boolean }> = {};
        products.forEach(product => {
          const inv = inventoryData.find((i: InventoryItem) => i.product_id === product.id);
          values[product.id] = {
            quantity: inv?.stock_quantity ?? 50,
            threshold: inv?.low_stock_threshold ?? 5,
            track: inv?.track_inventory ?? true,
          };
        });
        setEditValues(values);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast({
        title: "Error",
        description: "Failed to load inventory",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update edit values when products change
  useEffect(() => {
    if (products.length > 0 && inventory.length >= 0) {
      const values: Record<string, { quantity: number; threshold: number; track: boolean }> = {};
      products.forEach(product => {
        const inv = inventory.find((i: InventoryItem) => i.product_id === product.id);
        values[product.id] = {
          quantity: inv?.stock_quantity ?? 50,
          threshold: inv?.low_stock_threshold ?? 5,
          track: inv?.track_inventory ?? true,
        };
      });
      setEditValues(values);
    }
  }, [products, inventory]);

  const handleSave = async (productId: string) => {
    const values = editValues[productId];
    if (!values) return;

    setSaving(productId);
    try {
      const { error } = await supabase.functions.invoke("admin-update-inventory", {
        body: {
          action: "update",
          updates: [{
            productId,
            stockQuantity: values.quantity,
            lowStockThreshold: values.threshold,
            trackInventory: values.track,
          }],
        },
      });

      if (error) throw error;

      toast({
        title: "Inventory updated",
        description: "Stock levels saved successfully.",
      });
      
      fetchInventory();
    } catch (error) {
      console.error("Error updating inventory:", error);
      toast({
        title: "Error",
        description: "Failed to update inventory",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const getStockStatus = (productId: string) => {
    const values = editValues[productId];
    if (!values || !values.track) return "not-tracked";
    if (values.quantity <= 0) return "out-of-stock";
    if (values.quantity <= values.threshold) return "low-stock";
    return "in-stock";
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading || productsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Inventory Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredProducts.map((product) => {
            const values = editValues[product.id];
            const status = getStockStatus(product.id);
            
            return (
              <div
                key={product.id}
                className="flex flex-wrap items-center gap-4 p-4 border border-border rounded-lg"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-16 h-16 rounded-lg object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
                
                <div className="flex-1 min-w-[200px]">
                  <h3 className="font-medium">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{product.brand}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Track:</span>
                  <Switch
                    checked={values?.track ?? true}
                    onCheckedChange={(checked) => 
                      setEditValues(prev => ({
                        ...prev,
                        [product.id]: { ...prev[product.id], track: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Stock:</span>
                  <Input
                    type="number"
                    min="0"
                    value={values?.quantity ?? 0}
                    onChange={(e) =>
                      setEditValues(prev => ({
                        ...prev,
                        [product.id]: { ...prev[product.id], quantity: parseInt(e.target.value) || 0 }
                      }))
                    }
                    className="w-20"
                    disabled={!values?.track}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Low threshold:</span>
                  <Input
                    type="number"
                    min="0"
                    value={values?.threshold ?? 5}
                    onChange={(e) =>
                      setEditValues(prev => ({
                        ...prev,
                        [product.id]: { ...prev[product.id], threshold: parseInt(e.target.value) || 0 }
                      }))
                    }
                    className="w-20"
                    disabled={!values?.track}
                  />
                </div>

                <Badge
                  variant="outline"
                  className={cn(
                    status === "in-stock" && "bg-secondary/20 text-secondary border-secondary/30",
                    status === "low-stock" && "bg-destructive/20 text-destructive border-destructive/30",
                    status === "out-of-stock" && "bg-muted text-muted-foreground",
                    status === "not-tracked" && "bg-muted text-muted-foreground"
                  )}
                >
                  {status === "in-stock" && <Check className="w-3 h-3 mr-1" />}
                  {status === "low-stock" && <AlertCircle className="w-3 h-3 mr-1" />}
                  {status === "out-of-stock" && <AlertCircle className="w-3 h-3 mr-1" />}
                  {status === "in-stock" && "In Stock"}
                  {status === "low-stock" && "Low Stock"}
                  {status === "out-of-stock" && "Out of Stock"}
                  {status === "not-tracked" && "Not Tracked"}
                </Badge>

                <Button
                  size="sm"
                  onClick={() => handleSave(product.id)}
                  disabled={saving === product.id}
                >
                  {saving === product.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? "No products match your search." : "No products found."}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
