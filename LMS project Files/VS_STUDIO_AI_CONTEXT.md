╔════════════════════════════════════════════════════════════════════════════════╗
║                 ALL APPS LMS - VS STUDIO AI CONTEXT                           ║
║        Complete Project Reference (Current Files + Schemas + Functions)        ║
╚════════════════════════════════════════════════════════════════════════════════╝

This document is for pasting into VS Studio's AI context so it understands:
- Your actual project structure
- Your actual Supabase schemas and fields
- Your actual edge functions
- How data flows through your app

================================================================================
PART 1: ACTUAL PROJECT STRUCTURE
================================================================================

PROJECT: All Apps LMS (Loan Management System)
LOCATION: /mnt/project/ (your actual files)
FRAMEWORK: React + Supabase + Vercel
DEPLOYMENT: Iframe in Whizrock platform

Current Files (15 components):
src/pages/
  ├── Dashboard.jsx ...................... Main loan overview dashboard
  ├── Clients.jsx ........................ Client/customer CRUD
  ├── Loans.jsx .......................... Loan creation and management
  ├── PaymentEntry.jsx ................... Record customer payments
  ├── PaymentProcessing.jsx .............. Process and allocate payments
  ├── Repayments.jsx ..................... Repayment scheduling and tracking
  ├── CustomerSummary.jsx ................ Customer summary view
  ├── LoanStatement.jsx .................. Generate loan statements
  ├── Reports.jsx ........................ Business reports
  ├── Refunds.jsx ........................ Refund management
  └── ConsolidateLoans.jsx ............... Loan consolidation

src/components/
  ├── Navbar.jsx ......................... Top navigation bar (All Apps logo, user menu)
  └── Sidebar.jsx ........................ Side navigation (menu items, Whizrock logo)

src/services/
  └── supabaseService.js ................. All database operations

Key Files:
  ├── App.jsx ............................ Main app component (routing logic)
  ├── main.jsx ........................... App entry point
  └── index.css .......................... Global styles & CSS variables

================================================================================
PART 2: ACTUAL SUPABASE SERVICE (src/services/supabaseService.js)
================================================================================

CURRENT FUNCTIONS:

1. getLoansWithClientNames()
   - Fetches all loans
   - Joins with clients table to get first_name, last_name, client_code
   - Returns: Array of loans with client_name and client_code added
   - Issue: Lines 33-34 reference .name and .code (should be first_name, last_name, client_code)

2. getClients()
   - Fetches all clients from 'clients' table
   - Returns: Array of client records

3. addClient(clientData)
   - Inserts new client record
   - Returns: Created client object or null

4. updateClient(id, clientData)
   - Updates existing client
   - Returns: Updated client or null

5. deleteClient(id)
   - Deletes client by ID
   - Returns: Boolean true/false

6. addLoan(loanData)
   - Inserts new loan
   - Returns: Created loan object or null

7. generateLoanSchedule(loanId, principal, rate, term)
   - Generates amortization schedule
   - Formula: monthlyRate = rate / 100 / 12
   - Returns: Array of schedule objects {month, payment_amount, principal_payment, interest_payment, remaining_balance}

8. getLoansForclient(clientId)
   - Fetches loans for specific client
   - Returns: Array of loan records

9. allocatePayment(paymentData)
   - Inserts payment record
   - Returns: Created payment or null

Export:
   - export { supabase } = Supabase client instance for direct queries

================================================================================
PART 3: ACTUAL SUPABASE TABLE SCHEMAS
================================================================================

