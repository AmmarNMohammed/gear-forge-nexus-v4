-- Add guest email column to orders table for guest checkout
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS guest_email TEXT,
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT UNIQUE;

-- Create index on guest_email for faster lookups when linking accounts
CREATE INDEX IF NOT EXISTS idx_orders_guest_email ON public.orders(guest_email) WHERE guest_email IS NOT NULL;

-- Update orders RLS to allow guest order creation (without user_id requirement initially)
-- Drop existing insert policy and recreate
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;

-- Allow authenticated users to create orders for themselves
CREATE POLICY "Users can create their own orders" 
ON public.orders 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow service role to create guest orders (handled by edge function)
-- This is implicit with service role key

-- Add policy for admins to view all orders
CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add policy for admins to update any order
CREATE POLICY "Admins can update any order" 
ON public.orders 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add policy for users to update their own orders (for claiming guest orders)
CREATE POLICY "Users can update their own orders" 
ON public.orders 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id OR (guest_email IS NOT NULL AND user_id IS NULL));

-- Allow users to view orders with their email (for guest order claiming)
CREATE POLICY "Users can view orders by their email" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = user_id OR 
  (guest_email = auth.jwt()->>'email' AND user_id IS NULL)
);

-- Add admin policies for order_items
CREATE POLICY "Admins can view all order items" 
ON public.order_items 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND public.has_role(auth.uid(), 'admin')
  )
);

-- Make user_id nullable for guest orders
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;