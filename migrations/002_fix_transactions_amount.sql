-- Fix Transactions Table: Ensure 'amount' column exists
-- Run this in Supabase SQL Editor

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS amount DECIMAL(12, 2);

-- Optional: If you prefer 'transaction_amount', you can rename it, but the code expects 'amount'.
-- If you have 'payment_amount' or something else, please rename it to 'amount' or update the code.