TABLE 1: clients
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COLUMN                  TYPE              NULLABLE    KEY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
id                      UUID              NO          PRIMARY KEY
client_code             VARCHAR(20)       NO          UNIQUE (AAL10001 format)
first_name              VARCHAR(100)      NO
last_name               VARCHAR(100)      NO
email                   VARCHAR(255)      YES
phone                   VARCHAR(20)       YES
address                 TEXT              YES
city                    VARCHAR(100)      YES
postcode                VARCHAR(20)       YES
country                 VARCHAR(100)      YES
id_type                 VARCHAR(50)       YES         (passport, drivers_license, etc)
id_number               VARCHAR(100)      YES
date_of_birth           DATE              YES
employment_status       VARCHAR(50)       YES         (employed, self_employed, etc)
monthly_income          DECIMAL(12,2)     YES
status                  VARCHAR(20)       YES         DEFAULT: 'active'
region                  VARCHAR(100)      YES
gender                  VARCHAR(20)       YES
occupation              VARCHAR(100)      YES
credit_rating           VARCHAR(20)       YES         (Good, Fair, Poor, etc)
created_at              TIMESTAMP         NO          DEFAULT: NOW()
updated_at              TIMESTAMP         NO          DEFAULT: NOW()
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXAMPLE DATA:
client_code: AAL10001
first_name: Dwinder
last_name: Singh
email: dwinder.singh@email.com
phone: 021234567
city: Wellington
status: active

TABLE 2: loans
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COLUMN                      TYPE              NULLABLE    KEY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
id                          UUID              NO          PRIMARY KEY
loan_number                 VARCHAR(20)       NO          UNIQUE (L10001 format)
client_id                   UUID              NO          FOREIGN KEY → clients.id
product_id                  UUID              NO          FOREIGN KEY → loan_products.id
principal_amount            DECIMAL(12,2)    NO          Initial loan amount
interest_rate               DECIMAL(5,2)     NO          Annual percentage rate
term_months                 INTEGER           NO          Loan duration in months
status                      VARCHAR(20)       YES         DEFAULT: 'active'
date_open                   DATE              NO          Loan start date
date_closed                 DATE              YES         Loan end date (null if active)
balance                     DECIMAL(12,2)    YES         Outstanding balance
created_at                  TIMESTAMP         NO          DEFAULT: NOW()
updated_at                  TIMESTAMP         NO          DEFAULT: NOW()
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXAMPLE DATA:
loan_number: L10001
client_id: effe734b-92a1-4b34-b32d-80bbe9acd7f8 (Dwinder Singh)
principal_amount: 10000.00
interest_rate: 24.99
term_months: 36
status: active
date_open: 2025-11-07

