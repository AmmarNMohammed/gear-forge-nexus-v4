import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Address {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type AddressFormData = {
  label: string;
  full_name: string;
  phone?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
  is_default: boolean;
};

export function useAddresses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAddresses = useCallback(async () => {
    if (!user) {
      setAddresses([]);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAddresses(data as Address[]);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const addAddress = async (data: AddressFormData) => {
    if (!user) return;

    const { error } = await supabase.from("addresses").insert({
      user_id: user.id,
      ...data,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to add address", variant: "destructive" });
      return;
    }

    toast({ title: "Address added" });
    await fetchAddresses();
  };

  const updateAddress = async (id: string, data: Partial<AddressFormData>) => {
    if (!user) return;

    const { error } = await supabase
      .from("addresses")
      .update(data)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update address", variant: "destructive" });
      return;
    }

    toast({ title: "Address updated" });
    await fetchAddresses();
  };

  const deleteAddress = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete address", variant: "destructive" });
      return;
    }

    toast({ title: "Address deleted" });
    await fetchAddresses();
  };

  const setDefault = async (id: string) => {
    await updateAddress(id, { is_default: true });
  };

  const getDefaultAddress = (): Address | undefined => {
    return addresses.find((a) => a.is_default);
  };

  return {
    addresses,
    isLoading,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefault,
    getDefaultAddress,
    refetch: fetchAddresses,
  };
}
