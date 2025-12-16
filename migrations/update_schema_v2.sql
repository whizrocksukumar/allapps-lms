-- 1. Client Updates (Splitting Phone)
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS mobile_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS work_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS home_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS client_type VARCHAR(50); -- e.g., 'Individual', 'Trust'

-- 2. Loan Updates
ALTER TABLE loans
ADD COLUMN IF NOT EXISTS loan_source VARCHAR(20) DEFAULT 'New', -- 'New' or 'Consolidated'
ADD COLUMN IF NOT EXISTS annual_interest_rate DECIMAL(5,2);

-- Note: We are choosing to IGNORE the 'balance' column in 'loans' in favor of 'loan_balances' table.
-- We won't drop it yet to avoid breaking existing queries immediately, but frontend should stop using it.

-- 3. Loan Balances (Ensuring structure matches requirements)
CREATE TABLE IF NOT EXISTS loan_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE UNIQUE,
    outstanding_principal DECIMAL(12,2) DEFAULT 0,
    outstanding_interest DECIMAL(12,2) DEFAULT 0,
    unpaid_fees DECIMAL(12,2) DEFAULT 0,
    current_outstanding_balance DECIMAL(12,2) DEFAULT 0,
    principal_paid DECIMAL(12,2) DEFAULT 0,
    interest_paid DECIMAL(12,2) DEFAULT 0,
    fees_paid DECIMAL(12,2) DEFAULT 0,
    last_payment_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Fee Applications (For tracking fee history)
CREATE TABLE IF NOT EXISTS fee_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    fee_type VARCHAR(50) NOT NULL, -- 'EST', 'LATE', 'DISHONOR', 'FACC'
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'applied',
    applied_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Transaction Support
-- Lookup table for types
CREATE TABLE IF NOT EXISTS transaction_types (
    code VARCHAR(10) PRIMARY KEY, -- 'ADV', 'EST', 'INT', 'FACC', 'PAY', 'AP'
    description VARCHAR(100) NOT NULL
);

INSERT INTO transaction_types (code, description) VALUES
('ADV', 'Loan Advance'),
('EST', 'Establishment Fee'),
('INT', 'Interest Accrual'),
('FACC', 'Fee - Account/Admin Charge'),
('PAY', 'Payment'),
('AP', 'Additional Payment')
ON CONFLICT (code) DO NOTHING;

-- Enhancing transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS allocation_breakdown JSONB, -- Stores {"fees": x, "interest": y, "principal": z}
ADD COLUMN IF NOT EXISTS balance_after_transaction DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS fees_applied DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS interest_applied DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS principal_applied DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(50) DEFAULT 'processed';

-- 6. Expenses Table (New Requirement)
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    category VARCHAR(100), -- Chart of Accounts
    reference VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