TABLE 3: loan_products
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COLUMN                      TYPE              NULLABLE    KEY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
id                          UUID              NO          PRIMARY KEY
product_code                VARCHAR(20)       NO          UNIQUE
product_name                VARCHAR(100)      NO
description                 TEXT              YES
min_amount                  DECIMAL(12,2)    YES
max_amount                  DECIMAL(12,2)    YES
interest_rate               DECIMAL(5,2)     NO
term_months                 INTEGER           YES
establishment_fee           DECIMAL(10,2)    YES         One-time fee ($45-$495)
weekly_management_fee       DECIMAL(10,2)    YES         DEFAULT: $25/week
admin_charge                DECIMAL(10,2)    YES         DEFAULT: $2/week
dishonor_fee                DECIMAL(10,2)    YES         DEFAULT: $5
late_payment_fee            DECIMAL(10,2)    YES
status                      VARCHAR(20)       YES         DEFAULT: 'active'
created_at                  TIMESTAMP         NO
updated_at                  TIMESTAMP         NO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TABLE 4: repayment_schedule
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COLUMN                  TYPE              NULLABLE    KEY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
id                      UUID              NO          PRIMARY KEY
loan_id                 UUID              NO          FOREIGN KEY → loans.id
schedule_number         INTEGER           YES         Installment number (1, 2, 3...)
payment_date            DATE              NO          Due date
payment_amount          DECIMAL(12,2)    NO          Total amount due
principal               DECIMAL(12,2)    YES         Principal portion
interest                DECIMAL(12,2)    YES         Interest portion
status                  VARCHAR(20)       YES         DEFAULT: 'pending' (paid, overdue)
paid_date               DATE              YES         Actual payment date
created_at              TIMESTAMP         NO
updated_at              TIMESTAMP         NO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TABLE 5: loan_balances
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COLUMN                          TYPE              NULLABLE    KEY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
id                              UUID              NO          PRIMARY KEY
loan_id                         UUID              NO          FOREIGN KEY → loans.id (UNIQUE)
outstanding_principal           DECIMAL(12,2)    YES         Principal still owing
outstanding_interest            DECIMAL(12,2)    YES         Interest accrued
unpaid_fees                     DECIMAL(12,2)    YES         Fees not yet paid
current_outstanding_balance     DECIMAL(12,2)    YES         Total owed (principal + interest + fees)
principal_paid                  DECIMAL(12,2)    YES         Total principal paid
interest_paid                   DECIMAL(12,2)    YES         Total interest paid
fees_paid                       DECIMAL(12,2)    YES         Total fees paid
last_payment_date               DATE              YES
created_at                      TIMESTAMP         NO
updated_at                      TIMESTAMP         NO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TABLE 6: transactions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COLUMN                          TYPE              NULLABLE    KEY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
id                              UUID              NO          PRIMARY KEY
loan_id                         UUID              NO          FOREIGN KEY → loans.id
txn_type                        VARCHAR(50)       NO          Transaction type code
amount                          DECIMAL(12,2)    YES         Transaction amount
txn_date                        DATE              NO          Transaction date
reference                       VARCHAR(100)     YES         Reference/description
notes                           TEXT              YES
source                          VARCHAR(50)       YES         How transaction was created
processing_status               VARCHAR(50)       YES         Processed status
fees_applied                    DECIMAL(12,2)    YES
interest_applied                DECIMAL(12,2)    YES
principal_applied               DECIMAL(12,2)    YES
allocation_breakdown            JSONB             YES         {"interest": 0, "principal": 0, "fees": 0}
related_reconciliation_id       UUID              YES         Link to payment_reconciliation
balance_after_transaction       DECIMAL(12,2)    YES         Balance after this transaction
created_at                      TIMESTAMP         NO
updated_at                      TIMESTAMP         NO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TABLE 7: fee_applications
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COLUMN                  TYPE              NULLABLE    KEY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
id                      UUID              NO          PRIMARY KEY
loan_id                 UUID              NO          FOREIGN KEY → loans.id
fee_type                VARCHAR(50)       NO          Type of fee (EST, FACC, DISHONOR, LATE)
amount                  DECIMAL(12,2)    NO          Fee amount
status                  VARCHAR(20)       YES         DEFAULT: 'applied'
applied_date            DATE              NO
notes                   TEXT              YES
created_at              TIMESTAMP         NO
updated_at              TIMESTAMP         NO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TABLE 8: interest_calculations
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COLUMN                  TYPE              NULLABLE    KEY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
id                      UUID              NO          PRIMARY KEY
loan_id                 UUID              NO          FOREIGN KEY → loans.id
calculation_date        DATE              NO          Date of calculation (11:59 PM NZ time)
outstanding_balance     DECIMAL(12,2)    YES
annual_rate             DECIMAL(5,2)     YES
daily_interest          DECIMAL(12,4)    YES         Formula: (Balance × Rate ÷ 365) ÷ 100
accumulated_interest    DECIMAL(12,2)    YES
calculation_status      VARCHAR(20)       YES         DEFAULT: 'calculated'
created_at              TIMESTAMP         NO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TABLE 9: payment_reconciliation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COLUMN                      TYPE              NULLABLE    KEY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
id                          UUID              NO          PRIMARY KEY
loan_id                     UUID              NO          FOREIGN KEY → loans.id
payment_date                DATE              NO
amount_received             DECIMAL(12,2)    YES         Total payment received
allocation_fees             DECIMAL(12,2)    YES         Amount allocated to fees
allocation_interest         DECIMAL(12,2)    YES         Amount allocated to interest
allocation_principal        DECIMAL(12,2)    YES         Amount allocated to principal
reconciliation_status       VARCHAR(20)       YES         DEFAULT: 'pending'
notes                       TEXT              YES
created_at                  TIMESTAMP         NO
updated_at                  TIMESTAMP         NO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

