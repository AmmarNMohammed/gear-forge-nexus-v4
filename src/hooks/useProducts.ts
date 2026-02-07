import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  image: string;
  category: "pcs" | "monitors" | "peripherals" | "furniture" | "audio" | "accessories";
  brand: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  hasRgb: boolean;
  featured?: boolean;
  specs?: Record<string, string>;
  tags?: string[];
}

interface DbProduct {
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
  created_at: string;
  updated_at: string;
}

function mapDbToProduct(db: DbProduct): Product {
  return {
    id: db.id,
    name: db.name,
    description: db.description,
    price: db.price,
    originalPrice: db.original_price,
    image: db.image,
    category: db.category as Product["category"],
    brand: db.brand,
    rating: db.rating,
    reviews: db.reviews,
    inStock: db.in_stock,
    hasRgb: db.has_rgb,
    featured: db.featured,
    specs: db.specs,
    tags: db.tags,
  };
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped = (data as DbProduct[]).map(mapDbToProduct);
      setProducts(mapped);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProductById = (id: string): Product | undefined => {
    return products.find((p) => p.id === id);
  };

  const getProductsByCategory = (category: string): Product[] => {
    return products.filter((p) => p.category === category);
  };

  const getFeaturedProducts = (): Product[] => {
    return products.filter((p) => p.featured);
  };

  const searchProducts = (query: string): Product[] => {
    const lowercaseQuery = query.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowercaseQuery) ||
        p.description.toLowerCase().includes(lowercaseQuery) ||
        p.brand.toLowerCase().includes(lowercaseQuery) ||
        p.tags?.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
    );
  };

  return {
    products,
    isLoading,
    getProductById,
    getProductsByCategory,
    getFeaturedProducts,
    searchProducts,
    refetch: fetchProducts,
  };
}

export const categories = [
  { id: "pcs", name: "Gaming PCs", icon: "Monitor" },
  { id: "monitors", name: "Monitors", icon: "MonitorUp" },
  { id: "peripherals", name: "Peripherals", icon: "Keyboard" },
  { id: "audio", name: "Audio", icon: "Headphones" },
  { id: "furniture", name: "Furniture", icon: "Armchair" },
  { id: "accessories", name: "Accessories", icon: "Sparkles" },
] as const;

export const brands = ["NexusForge", "VisionMax", "KeyMaster", "SwiftGear", "AudioElite", "ErgoThrone"];
