-- Migration: Ensure transactions table supports full transaction logging
-- Run this in Supabase SQL Editor

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS txn_type VARCHAR(10), -- 'PAY', 'ADV', 'EST', etc.
ADD COLUMN IF NOT EXISTS txn_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS source VARCHAR(50), -- 'manual_entry', 'system'
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'processed',
ADD COLUMN IF NOT EXISTS allocation_breakdown JSONB,
ADD COLUMN IF NOT EXISTS balance_after_transaction DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

-- Optional: Rename existing columns if they deviate (e.g. description -> notes)
-- We will just use 'notes' in the code going forward.

-- Ensure amount exists (from previous step)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS amount DECIMAL(12, 2);