================================================================================
PART 4: TRANSACTION TYPE ABBREVIATIONS (txn_type field)
================================================================================

CODE    FULL NAME                          FIELD               DESCRIPTION
────────────────────────────────────────────────────────────────────────────────
ADV     Loan Advance                        Element/Reference   Initial disbursement ($15,000)
EST     Establishment Fee                   Element             One-time setup fee ($45-$495)
INT     Interest                            Element             Daily interest calculation
FACC    Fee - Account/Admin Charge          Element             Weekly management ($25) + admin ($2)
PAY     Payment                             Element             Customer repayment
AP      Additional Payment                  Reference           Extra payment above schedule
BNZ     Bank New Zealand                    Reference/Notes     Payment method identifier
────────────────────────────────────────────────────────────────────────────────

MAPPING TO transactions TABLE:
- txn_type = Element code (ADV, EST, INT, FACC, PAY)
- reference = Reference code (ADV, Interest, AP, BNZ)
- notes = Full description ("Loan Advance", "Interest from 10/07/2024 to 16/07/2024")
- amount = Dollar amount
- source = How recorded (manual_entry, system, automatic)
- allocation_breakdown = {"fees": 0, "interest": 72.85, "principal": 377.15}

EXAMPLE TRANSACTION RECORD:
{
  loan_id: "L10001",
  txn_type: "PAY",
  amount: 450.00,
  txn_date: "2024-07-17",
  reference: "AP",
  notes: "Additional payment BNZ",
  source: "manual_entry",
  allocation_breakdown: {
    fees: 0,
    interest: 72.85,
    principal: 377.15
  },
  balance_after_transaction: 15122.26
}

================================================================================
PART 5: EDGE FUNCTIONS IN SUPABASE
================================================================================

FUNCTION 1: allocate-payment
Path: supabase/functions/allocate-payment/

Purpose: Process customer payment and allocate to: Fees → Interest → Principal

Trigger: Called from PaymentEntry.jsx when customer makes payment

Input:
{
  loan_id: "uuid",
  amount: 450.00,
  reference: "AP" or "BNZ" or "Manual"
}

Process:
1. Get current loan_balances (unpaid_fees, outstanding_interest, outstanding_principal)
2. Allocate payment in order:
   - First: Apply to unpaid_fees (up to fee amount)
   - Second: Apply remaining to outstanding_interest
   - Third: Apply remaining to outstanding_principal
   - Final: Return any remaining amount
3. Update loan_balances table with new amounts
4. Log transaction in transactions table

Output:
{
  success: true,
  allocation: {
    fees: 0.00,
    interest: 72.85,
    principal: 377.15,
    remaining: 0.00
  }
}

FUNCTION 2: create-loan
Path: supabase/functions/create-loan/

Purpose: Create new loan + repayment schedule + initialize balance

Trigger: Called from Loans.jsx (Create Loan form)

Input:
{
  client_id: "uuid",
  product_id: "uuid",
  principal_amount: 10000.00,
  date_open: "2025-11-07"
}

Process:
1. Get product details (interest_rate, term_months, establishment_fee)
2. Create loan record in loans table
3. Initialize loan_balances (principal + establishment_fee)
4. Generate repayment_schedule (monthly payments for term_months)
5. Create transaction record (ADV type) for loan disbursement

Output:
{
  success: true,
  loan: {
    id: "uuid",
    loan_number: "L10001",
    principal_amount: 10000.00,
    interest_rate: 24.99,
    term_months: 36,
    date_open: "2025-11-07"
  },
  schedule_count: 36
}

================================================================================
PART 6: KEY RELATIONSHIPS & DATA FLOW
================================================================================

