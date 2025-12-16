================================================================================
ANTIGRAVITY HANDOFF DOCUMENT
================================================================================
Date: December 16, 2025
Project: All Apps LMS
Status: Requires debugging - loans table not displaying
Contact: Sukumar (user)

================================================================================
SUMMARY OF CHANGES MADE
================================================================================

This document outlines ALL schema changes, code changes, and edge functions
that have been implemented. Antigravity AI has direct access to all files
and should verify these are correct before proceeding.

================================================================================
PART 1: SUPABASE SCHEMA CHANGES
================================================================================

COMPLETED:

1. Renamed loans table columns:
   ✓ principal_outstanding → outstanding_principal
   ✓ interest_accrued → outstanding_interest

2. Added columns to loan_balances:
   ✓ last_payment_date (DATE, nullable)
   ✓ next_payment_due_date (DATE, nullable)

3. Dropped from repayment_schedule:
   ✓ amount (column removed - use scheduled_amount instead)

4. Added comments to loans table:
   ✓ outstanding_principal: "SNAPSHOT: For reference/waivers only"
   ✓ outstanding_interest: "SNAPSHOT: For reference/statements only"

NOT COMPLETED (DEFERRED):
   ⏸ Foreign key relationships (caused UNIQUE constraint errors)
   ⏸ Drop rate_id from loans (still present for backward compatibility)
   ⏸ Add product_id as FK (product_id column exists, FK not created)

CURRENT SCHEMA FIELDS - loans table:
id, loan_number, client_id, product_id, rate_id, loan_amount,
establishment_fee, start_date, end_date, outstanding_principal,
outstanding_interest, status, created_at, updated_at, term,
repayment_frequency, repayment_amount, total_repayable, instalments_due,
loan_type, source, loan_source, annual_interest_rate

CURRENT SCHEMA FIELDS - loan_balances table:
id, loan_id, outstanding_principal, outstanding_interest, unpaid_fees,
current_outstanding_balance, fees_paid, interest_paid, principal_paid,
created_at, updated_at, total_outstanding_balance, last_payment_date,
next_payment_due_date

CURRENT SCHEMA FIELDS - repayment_schedule table:
id, loan_id, payment_number, due_date, scheduled_amount,
principal_portion, interest_portion, paid_amount, paid_date, status,
created_at, updated_at
(amount column removed)

================================================================================
PART 2: EDGE FUNCTIONS
================================================================================

REPLACED: create-loan Edge Function
Location: supabase/functions/create-loan/index.ts
Status: DEPLOYED - needs verification

NEW FUNCTIONALITY:
✓ Accepts: client_id, product_id, loan_amount, establishment_fee, start_date, term
✓ Fetches product details (annual_interest_rate) from loan_products
✓ Calculates end_date based on term (Weekly=52, Fortnightly=26, Monthly=12)
✓ Calculates repayment_amount: (loan_amount + interest + fees) / term_periods
✓ Populates loans table with all calculated fields
✓ Initializes loan_balances with outstanding amounts
✓ Generates full repayment_schedule with payment_number, due_date, principal_portion, interest_portion
✓ Logs transaction as 'ADV' (loan advance)
✓ Sets next_payment_due_date in loan_balances

CODE (Copy below):
────────────────────────────────────────────────────────────────────────────

