-- Add missing columns to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS occupation text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS credit_rating text;

-- Add missing columns to loans table
ALTER TABLE loans ADD COLUMN IF NOT EXISTS loan_type text;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS source text; -- Values: 'New', 'Consolidated', 'Refinanced'
