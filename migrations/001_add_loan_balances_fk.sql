-- Add Foreign Key to loan_balances for Supabase Joins
-- Run this in your Supabase SQL Editor

ALTER TABLE loan_balances
ADD CONSTRAINT fk_loan_balances_loans
FOREIGN KEY (loan_id)
REFERENCES loans(id)
ON DELETE CASCADE;
