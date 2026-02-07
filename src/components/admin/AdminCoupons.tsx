import { useState, useEffect } from "react";
import { Tag, Loader2, Plus, Trash2, ToggleLeft, ToggleRight, Percent, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  times_used: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

export function AdminCoupons() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New coupon form state
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: 10,
    min_order_amount: 0,
    max_uses: "",
    valid_until: "",
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-manage-coupons", {
        body: { action: "list" },
      });

      if (error) throw error;
      setCoupons(data.coupons || []);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast({
        title: "Error",
        description: "Failed to load coupons",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newCoupon.code.trim()) {
      toast({
        title: "Error",
        description: "Coupon code is required",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase.functions.invoke("admin-manage-coupons", {
        body: {
          action: "create",
          data: {
            code: newCoupon.code.toUpperCase(),
            discount_type: newCoupon.discount_type,
            discount_value: newCoupon.discount_value,
            min_order_amount: newCoupon.min_order_amount,
            max_uses: newCoupon.max_uses ? parseInt(newCoupon.max_uses) : null,
            valid_until: newCoupon.valid_until || null,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Coupon created",
        description: `Code "${newCoupon.code.toUpperCase()}" is now active.`,
      });

      setShowCreateDialog(false);
      setNewCoupon({
        code: "",
        discount_type: "percentage",
        discount_value: 10,
        min_order_amount: 0,
        max_uses: "",
        valid_until: "",
      });
      fetchCoupons();
    } catch (error) {
      console.error("Error creating coupon:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create coupon",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggle = async (couponId: string) => {
    setTogglingId(couponId);
    try {
      const { error } = await supabase.functions.invoke("admin-manage-coupons", {
        body: { action: "toggle", couponId },
      });

      if (error) throw error;
      fetchCoupons();
    } catch (error) {
      console.error("Error toggling coupon:", error);
      toast({
        title: "Error",
        description: "Failed to toggle coupon",
        variant: "destructive",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (couponId: string) => {
    setDeletingId(couponId);
    try {
      const { error } = await supabase.functions.invoke("admin-manage-coupons", {
        body: { action: "delete", couponId },
      });

      if (error) throw error;

      toast({
        title: "Coupon deleted",
        description: "The coupon has been removed.",
      });
      fetchCoupons();
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast({
        title: "Error",
        description: "Failed to delete coupon",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const isExpired = (coupon: Coupon) => {
    if (!coupon.valid_until) return false;
    return new Date(coupon.valid_until) < new Date();
  };

  const isMaxedOut = (coupon: Coupon) => {
    if (coupon.max_uses === null) return false;
    return coupon.times_used >= coupon.max_uses;
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
            <Tag className="w-5 h-5" />
            Coupon Codes
          </CardTitle>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Coupon
          </Button>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No coupons created yet. Click "Create Coupon" to add one.
            </div>
          ) : (
            <div className="space-y-4">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className={cn(
                    "flex flex-wrap items-center gap-4 p-4 border rounded-lg",
                    coupon.is_active && !isExpired(coupon) && !isMaxedOut(coupon)
                      ? "border-border"
                      : "border-muted bg-muted/30"
                  )}
                >
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-bold text-lg">{coupon.code}</code>
                      {coupon.discount_type === "percentage" ? (
                        <Badge className="bg-primary/20 text-primary">
                          <Percent className="w-3 h-3 mr-1" />
                          {coupon.discount_value}% off
                        </Badge>
                      ) : (
                        <Badge className="bg-secondary/20 text-secondary">
                          <DollarSign className="w-3 h-3 mr-1" />
                          ${coupon.discount_value} off
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 text-sm text-muted-foreground">
                      {coupon.min_order_amount > 0 && (
                        <span>Min order: ${coupon.min_order_amount}</span>
                      )}
                      {coupon.max_uses !== null && (
                        <span>• Uses: {coupon.times_used}/{coupon.max_uses}</span>
                      )}
                      {coupon.valid_until && (
                        <span>• Expires: {new Date(coupon.valid_until).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isExpired(coupon) && (
                      <Badge variant="outline" className="bg-muted text-muted-foreground">
                        Expired
                      </Badge>
                    )}
                    {isMaxedOut(coupon) && (
                      <Badge variant="outline" className="bg-muted text-muted-foreground">
                        Max Used
                      </Badge>
                    )}
                    {!isExpired(coupon) && !isMaxedOut(coupon) && (
                      <Badge
                        variant="outline"
                        className={
                          coupon.is_active
                            ? "bg-secondary/20 text-secondary border-secondary/30"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {coupon.is_active ? "Active" : "Inactive"}
                      </Badge>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggle(coupon.id)}
                    disabled={togglingId === coupon.id}
                  >
                    {togglingId === coupon.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : coupon.is_active ? (
                      <ToggleRight className="w-5 h-5 text-secondary" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(coupon.id)}
                    disabled={deletingId === coupon.id}
                  >
                    {deletingId === coupon.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Coupon Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Coupon</DialogTitle>
            <DialogDescription>
              Create a new discount code for customers to use at checkout.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Coupon Code</label>
              <Input
                placeholder="e.g., SUMMER20"
                value={newCoupon.code}
                onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Discount Type</label>
                <Select
                  value={newCoupon.discount_type}
                  onValueChange={(value: "percentage" | "fixed") =>
                    setNewCoupon({ ...newCoupon, discount_type: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">
                  {newCoupon.discount_type === "percentage" ? "Discount %" : "Discount Amount"}
                </label>
                <Input
                  type="number"
                  min="1"
                  max={newCoupon.discount_type === "percentage" ? 100 : undefined}
                  value={newCoupon.discount_value}
                  onChange={(e) =>
                    setNewCoupon({ ...newCoupon, discount_value: parseInt(e.target.value) || 0 })
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Min Order Amount</label>
                <Input
                  type="number"
                  min="0"
                  value={newCoupon.min_order_amount}
                  onChange={(e) =>
                    setNewCoupon({ ...newCoupon, min_order_amount: parseInt(e.target.value) || 0 })
                  }
                  className="mt-1"
                  placeholder="0 = no minimum"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Max Uses</label>
                <Input
                  type="number"
                  min="1"
                  value={newCoupon.max_uses}
                  onChange={(e) => setNewCoupon({ ...newCoupon, max_uses: e.target.value })}
                  className="mt-1"
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Expiration Date (optional)</label>
              <Input
                type="date"
                value={newCoupon.valid_until}
                onChange={(e) => setNewCoupon({ ...newCoupon, valid_until: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
