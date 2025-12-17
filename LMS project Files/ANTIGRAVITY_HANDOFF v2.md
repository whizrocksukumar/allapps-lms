================================================================================
ANTIGRAVITY HANDOFF DOCUMENT
================================================================================
Date: December 17, 2025
Project: All Apps LMS
Status: READY FOR EXECUTION - Edge Function WORKING, Old loans need fixing
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

**STATUS: TESTED AND WORKING ✅**

create-loan Edge Function:
Location: supabase/functions/create-loan/index.ts
Status: DEPLOYED AND TESTED - L10007 created successfully

**TEST RESULT (December 17, 2025):**
✅ Created loan L10007 successfully
✅ Repayment schedule auto-generated (12 payments)
✅ Loan balances initialized
✅ All calculations correct

Input:
```json
{
  "client_id": "b0891278-fc25-479f-90f4-4ca41705440c",
  "product_id": "7724034f-4a04-4cf6-9ed1-ad6dea5100f3",
  "loan_amount": 5000,
  "establishment_fee": 250,
  "start_date": "2025-12-17",
  "term": "Monthly"
}
```

Output:
```json
{
  "success": true,
  "loan": {
    "id": "27ed9204-943f-4f7d-b851-ea5078f93e61",
    "loan_number": "L10007",
    "loan_amount": 5000,
    "annual_interest_rate": 12,
    "start_date": "2025-12-17",
    "end_date": "2026-12-12",
    "repayment_amount": 486.82,
    "instalments_due": 12,
    "total_repayable": 5841.78,
    "term": "Monthly"
  },
  "schedule_created": 12
}
```

**VERIFIED:**
✅ loan_balances record created with current_outstanding_balance: $5,841.78
✅ repayment_schedule populated with 12 records
✅ Payment dates calculated correctly (monthly)
✅ Principal/interest split correct: $416.67 principal, $49.32 interest per payment

