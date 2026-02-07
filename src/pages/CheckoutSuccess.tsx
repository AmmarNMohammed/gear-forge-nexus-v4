import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, Package, Mail, ArrowRight, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

interface OrderDetails {
  success: boolean;
  orderId: string | null;
  paymentStatus: string;
  customerEmail: string;
  amountTotal: number;
  shippingAddress: {
    name: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  } | null;
}

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { clearCart } = useCart();
  const { user } = useAuth();

  const isGuest = !user;

  useEffect(() => {
    async function verifyPayment() {
      if (!sessionId) {
        setError("No session ID provided");
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke("verify-payment", {
          body: { sessionId },
        });

        if (fnError) throw fnError;
        
        if (data.success) {
          setOrderDetails(data);
          // Clear the cart after successful payment
          clearCart();
        } else {
          throw new Error(data.error || "Payment verification failed");
        }
      } catch (err) {
        console.error("Error verifying payment:", err);
        setError(err instanceof Error ? err.message : "Failed to verify payment");
      } finally {
        setIsLoading(false);
      }
    }

    verifyPayment();
  }, [sessionId, clearCart]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button asChild>
              <Link to="/shop">Return to Shop</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground">
            Thank you for your purchase. Your gaming gear is on its way!
          </p>
        </div>

        {/* Order Summary Card */}
        <Card className="card-gradient border-primary/20 mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Order ID */}
              {orderDetails?.orderId && (
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-mono text-sm">{orderDetails.orderId.slice(0, 8)}...</span>
                </div>
              )}

              {/* Amount */}
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Total Paid</span>
                <span className="text-xl font-bold text-primary">
                  ${((orderDetails?.amountTotal || 0) / 100).toLocaleString()}
                </span>
              </div>

              {/* Email Confirmation */}
              {orderDetails?.customerEmail && (
                <div className="flex items-start gap-3 py-3 bg-muted/30 rounded-lg px-4">
                  <Mail className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Confirmation email sent</p>
                    <p className="text-sm text-muted-foreground">{orderDetails.customerEmail}</p>
                  </div>
                </div>
              )}

              {/* Shipping Address */}
              {orderDetails?.shippingAddress && (
                <div className="flex items-start gap-3 py-3 bg-muted/30 rounded-lg px-4">
                  <Package className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Shipping to</p>
                    <p className="text-sm text-muted-foreground">
                      {orderDetails.shippingAddress.name}<br />
                      {orderDetails.shippingAddress.address.line1}<br />
                      {orderDetails.shippingAddress.address.line2 && (
                        <>{orderDetails.shippingAddress.address.line2}<br /></>
                      )}
                      {orderDetails.shippingAddress.address.city}, {orderDetails.shippingAddress.address.state} {orderDetails.shippingAddress.address.postal_code}<br />
                      {orderDetails.shippingAddress.address.country}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Guest Account CTA */}
        {isGuest && (
          <Card className="mb-8 border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/20 rounded-full">
                  <UserPlus className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold mb-1">Create an account to track your order</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sign up with <span className="text-primary font-medium">{orderDetails?.customerEmail}</span> to view your order history, 
                    save wishlists, and get faster checkout on future orders.
                  </p>
                  <Button asChild className="btn-gradient">
                    <Link to={`/auth?email=${encodeURIComponent(orderDetails?.customerEmail || "")}`}>
                      Create Account
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* What's Next */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="font-semibold mb-4">What happens next?</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">1</div>
                <p className="text-sm text-muted-foreground">We'll prepare your order for shipping</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">2</div>
                <p className="text-sm text-muted-foreground">You'll receive a shipping confirmation email with tracking</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">3</div>
                <p className="text-sm text-muted-foreground">Your gear will arrive in 3-5 business days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {user ? (
            <Button asChild className="flex-1 btn-gradient">
              <Link to="/account">
                View Your Orders
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          ) : (
            <Button asChild className="flex-1 btn-gradient">
              <Link to="/shop">
                Continue Shopping
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" className="flex-1">
            <Link to="/shop">Browse More Products</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
