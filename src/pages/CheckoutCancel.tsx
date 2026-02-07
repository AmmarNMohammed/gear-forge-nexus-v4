import { Link } from "react-router-dom";
import { XCircle, ShoppingCart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CheckoutCancel() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="card-gradient border-destructive/20">
          <CardContent className="pt-8 pb-8 text-center">
            {/* Icon */}
            <div className="w-20 h-20 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>

            {/* Message */}
            <h1 className="text-2xl font-bold mb-2">Checkout Cancelled</h1>
            <p className="text-muted-foreground mb-8">
              Your order was not completed. Don't worry - your cart items are still saved.
            </p>

            {/* Actions */}
            <div className="space-y-3">
              <Button asChild className="w-full btn-gradient">
                <Link to="/shop">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Return to Cart
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Having trouble? <Link to="/contact" className="text-primary hover:underline">Contact support</Link>
        </p>
      </div>
    </div>
  );
}
