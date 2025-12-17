-- 004_fix_payment_schema_and_balances.sql
-- Run this in Supabase SQL Editor

-- 1. Ensure Transactions Table has ALL required columns
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual_entry',
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'processed',
ADD COLUMN IF NOT EXISTS allocation_breakdown JSONB,
ADD COLUMN IF NOT EXISTS balance_after_transaction DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS txn_type VARCHAR(10) DEFAULT 'PAY',
ADD COLUMN IF NOT EXISTS txn_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS amount DECIMAL(12, 2);

-- 2. Fix Orphaned Loans (Loans without Balance Records)
-- This fixes the issue where "Select a loan..." appears because no balance record exists to join on.
INSERT INTO loan_balances (loan_id, current_outstanding_balance, outstanding_principal, outstanding_interest, unpaid_fees)
SELECT 
    l.id, 
    l.loan_amount, -- Default to loan amount if new
    l.loan_amount, 
    0, 
    0
FROM loans l
WHERE NOT EXISTS (
    SELECT 1 FROM loan_balances lb WHERE lb.loan_id = l.id
);

-- 3. Update Loans with "New" source if null
UPDATE loans SET loan_source = 'New' WHERE loan_source IS NULL;
