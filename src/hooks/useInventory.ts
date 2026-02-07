import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface InventoryItem {
  productId: string;
  stockQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  isLowStock: boolean;
  inStock: boolean;
}

export function useInventory(productIds?: string[]) {
  const [inventory, setInventory] = useState<Map<string, InventoryItem>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, [productIds?.join(",")]);

  const fetchInventory = async () => {
    try {
      let query = supabase.from("product_inventory").select("*");
      
      if (productIds && productIds.length > 0) {
        query = query.in("product_id", productIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      const inventoryMap = new Map<string, InventoryItem>();
      data?.forEach((item) => {
        inventoryMap.set(item.product_id, {
          productId: item.product_id,
          stockQuantity: item.stock_quantity,
          lowStockThreshold: item.low_stock_threshold,
          trackInventory: item.track_inventory,
          isLowStock: item.stock_quantity <= item.low_stock_threshold && item.stock_quantity > 0,
          inStock: !item.track_inventory || item.stock_quantity > 0,
        });
      });

      setInventory(inventoryMap);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInventory = (productId: string): InventoryItem | undefined => {
    return inventory.get(productId);
  };

  const getStockStatus = (productId: string): "in-stock" | "low-stock" | "out-of-stock" => {
    const item = inventory.get(productId);
    if (!item || !item.trackInventory) return "in-stock";
    if (item.stockQuantity <= 0) return "out-of-stock";
    if (item.isLowStock) return "low-stock";
    return "in-stock";
  };

  const getMaxQuantity = (productId: string): number => {
    const item = inventory.get(productId);
    if (!item || !item.trackInventory) return 99;
    return Math.max(0, item.stockQuantity);
  };

  const checkAvailability = async (items: Array<{ productId: string; quantity: number }>) => {
    try {
      const { data, error } = await supabase.functions.invoke("check-inventory", {
        body: { items },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error checking inventory:", error);
      return { allAvailable: true, items: [], unavailableItems: [] };
    }
  };

  return {
    inventory,
    isLoading,
    getInventory,
    getStockStatus,
    getMaxQuantity,
    checkAvailability,
    refetch: fetchInventory,
  };
}
