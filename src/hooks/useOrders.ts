import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
}

interface Order {
  id: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  total_amount: number;
  shipping_address: any;
  created_at: string;
  items?: OrderItem[];
}

export function useOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrders = async () => {
    if (!user) {
      setOrders([]);
      return;
    }

    setIsLoading(true);
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!ordersError && ordersData) {
      // Fetch order items for each order
      const ordersWithItems = await Promise.all(
        ordersData.map(async (order) => {
          const { data: itemsData } = await supabase
            .from("order_items")
            .select("*")
            .eq("order_id", order.id);

          return {
            ...order,
            items: itemsData || []
          } as Order;
        })
      );

      setOrders(ordersWithItems);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const createOrder = async (
    items: { productId: string; productName: string; productPrice: number; quantity: number }[],
    totalAmount: number,
    shippingAddress?: any
  ) => {
    if (!user) return { error: new Error("Must be logged in"), orderId: null };

    // Create the order
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        total_amount: totalAmount,
        shipping_address: shippingAddress,
        status: "pending"
      })
      .select()
      .single();

    if (orderError || !orderData) {
      return { error: orderError, orderId: null };
    }

    // Create order items
    const orderItems = items.map(item => ({
      order_id: orderData.id,
      product_id: item.productId,
      product_name: item.productName,
      product_price: item.productPrice,
      quantity: item.quantity
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      return { error: itemsError, orderId: null };
    }

    await fetchOrders();
    return { error: null, orderId: orderData.id };
  };

  return {
    orders,
    isLoading,
    createOrder,
    refetch: fetchOrders
  };
}