// supabase/functions/create-loan/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  try {
    const { client_id, product_id, loan_amount, establishment_fee, start_date, term, status = 'active' } = await req.json()

    // Validate
    if (!client_id || !product_id || !loan_amount || !start_date || !term) {
      return new Response(JSON.stringify({ success: false, message: 'Missing: client_id, product_id, loan_amount, start_date, term' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    // Get product details (annual_interest_rate, term from products)
    const { data: product, error: productError } = await supabase
      .from('loan_products')
      .select('id, annual_interest_rate, term')
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      return new Response(JSON.stringify({ success: false, message: 'Product not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
    }

    // Calculate periods based on term (Weekly=52, Fortnightly=26, Monthly=12)
    const termPeriods = term === 'Weekly' ? 52 : term === 'Fortnightly' ? 26 : 12
    const daysPerPeriod = term === 'Weekly' ? 7 : term === 'Fortnightly' ? 14 : 30

    // Calculate end_date
    const startDateObj = new Date(start_date)
    const endDate = new Date(startDateObj)
    endDate.setDate(endDate.getDate() + (daysPerPeriod * termPeriods))

    // Calculate interest and repayment amounts
    const dailyRate = product.annual_interest_rate / 365 / 100
    const daysInLoan = daysPerPeriod * termPeriods
    const totalInterest = loan_amount * dailyRate * daysInLoan
    const totalRepayable = loan_amount + totalInterest + establishment_fee
    const repaymentAmount = totalRepayable / termPeriods
    const principalPerPeriod = loan_amount / termPeriods
    const interestPerPeriod = totalInterest / termPeriods

    // Create loan record
    const { data: loan, error: loanError } = await supabase
      .from('loans')
      .insert({
        client_id,
        product_id,
        loan_amount,
        establishment_fee,
        annual_interest_rate: product.annual_interest_rate,
        start_date,
        end_date: endDate.toISOString().split('T')[0],
        status,
        term,
        repayment_amount: Math.round(repaymentAmount * 100) / 100,
        total_repayable: Math.round(totalRepayable * 100) / 100,
        instalments_due: termPeriods
      })
      .select()
      .single()

    if (loanError || !loan) {
      return new Response(JSON.stringify({ success: false, message: loanError?.message || 'Failed to create loan' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    // Initialize loan_balances
    const { error: balanceError } = await supabase
      .from('loan_balances')
      .insert({
        loan_id: loan.id,
        outstanding_principal: loan_amount,
        outstanding_interest: Math.round(totalInterest * 100) / 100,
        unpaid_fees: establishment_fee,
        current_outstanding_balance: Math.round(totalRepayable * 100) / 100,
        principal_paid: 0,
        interest_paid: 0,
        fees_paid: 0,
        next_payment_due_date: new Date(startDateObj.getTime() + daysPerPeriod * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      })

    if (balanceError) {
      return new Response(JSON.stringify({ success: false, message: balanceError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    // Generate repayment schedule
    const schedule = []
    for (let i = 1; i <= termPeriods; i++) {
      const paymentDate = new Date(startDateObj)
      paymentDate.setDate(paymentDate.getDate() + (daysPerPeriod * i))

      schedule.push({
        loan_id: loan.id,
        payment_number: i,
        due_date: paymentDate.toISOString().split('T')[0],
        scheduled_amount: Math.round(repaymentAmount * 100) / 100,
        principal_portion: Math.round(principalPerPeriod * 100) / 100,
        interest_portion: Math.round(interestPerPeriod * 100) / 100,
        paid_amount: null,
        paid_date: null,
        status: 'pending'
      })
    }

    const { error: scheduleError } = await supabase
      .from('repayment_schedule')
      .insert(schedule)

    if (scheduleError) {
      return new Response(JSON.stringify({ success: false, message: scheduleError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    // Log transaction (loan advance)
    await supabase.from('transactions').insert({
      loan_id: loan.id,
      txn_type: 'ADV',
      amount: loan_amount,
      txn_date: new Date().toISOString().split('T')[0],
      notes: `Loan advance: $${loan_amount}`,
      source: 'system',
      processing_status: 'processed'
    })

    return new Response(JSON.stringify({
      success: true,
      loan: {
        id: loan.id,
        loan_number: loan.loan_number,
        loan_amount,
        annual_interest_rate: product.annual_interest_rate,
        start_date,
        end_date: endDate.toISOString().split('T')[0],
        repayment_amount: Math.round(repaymentAmount * 100) / 100,
        instalments_due: termPeriods,
        total_repayable: Math.round(totalRepayable * 100) / 100,
        term
      },
      schedule_created: termPeriods
    }), { headers: { 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('Error:', err)
    return new Response(JSON.stringify({ success: false, message: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})

────────────────────────────────────────────────────────────────────────────

EXISTING Edge Functions (NO CHANGES):
✓ allocate-payment: Updates loan_balances with payment allocation

================================================================================
PART 3: REACT CODE CHANGES
================================================================================

UPDATED FILES:

1. src/hooks/useLoans.js
   Changed select query to:
   ✓ Remove: current_balance, term_periods, repayment_frequency
   ✓ Add: end_date, annual_interest_rate, instalments_due, repayment_amount
   ✓ Join: loan_balances with all balance fields
   
   ISSUE: Loans still not displaying - needs debugging

2. src/pages/Loans.jsx
   ✓ Added product_id dropdown (fetches from loan_products)
   ✓ Added term dropdown (Weekly/Fortnightly/Monthly)
   ✓ Added New Loan Modal form
   ✓ Calls create-loan Edge Function with correct parameters
   ✓ Changed balance display to current_outstanding_balance
   ✓ Changed rate display to annual_interest_rate%
   ✓ Imports from supabaseService
   
   ISSUE: Table showing but data not populating - likely useLoans query error

3. src/services/supabaseService.js
   ✓ Fixed field names: amount → scheduled_amount
   ✓ Fixed query references in getNextRepayment, getLoanStatistics
   ✓ All functions use correct table/column names

FILES AVAILABLE IN: /mnt/user-data/outputs/
- Loans-updated.jsx
- create-loan-complete.ts
- supabaseService-fixed.js
- useLoans.js (in document above)

================================================================================
PART 4: CURRENT ISSUE - LOANS NOT DISPLAYING
================================================================================

ERROR: useLoans.js query returns 400 error
URL: /rest/v1/loans?select=...&order=created_at.desc

LIKELY CAUSES:
1. loan_balances query using wrong table relationship
2. Joining repayment_schedule incorrectly
3. Column names still don't match schema

NEEDED FROM ANTIGRAVITY:
1. Verify useLoans.js select query against actual schema
2. Check if loan_balances relationship via loan_id works
3. Test query in Supabase SQL Editor:
   
   SELECT id, loan_number, loan_amount, status, start_date, term,
          annual_interest_rate, instalments_due, repayment_amount,
          client_id, product_id,
          loan_balances(current_outstanding_balance, outstanding_principal,
                        outstanding_interest, unpaid_fees, last_payment_date,
                        next_payment_due_date)
   FROM loans
   ORDER BY created_at DESC;

4. If that works, update useLoans.js accordingly

================================================================================
PART 5: WHAT'S STILL NEEDED (MVP)
================================================================================

IMMEDIATE (Blocking):
  🔴 Fix useLoans.js query to display loans correctly
  🔴 Verify loan creation works with new edge function
  🔴 Test repayment_schedule population

NEXT (After loans display works):
  🟠 Deploy daily_interest RPC function + pg_cron scheduler
  🟠 Update Dashboard.jsx aggregations to use loan_balances
  🟠 Update Client360Modal to show balance details
  🟠 Update PaymentEntry.jsx to handle new loan structure
  🟠 Populate clients dropdown in New Loan Modal

NOT IN MVP (Phase 2):
  ⏸ Weekly fees automation
  ⏸ Loan consolidation workflow
  ⏸ Advanced reporting
  ⏸ RLS and authentication

================================================================================
PART 6: ANTIGRAVITY VERIFICATION CHECKLIST
================================================================================

Please verify:

□ Supabase schema changes are reflected in console
  - loans table has: outstanding_principal, outstanding_interest (renamed)
  - loan_balances has: last_payment_due_date, next_payment_due_date (added)
  - repayment_schedule doesn't have: amount (dropped)

□ create-loan Edge Function deployed and accessible
  - Test: Can call from Supabase Functions dashboard
  - Test: Can invoke from React code

□ useLoans.js query works
  - Run the SQL test query above in Supabase SQL Editor
  - If it works, update useLoans accordingly

□ Loans display in table
  - Navigate to Loans page
  - Should show all loans with balances from loan_balances

□ New Loan form works
  - Click "+ New Loan" button
  - Select product and term
  - Click Create
  - Should create loan + repayment_schedule + loan_balances

================================================================================
NOTES FOR ANTIGRAVITY
================================================================================

Architecture Decision (LOCKED):
  ✓ loan_balances = single source of truth for all balance data
  ✓ allocate-payment Edge Function updates only loan_balances
  ✓ daily_interest job (TBD) will update only loan_balances
  ✓ Loans table = metadata + business reference only
  ✓ repayment_schedule = derived from create-loan, not editable

Design Pattern (LOCKED):
  ✓ term dropdown: Weekly/Fortnightly/Monthly (user selects)
  ✓ annual_interest_rate: pulled from product_id (not user entry)
  ✓ end_date: auto-calculated in Edge Function
  ✓ repayment_schedule: auto-generated for all periods
  ✓ Payments: allocated via allocate-payment Edge Function

Data Flow:
  User selects Product + Term in form
    ↓
  create-loan Edge Function receives: client_id, product_id, loan_amount, establishment_fee, start_date, term
    ↓
  Function fetches annual_interest_rate from products table
    ↓
  Function calculates: end_date, repayment_amount, interest, schedule
    ↓
  Function inserts into: loans, loan_balances, repayment_schedule, transactions
    ↓
  useLoans.js fetches loans + loan_balances for display
    ↓
  Loans.jsx displays all loan data

Known Issues:
  ⚠ useLoans.js query currently returns 400 error
  ⚠ Loans table not displaying (query issue)
  ⚠ Need to test edge function with actual data

Previous Recommendations (from AI):
  - Some suggestions deferred to Phase 2 (weekly fees, consolidation, expenses)
  - Focus on MVP: Clients, Loans, Payments, Interest, Reports
  - No TypeScript complexity (all JavaScript code)
  - Antigravity handles all implementation

Questions for Sukumar:
  1. Should we remove rate_id column from loans (legacy)?
  2. Should we add product_id as foreign key?
  3. Can we test edge function directly before using from UI?

================================================================================
FILES TO REVIEW IN SUPABASE
================================================================================

SQL to run:

-- Verify schema
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'loans' ORDER BY ordinal_position;

SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'loan_balances' ORDER BY ordinal_position;

SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'repayment_schedule' ORDER BY ordinal_position;

-- Test query
SELECT id, loan_number, loan_amount, status, start_date, term,
       annual_interest_rate, instalments_due, repayment_amount,
       client_id, product_id,
       loan_balances(current_outstanding_balance, outstanding_principal,
                     outstanding_interest, unpaid_fees)
FROM loans
ORDER BY created_at DESC
LIMIT 5;

-- Test edge function (in Supabase Functions dashboard)
Test create-loan with sample data:
{
  "client_id": "valid-uuid",
  "product_id": "valid-uuid",
  "loan_amount": 5000,
  "establishment_fee": 250,
  "start_date": "2025-12-16",
  "term": "Monthly"
}

================================================================================
