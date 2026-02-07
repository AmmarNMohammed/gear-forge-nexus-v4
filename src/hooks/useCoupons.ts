import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CouponValidation {
  valid: boolean;
  error?: string;
  coupon?: {
    id: string;
    code: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    discountAmount: number;
  };
}

export function useCoupons() {
  const [isValidating, setIsValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidation["coupon"] | null>(null);

  const validateCoupon = async (code: string, orderTotal: number): Promise<CouponValidation> => {
    if (!code.trim()) {
      return { valid: false, error: "Please enter a coupon code" };
    }

    setIsValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-coupon", {
        body: { code: code.trim().toUpperCase(), orderTotal },
      });

      if (error) {
        throw error;
      }

      if (data.valid && data.coupon) {
        setAppliedCoupon(data.coupon);
      }

      return data as CouponValidation;
    } catch (error) {
      console.error("Error validating coupon:", error);
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : "Failed to validate coupon" 
      };
    } finally {
      setIsValidating(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const getDiscountedTotal = (subtotal: number): number => {
    if (!appliedCoupon) return subtotal;
    
    if (appliedCoupon.discountType === "percentage") {
      return subtotal - (subtotal * appliedCoupon.discountValue / 100);
    }
    return Math.max(0, subtotal - appliedCoupon.discountValue);
  };

  const getDiscountAmount = (subtotal: number): number => {
    if (!appliedCoupon) return 0;
    
    if (appliedCoupon.discountType === "percentage") {
      return subtotal * appliedCoupon.discountValue / 100;
    }
    return Math.min(appliedCoupon.discountValue, subtotal);
  };

  return {
    isValidating,
    appliedCoupon,
    validateCoupon,
    removeCoupon,
    getDiscountedTotal,
    getDiscountAmount,
  };
}
