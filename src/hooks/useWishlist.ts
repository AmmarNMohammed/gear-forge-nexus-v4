import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { getProductById, Product } from "@/data/products";

interface WishlistItem {
  id: string;
  product_id: string;
  created_at: string;
}

export function useWishlist() {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWishlist = async () => {
    if (!user) {
      setWishlistItems([]);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("wishlists")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setWishlistItems(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchWishlist();
  }, [user]);

  const addToWishlist = async (productId: string) => {
    if (!user) return { error: new Error("Must be logged in") };

    const { error } = await supabase
      .from("wishlists")
      .insert({ user_id: user.id, product_id: productId });

    if (!error) {
      await fetchWishlist();
    }
    return { error };
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user) return { error: new Error("Must be logged in") };

    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", productId);

    if (!error) {
      await fetchWishlist();
    }
    return { error };
  };

  const isInWishlist = (productId: string): boolean => {
    return wishlistItems.some(item => item.product_id === productId);
  };

  const getWishlistProducts = (): Product[] => {
    return wishlistItems
      .map(item => getProductById(item.product_id))
      .filter((p): p is Product => p !== undefined);
  };

  return {
    wishlistItems,
    isLoading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    getWishlistProducts,
    refetch: fetchWishlist
  };
}
