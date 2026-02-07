import { useState, useEffect } from "react";
import {
  Package,
  RefreshCw,
  Truck,
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
  Search,
  Mail,
  DollarSign,
  AlertTriangle,
  User,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
}

interface Order {
  id: string;
  user_id: string | null;
  guest_email: string | null;
  customer_email: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  is_guest: boolean;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  total_amount: number;
  shipping_address: Record<string, unknown> | null;
  created_at: string;
  order_items: OrderItem[];
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  shipped: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  delivered: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Package className="w-4 h-4" />,
  processing: <RefreshCw className="w-4 h-4" />,
  shipped: <Truck className="w-4 h-4" />,
  delivered: <CheckCircle className="w-4 h-4" />,
  cancelled: <XCircle className="w-4 h-4" />,
};

interface AdminOrdersProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  isLoading: boolean;
}

export function AdminOrders({ orders, setOrders, isLoading }: AdminOrdersProps) {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Action states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionType, setActionType] = useState<"ship" | "deliver" | "refund" | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStatusUpdate = async (newStatus: "shipped" | "delivered") => {
    if (!selectedOrder) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-order-notification", {
        body: {
          orderId: selectedOrder.id,
          newStatus,
          trackingNumber: newStatus === "shipped" ? trackingNumber : undefined,
        },
      });

      if (error) throw error;

      toast({
        title: "Order Updated",
        description: `Order marked as ${newStatus}. ${data.emailSent ? "Customer notified by email." : ""}`,
      });

      setOrders(orders.map(o =>
        o.id === selectedOrder.id ? { ...o, status: newStatus } : o
      ));
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update order",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setSelectedOrder(null);
      setActionType(null);
      setTrackingNumber("");
    }
  };

  const handleRefund = async () => {
    if (!selectedOrder) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-refund-order", {
        body: {
          orderId: selectedOrder.id,
          reason: "requested_by_customer",
        },
      });

      if (error) throw error;

      toast({
        title: "Refund Processed",
        description: `Refunded $${data.amountRefunded.toLocaleString()}`,
      });

      setOrders(orders.map(o =>
        o.id === selectedOrder.id ? { ...o, status: "cancelled" as const } : o
      ));
    } catch (error) {
      console.error("Error processing refund:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process refund",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setSelectedOrder(null);
      setActionType(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesSearch = searchQuery === "" ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_phone?.includes(searchQuery) ||
      order.order_items.some(item =>
        item.product_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesStatus && matchesSearch;
  });

  const formatAddress = (address: Record<string, unknown> | null) => {
    if (!address) return null;
    const parts = [
      address.line1,
      address.line2,
      address.city,
      address.state,
      address.postal_code,
      address.country,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  const toggleExpanded = (orderId: string) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="card-gradient">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{orders.length}</p>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <RefreshCw className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {orders.filter(o => o.status === "processing").length}
                </p>
                <p className="text-sm text-muted-foreground">Processing</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Truck className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {orders.filter(o => o.status === "shipped").length}
                </p>
                <p className="text-sm text-muted-foreground">Shipped</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ${orders.reduce((sum, o) => sum + o.total_amount, 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by order ID, email, name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Orders ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No orders found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                const formattedAddress = formatAddress(order.shipping_address);

                return (
                  <div
                    key={order.id}
                    className="border border-border rounded-lg hover:border-primary/30 transition-colors"
                  >
                    {/* Order Header - always visible */}
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => toggleExpanded(order.id)}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-mono text-sm">#{order.id.slice(0, 8)}</p>
                            {order.is_guest && (
                              <Badge variant="outline" className="text-xs">
                                <User className="w-3 h-3 mr-1" />
                                Guest
                              </Badge>
                            )}
                            {order.customer_name && (
                              <span className="text-sm font-medium">{order.customer_name}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            {order.customer_email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5" />
                                {order.customer_email}
                              </span>
                            )}
                            {order.customer_phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5" />
                                {order.customer_phone}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className={cn("capitalize flex items-center gap-1", statusColors[order.status])}
                          >
                            {statusIcons[order.status]}
                            {order.status}
                          </Badge>
                          <span className="font-bold text-primary">
                            ${order.total_amount.toLocaleString()}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
                        {/* Customer Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Customer Info</h4>
                            <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                              {order.customer_name && (
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-muted-foreground shrink-0" />
                                  <span>{order.customer_name}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                                <span>{order.customer_email || "No email"}</span>
                              </div>
                              {order.customer_phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                                  <span dir="ltr">{order.customer_phone}</span>
                                </div>
                              )}
                              {order.is_guest && (
                                <Badge variant="secondary" className="text-xs mt-1">Guest Checkout</Badge>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Shipping Address</h4>
                            <div className="bg-muted/50 rounded-lg p-3 text-sm">
                              {formattedAddress ? (
                                <div className="flex items-start gap-2">
                                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                                  <span>{formattedAddress}</span>
                                </div>
                              ) : order.shipping_address ? (
                                <div className="flex items-start gap-2">
                                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                                  <pre className="text-xs whitespace-pre-wrap font-mono">
                                    {JSON.stringify(order.shipping_address, null, 2)}
                                  </pre>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">No shipping address provided</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Order Details */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Order Items</h4>
                          <div className="bg-muted/50 rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="text-left p-3 font-medium">Product</th>
                                  <th className="text-center p-3 font-medium">Qty</th>
                                  <th className="text-right p-3 font-medium">Price</th>
                                  <th className="text-right p-3 font-medium">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.order_items.map((item) => (
                                  <tr key={item.id} className="border-b border-border/50 last:border-0">
                                    <td className="p-3">{item.product_name}</td>
                                    <td className="p-3 text-center">{item.quantity}</td>
                                    <td className="p-3 text-right">${item.product_price.toLocaleString()}</td>
                                    <td className="p-3 text-right font-medium">
                                      ${(item.product_price * item.quantity).toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                                <tr className="bg-muted/50">
                                  <td colSpan={3} className="p-3 text-right font-semibold">Total</td>
                                  <td className="p-3 text-right font-bold text-primary">
                                    ${order.total_amount.toLocaleString()}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Order ID & Date */}
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span>Order ID: <code className="font-mono">{order.id}</code></span>
                          <span>Created: {new Date(order.created_at).toLocaleString()}</span>
                        </div>

                        {/* Actions */}
                        {order.status !== "cancelled" && order.status !== "delivered" && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {order.status === "processing" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOrder(order);
                                  setActionType("ship");
                                }}
                              >
                                <Truck className="w-4 h-4 mr-2" />
                                Mark Shipped
                              </Button>
                            )}
                            {order.status === "shipped" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-secondary/50 text-secondary hover:bg-secondary/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOrder(order);
                                  setActionType("deliver");
                                }}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark Delivered
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-destructive/50 text-destructive hover:bg-destructive/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrder(order);
                                setActionType("refund");
                              }}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Refund
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ship Dialog */}
      <Dialog open={actionType === "ship"} onOpenChange={() => setActionType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Order as Shipped</DialogTitle>
            <DialogDescription>
              Customer will be notified by email with tracking information.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm text-muted-foreground">Tracking Number (optional)</label>
            <Input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>Cancel</Button>
            <Button
              onClick={() => handleStatusUpdate("shipped")}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirm Shipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deliver Dialog */}
      <Dialog open={actionType === "deliver"} onOpenChange={() => setActionType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Order as Delivered</DialogTitle>
            <DialogDescription>
              Customer will be notified by email that their order has arrived.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>Cancel</Button>
            <Button
              onClick={() => handleStatusUpdate("delivered")}
              disabled={isProcessing}
              className="bg-secondary hover:bg-secondary/90"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirm Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={actionType === "refund"} onOpenChange={() => setActionType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Process Refund
            </DialogTitle>
            <DialogDescription>
              This will refund the full order amount to the customer and cancel the order.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-2xl font-bold text-destructive">
              ${selectedOrder?.total_amount.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">will be refunded</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleRefund}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
