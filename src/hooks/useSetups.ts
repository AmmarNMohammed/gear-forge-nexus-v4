import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SetupProduct {
  productId: string;
  quantity: number;
}

export interface Setup {
  id: string;
  name: string;
  description: string;
  image: string;
  total_price: number;
  style: string;
  is_curated: boolean;
  is_featured: boolean;
  tags: string[];
  products: SetupProduct[];
  created_at: string;
  updated_at: string;
}

export function useSetups() {
  const [setups, setSetups] = useState<Setup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSetups();
  }, []);

  const getCuratedSetups = () => setups.filter((s) => s.is_curated);
  const getFeaturedSetups = () => setups.filter((s) => s.is_featured);
  const getExploreSetups = () => setups.filter((s) => !s.is_curated);

  return {
    setups,
    isLoading,
    fetchSetups,
    getCuratedSetups,
    getFeaturedSetups,
    getExploreSetups,
  };
}
