-- Add payment_status column to orders table
-- Run this in your Supabase SQL Editor

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue'));

-- Update existing orders to have 'pending' status if null
UPDATE orders 
SET payment_status = 'pending' 
WHERE payment_status IS NULL;