CLIENT → LOAN:
clients.id = loans.client_id (one-to-many)
When creating loan: Need client_id from clients table
When displaying: Join with clients on first_name, last_name, client_code

LOAN → SCHEDULE:
loans.id = repayment_schedule.loan_id
One loan has many repayment installments

LOAN → BALANCES:
loans.id = loan_balances.loan_id (one-to-one)
Track outstanding amounts for the loan

LOAN → TRANSACTIONS:
loans.id = transactions.loan_id
Every payment/fee/interest creates transaction record

LOAN → PRODUCTS:
loans.product_id = loan_products.id
Defines interest rates, fees, terms

PAYMENT FLOW:
1. Customer makes payment (PaymentEntry.jsx)
2. Calls edge function: allocate-payment
3. Edge function calculates allocation (Fees → Interest → Principal)
4. Updates loan_balances with new amounts
5. Creates transaction record with allocation_breakdown
6. Creates payment_reconciliation record

INTEREST CALCULATION FLOW:
1. Runs daily at 11:59 PM NZ time (automated)
2. For each active loan:
   - Get outstanding_principal from loan_balances
   - Calculate: daily_interest = (balance × annual_rate ÷ 365) ÷ 100
   - Store in interest_calculations table
   - Add to outstanding_interest in loan_balances

FEE APPLICATION FLOW:
1. Establishment Fee: Applied when loan created
2. Weekly Management Fee: Applied every week on anniversary day
3. Admin Charge: Applied weekly ($2)
4. Dishonor Fee: Applied when payment fails ($5)
5. Late Payment Fee: Applied when overdue
All stored in fee_applications table

================================================================================
PART 7: CURRENT ISSUES & FIXES
================================================================================

ISSUE 1: getLoansWithClientNames() References Wrong Field Names
Location: supabaseService.js lines 33-34
Current:
  client_name: clientMap[loan.client_id]?.name || 'Unknown',
  client_code: clientMap[loan.client_id]?.code || '',
Should be:
  client_name: `${clientMap[loan.client_id]?.first_name || ''} ${clientMap[loan.client_id]?.last_name || ''}`.trim() || 'Unknown',
  client_code: clientMap[loan.client_id]?.client_code || '',

ISSUE 2: Missing Function Imports
Components importing functions that don't exist in supabaseService.js:
Example: Client360Modal.jsx trying to import getLoanStatistics()
Fix: Either add the function to supabaseService.js or remove the import

ISSUE 3: Manual Page Routing (no React Router)
Current: App.jsx uses switch(page) statement for navigation
Problem: Browser URL doesn't update, no back button support
Fix: Implement React Router with <Routes> and <Route>

ISSUE 4: Inline Styles Bloat
All components have heavy inline style={{ ... }} objects
Fix: Move to CSS/CSS Modules or use index.css variables

================================================================================
PART 8: ENVIRONMENT VARIABLES NEEDED
================================================================================

.env.local (for development):
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

Vercel Environment (for production):
Same two variables set in Vercel Project Settings > Environment Variables

================================================================================
PART 9: QUICK REFERENCE - IMPORTING IN COMPONENTS
================================================================================

From Dashboard.jsx:
import { getLoansWithClientNames } from '../services/supabaseService';

Usage:
const response = await getLoansWithClientNames();
const validLoans = response || [];

From Clients.jsx:
import { getClients, addClient, updateClient, deleteClient } from '../services/supabaseService';

From Loans.jsx:
import { addLoan, getLoansForclient, generateLoanSchedule } from '../services/supabaseService';

Direct Supabase Access (if needed):
import { supabase } from '../services/supabaseService';
const { data, error } = await supabase.from('loans').select('*');

================================================================================
END OF VS STUDIO AI CONTEXT
================================================================================

Use this document when:
1. Asking VS Studio AI to suggest fixes
2. Explaining your app structure to AI
3. Troubleshooting database issues
4. Understanding data relationships
5. Adding new features

The AI will understand your exact schema and current code, not theoretical examples.