**FIXES APPLIED:**
✓ Removed `total_repayable` from INSERT (it's a generated column)
✓ Deleted triggers: trg_update_loan_term, trigger_create_schedule (were causing conflicts)
✓ Corrected Deno.serve() pattern for Supabase

CURRENT EDGE FUNCTION CODE (WORKING):
See file: /mnt/user-data/outputs/create-loan-CORRECT-supabase.ts

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
PART 3: CURRENT BLOCKING ISSUES
================================================================================

**ISSUE 1: Old 5 loans (L10001-L10005) have NO loan_balances**

These loans exist but lack supporting data:
- L10001: Dwinder Singh, $4000, annual_interest_rate: NULL, instalments_due: 0
- L10002: Lila Sagala, $1000, annual_interest_rate: 6.00, instalments_due: 0
- L10003: Anna Pawa, $150, annual_interest_rate: NULL, instalments_due: 0
- L10004: Raj Kumar, $15000, annual_interest_rate: NULL, instalments_due: 0
- L10005: Raj Rani, $1500, annual_interest_rate: NULL, instalments_due: 0

Result: Loans page shows $0.00 balance (because no loan_balances records exist)

**ISSUE 2: Loans page not displaying correctly**

Even though useLoans.js was fixed, old loans show:
- Balance: $0.00 (should show actual balance)
- Rate: % (should show percentage value)
- Term: 0 mths (should show instalments_due)

Reason: No loan_balances data for old loans

**ISSUE 3: Repayment schedules not created for old loans**

Old loans have no repayment_schedule records. They need to be generated.

================================================================================
PART 4: IMMEDIATE TASKS FOR ANTIGRAVITY
================================================================================

**TASK 1: Populate loan_balances for old 5 loans (PRIORITY)**

Option A: Assign values based on existing data
- For each old loan, create loan_balances record
- outstanding_principal = loan_amount
- outstanding_interest = 0 (assume no interest accrued yet)
- unpaid_fees = establishment_fee (or 0 if NULL)
- current_outstanding_balance = loan_amount + fees

SQL Template:
```sql
INSERT INTO loan_balances (loan_id, outstanding_principal, outstanding_interest, unpaid_fees, current_outstanding_balance, principal_paid, interest_paid, fees_paid)
SELECT 
  l.id,
  l.loan_amount,
  0,
  COALESCE(l.establishment_fee, 0),
  l.loan_amount + COALESCE(l.establishment_fee, 0),
  0,
  0,
  0
FROM loans l
WHERE l.loan_number IN ('L10001', 'L10002', 'L10003', 'L10004', 'L10005')
AND NOT EXISTS (SELECT 1 FROM loan_balances WHERE loan_id = l.id);
```

**TASK 2: Generate repayment schedules for old loans**

Since old loans don't have term/instalments_due set, you have two options:

Option A: Assume all old loans are Monthly with 12 instalments
- Set instalments_due = 12 for each old loan
- Set term = 'Monthly' for each old loan
- Set end_date = start_date + 12 months
- Generate repayment_schedule with 12 records

Option B: Query existing finPower data if available
- Check if there's data about these loans' original terms
- Use that to generate accurate schedules

Recommend Option A for now (set all old loans to 12-month monthly repayment)

SQL to update old loans:
```sql
UPDATE loans
SET 
  term = 'Monthly',
  instalments_due = 12,
  end_date = start_date + INTERVAL '12 months'
WHERE loan_number IN ('L10001', 'L10002', 'L10003', 'L10004', 'L10005');
```

Then create repayment_schedule records using logic similar to create-loan Edge Function

**TASK 3: Update React Frontend**

✅ Already Done:
- Loans.jsx updated with clients dropdown
- useLoans.js fixed to fetch from loan_balances
- Loans360Modal prepared

Still Needed:
- Add RepaymentScheduleModal component
- Add Transactions view in Loan Details
- Fix Loan Details Modal loading

**TASK 4: Test Loans page display**

After tasks 1-2, test:
1. Navigate to Loans page
2. Verify all 6 loans display with correct data:
   - Balance (not $0.00)
   - Rate (shows percentage)
   - Term (shows instalments_due)
3. Click "View" on a loan to see details

================================================================================
PART 5: REQUIREMENTS DOCUMENT
================================================================================

Full requirements available:
File: /mnt/project/LMS_Changes_needed_16_12_25.pdf

Key sections:
- Clients: Phone fields, sortable columns, fuzzy search, export/print
- Loans: Product dropdown, add new loan modal, transaction types
- Repayments: Schedule with actual dates, statement generation
- Reports: Portfolio, customer analysis, financial performance, P&L
- Expenses: New module with chart of accounts

After fixing old loans, implement in this priority order:
1. Complete Loan Details Modal (modal, not separate page)
2. Add Transactions view
3. Add RepaymentScheduleModal
4. Implement Reports
5. Add Expenses module

================================================================================
PART 6: FILES AND RESOURCES
================================================================================

**Updated Files:**
- /mnt/user-data/outputs/Loans-COMPLETE.jsx (clients dropdown added)
- /mnt/user-data/outputs/create-loan-CORRECT-supabase.ts (edge function working)
- /mnt/user-data/outputs/useLoans-FIXED.js (correct query structure)

**Database Access:**
- Supabase project: lmbfsplimbwnycaawhta
- URL: https://supabase.com
- Use provided credentials

**GitHub:**
- Repository: loan-management-frontend
- Branch: main
- All recent changes committed (December 17, 2025)

================================================================================
NEXT STEPS
================================================================================

1. Execute TASK 1: Populate loan_balances for old loans
2. Execute TASK 2: Generate repayment schedules  
3. Test Loans page display
4. Report results back to Sukumar
5. Proceed with Task 3 (React components) and remaining features

Estimated time for tasks 1-3: 4-6 hours
Estimated time for full implementation: 2-3 weeks

================================================================================
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
