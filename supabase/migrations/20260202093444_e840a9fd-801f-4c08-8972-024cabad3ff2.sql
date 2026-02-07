-- Fix: Remove the email-based SELECT policy that allows email enumeration
-- The policy "Users can view orders by their email" allows any authenticated user 
-- to check if a specific email has placed orders by creating accounts with different emails

-- Drop the vulnerable policy
DROP POLICY IF EXISTS "Users can view orders by their email" ON public.orders;

-- The remaining policies are sufficient:
-- - "Users can view their own orders" (SELECT where user_id = auth.uid()) - for authenticated users
-- - Guest order access should be handled securely via the claim-guest-orders edge function