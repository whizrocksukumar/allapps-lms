================================================================================
ANTIGRAVITY AI - MASTER HANDOFF DOCUMENT
================================================================================
Project: All Apps LMS (Loan Management System)
Date: December 17, 2025
Status: COMPLETE SPECIFICATION - READY FOR IMPLEMENTATION
Contact: Sukumar (All Apps Ltd, Wellington, NZ)

CRITICAL: Implementation order matters. All tasks sequenced to avoid dependencies.
Do NOT skip steps. Each builds on the previous one.

================================================================================
SECTION 0: EXECUTIVE SUMMARY
================================================================================

**CURRENT STATE:**
✅ Database schema complete (15 tables)
✅ Edge Function create-loan working and tested (L10007 created successfully)
✅ React frontend structure in place (7 pages, sidebar, modals)
✅ 5 test clients with consolidated loans (L10001-L10007)
✅ 38+ dummy transactions loaded

**YOUR DELIVERABLES:**
1. Complete all React component updates
2. Implement all Edge Functions  
3. Populate any missing test data
4. Verify all features work end-to-end
5. Document everything for production deployment

**TIMELINE:** 2-3 weeks
**BUDGET:** $50 AUD/month (Supabase + Vercel hosted)
**TECH STACK:** React + Vite, Supabase (PostgreSQL), Vercel, Typescript Edge Functions

================================================================================
SECTION 1: DATABASE SCHEMA (COMPLETE REFERENCE)
================================================================================

Run this SQL in Supabase SQL Editor to export full schema:
File: /mnt/user-data/outputs/SQL-EXPORT-SCHEMA-IN-BULK.sql

Key Tables (15 total):
1. clients - Customer master data (first_name, last_name, email, phone, etc)
2. loans - Loan accounts (principal, rate, term, status)
3. loan_products - 4 fixed products (5.5%, 7.2%, 9.5%, 12%)
4. loan_balances - Running balance (SINGLE SOURCE OF TRUTH)
5. repayment_schedule - Payment dates & amounts
6. transactions - Audit trail (all debits/credits)
7. fee_tiers - Fee definitions (establishment, management, admin, dishonor)
8. fee_applications - Applied fees with status (pending/collected/waived)
9. fee_waiver_audit - Immutable waiver log
10. interest_calculations - Daily interest accrual
11. payment_reconciliation - Manual payment matching
12. repayments - Payment records
13. auth.users - Supabase auth
14-15. Supporting tables

**DATA STATUS:**
✅ 5 active test clients
✅ 6 active loans (L10001-L10004, L10007) + 1 closed (L10005)
✅ 38+ transactions loaded
❌ Phone numbers (mobile, work, home) - all NULL
❌ Company names - all NULL
❌ Credit ratings - all NULL
✅ Employment status - populated
✅ ID types & numbers - populated
✅ Monthly income - populated

---

**DATABASE FUNCTIONS ALREADY DEPLOYED:**

The following functions exist in Supabase and are ready to use:

1. **allocate_payment(p_loan_id, p_amount)** - Allocates payment to repayments
2. **allocate_payment_to_loan(p_reconciliation_id)** - Complex allocation with fees/interest/principal
3. **apply_daily_interest()** - Trigger function for daily interest
4. **apply_dishonor_fee(p_loan_id, p_customer_id)** - Applies $5 dishonor fee
5. **apply_dishonor_fee_if_needed(p_loan_id, p_customer_id, p_payment_amount)** - Conditional dishonor fee
6. **apply_weekly_fees()** - Applies management ($25) + admin ($2) fees weekly
7. **calculate_daily_interest()** - 2 versions: (1) bulk processor, (2) single loan calculator
8. **calculate_end_date()** - Trigger to set loan end_date
9. **calculate_fee_anniversary_day(start_date)** - Gets day of week for fee anniversary
10. **calculate_simple_interest(p_principal, p_annual_rate, p_days)** - Simple interest formula
11. **check_overdue_payments()** - Marks overdue loans and repayments
12. **consolidate_loans(p_customer_id, p_loan_ids[], ...)** - Creates consolidated loan
13. **create_loan_balance()** - Trigger to create loan_balances on loan insert
14. **create_repayment_schedule()** - 2 versions: (1) trigger-based, (2) function-based
15. **generate_customer_code()** - Auto-generates AAL10001 format codes
16. **generate_loan_number()** - Auto-generates L10001 format numbers
17. **generate_repayment_schedule()** - Calculates total payment periods
18. **get_customer_summary(p_customer_id)** - Returns complete customer dashboard data
19. **handle_new_user()** - Trigger for auth.users → app_users sync
20. **trigger_allocate_payment()** - Trigger wrapper for payment allocation
21. **trigger_set_timestamp()** - Sets updated_at on all table updates
22. **update_loan_term_periods()** - Calculates term periods based on repayment
23. **update_loans_timestamp()** - Updates loans.updated_at
24. **update_repayment_schedule_on_payment()** - Marks repayment as paid

**CRITICAL NOTES ON FUNCTIONS:**
- Many functions have business logic already implemented
- Some may conflict with Edge Functions you need to create
- Review each before deploying Edge Functions (avoid duplication)
- Example: apply_weekly_fees() exists as trigger - keep or replace with Edge Function?

================================================================================
SECTION 2: EDGE FUNCTIONS (3 REQUIRED)
================================================================================

**EDGE FUNCTION 1: create-loan**
Status: ⏳ IMPLEMENTATION BY ANTIGRAVITY (Code provided)
Location: `supabase/functions/create-loan/index.ts`

Code: See NOTE-TO-ANTIGRAVITY-CREATE-LOAN-CLARIFICATIONS.md (full TypeScript provided)

Key Requirements:
- ✓ Tiered establishment fees ($45-$495 based on loan_amount)
- ✓ Daily interest accrual (outstanding_interest starts at 0)
- ✓ Uses fee_applications table for establishment fee
- ✓ Uses client_id (NOT customer_id)
- ✓ Creates loan_balances with clean initialization
- ✓ Generates repayment_schedule
- ✓ Logs ADV + EST transactions

Receives:
- client_id, product_id, loan_amount, establishment_fee (optional)
- start_date, term, is_consolidation, source

Returns: Created loan object with loan_number (L10001 format)

**STATUS:** Antigravity version needs 3 corrections (see clarifications doc)

---

**EDGE FUNCTION 2: allocate-payment**
Status: PROVIDED (ready to deploy)
Code: Provided above in your message

Function receives:
- loan_id (UUID)
- amount (decimal)
- reference (string, optional - bank reference)

Allocation logic (STRICT ORDER):
1. Establishment fees (once only)
2. Management fees ($25 weekly, multiple if unpaid)
3. Admin fees ($2 weekly, multiple if unpaid)
4. Dishonor fees ($5 per incident)
5. Interest accrued
6. Principal

Updates loan_balances with allocation breakdown

---

**EDGE FUNCTION 3: apply-weekly-fees** (NEW - CREATE THIS)
Trigger: n8n scheduled job (every Monday 00:01 NZ time)

Function logic:
```
GET all loans WHERE status = 'active'
FOR each loan:
  - Check if management fee ($25) already applied this week
  - Check if admin fee ($2) already applied this week
  - IF NOT applied this week:
    - INSERT fee_applications (status='pending')
    - Log MGMT + FACC transactions
RETURN { processed: count }
```

===================================================== ===
SECTION 3: REACT COMPONENTS (7 TOTAL)
================================================================================

**COMPONENT 1: Client360Modal.jsx** (UPDATE - HIGH PRIORITY)

Changes required:
1. Add contact header (above both cards):
   - Email: [mailto:] | Mobile: [tel:+64] | Work: [tel:] | Home: [tel:]
   - formatPhoneLink() function to convert to tel: links

2. LEFT card (Contact Info) - NEW ORDER:
   - Company Name
   - Address, City, Region, Postcode
   - Employment Status
   - Status

3. RIGHT card (Client Details) - NEW ORDER:
   - Client Type
   - Date of Birth (format dd-mm-yyyy)
   - Gender, Occupation
   - ID Type, ID Number
   - Monthly Income (format $X,XXX.XX)
   - Credit Rating

Reference: /mnt/user-data/outputs/CLIENT360MODAL-UPDATE-REQUIREMENTS.md

---

**COMPONENT 2: Loans.jsx** (UPDATE - COMPLETE)

✅ Already updated. Use file:
/mnt/user-data/outputs/Loans-UPDATED-SORTABLE-FUZZY.jsx

Features:
- "Loan No." header (was "Loan #")
- "Client Name" with company shown below
- Sortable headers (Loan No., Client Name, Status, Opened)
- Fuzzy search (loan number, client name, company, status)

---

**COMPONENT 3: NewLoanModal.jsx** (UPDATE - MEDIUM PRIORITY)

Changes:
1. Add "Consolidation?" checkbox
2. If NEW LOAN: Show standard fields
3. If CONSOLIDATION:
   - Auto-populate Principal from current_outstanding_balance
   - Show consolidation message

4. Send consolidation flag to create-loan:
```javascript
is_consolidation: formData.isConsolidation,
source: formData.isConsolidation ? 'consolidation' : 'new'
```

---

**COMPONENT 4: FeeManagementPage.jsx** (NEW - MEDIUM PRIORITY)

Features:
1. Loan selector dropdown
2. Three tabs:
   - Pending Fees (with Waive button)
   - Fee History (all fees, all statuses)
   - Audit Trail (waiver history)
3. "Add Custom Fee" button
4. Filters: Date range, Fee type, Status

---

**COMPONENT 5: FeeWaiverModal.jsx** (NEW - SMALL)

Display:
- Fee details (read-only)
- Reason textarea (required)
- Confirm/Cancel buttons

On confirm:
- UPDATE fee_applications (status='waived', waived_by, waive_reason)
- INSERT fee_waiver_audit (immutable log)

---

**COMPONENT 6: CustomFeeModal.jsx** (NEW - SMALL)

Fields:
- Loan selector
- Fee type dropdown
- Amount input
- Reason textarea (required)

On confirm:
- INSERT fee_applications
- INSERT transaction (CFEE type)

---

**COMPONENT 7: Loans360Modal.jsx** (VIEW ONLY - NO CHANGES)

No changes needed for MVP.

================================================================================
SECTION 4: BUSINESS RULES
================================================================================

**RULE: Interest Calculation (Daily)**
- Formula: (Outstanding Balance × Annual Rate ÷ 365) ÷ 100
- Frequency: Daily at 11:59 PM NZ time
- Rounding: Nearest cent
- Applied: If result ≥ $0.01

**RULE: Fee Tiers (Establishment)**
- $0-$99.99 → $45
- $100-$499.99 → $150
- $500-$4,999.99 → $250
- $5,000+ → $495

**RULE: Recurring Fees**
- Management: $25/week (auto)
- Admin: $2/week (auto)
- Dishonor: $5 (when payment fails)
- All tracked in fee_applications & fee_waiver_audit

**RULE: Payment Allocation (STRICT ORDER)**
1. Establishment fees (once only)
2. Management fees (accumulated unpaid)
3. Admin fees (accumulated unpaid)
4. Dishonor fees
5. Interest
6. Principal

**RULE: Consolidation**
- Only ONE active loan per client
- Old loan → status='closed', source='consolidation'
- New loan → source='consolidation'

================================================================================
SECTION 5: TEST DATA STATUS & ACTIONS
================================================================================

**DATA GAPS TO POPULATE:**

```sql
-- Add phone numbers for testing phone links
UPDATE clients SET
  mobile_phone = '021234567',
  work_phone = '02 123 4567',
  home_phone = '04 987 6543',
  company_name = 'Test Company ' || first_name,
  client_type = 'individual'
WHERE first_name IN ('Dwinder', 'Lila', 'Anna', 'Raj');

-- Add credit ratings
UPDATE clients SET credit_rating = 750 WHERE first_name = 'Dwinder';
UPDATE clients SET credit_rating = 680 WHERE first_name = 'Lila';
UPDATE clients SET credit_rating = 720 WHERE first_name = 'Anna';
UPDATE clients SET credit_rating = 780 WHERE first_name LIKE 'Raj%';
```

================================================================================
SECTION 6: IMPLEMENTATION SEQUENCE
================================================================================

**PHASE 1: Database & Edge Functions (Week 1)**

1.1: Export schema
- Run SQL-EXPORT-SCHEMA-IN-BULK.sql
- Verify all 15 tables exist

1.2: Create apply-weekly-fees Edge Function
- Deploy to supabase/functions/apply-weekly-fees
- Test: Manual invoke
- Verify: fee_applications records created

1.3: Create process-dishonor-fee Edge Function
- Deploy to supabase/functions/process-dishonor-fee
- Test: Trigger via failed payment

1.4: Update create-loan Edge Function
- Add establishment fee logic
- Add loan_balances initialization
- Add repayment_schedule entry
- Test: Create new loan L10008

1.5: Deploy allocate-payment Edge Function
- File ready, deploy as-is
- Test: $1000 payment allocation

1.6: Populate test data
- Run SQL UPDATEs above
- Verify phones, company names, credit ratings populated

**PHASE 2: React Components (Week 2)**

2.1: Update Client360Modal.jsx
2.2: Create FeeManagementPage.jsx
2.3: Create FeeWaiverModal.jsx
2.4: Create CustomFeeModal.jsx
2.5: Update NewLoanModal.jsx
2.6: Verify Loans.jsx (should already be updated)

**PHASE 3: Testing (Week 3)**

3.1: End-to-end payment test
3.2: Weekly fee application test
3.3: Consolidation test
3.4: Fee waiver test
3.5: Dashboard verification
3.6: Final QA all 7 pages

**PHASE 4: Deployment**

4.1: Build for Vercel
4.2: Test on Vercel staging
4.3: Production deployment
4.4: Embed in Whizrock iframe

================================================================================
SECTION 7: CRITICAL NOTES
================================================================================

DO NOT:
- Modify payment allocation order
- Hard-code fee amounts (use fee_tiers table)
- Skip consolidation logic
- Modify audit trails

DO:
- Use Typescript for Edge Functions
- Log all operations
- Test with sample data
- Keep audit trails immutable
- Format dates dd-mm-yyyy
- Format currency $X,XXX.XX

NZ COMPLIANCE:
- Financial year April 1 - March 31
- Interest daily (not compound)
- All audit trails immutable
- All waivers tracked with reason

================================================================================
READY TO START?
================================================================================

Confirm before beginning:
☐ Can access Supabase SQL Editor
☐ Can deploy Edge Functions
☐ Can modify React files in /mnt/project
☐ Understand payment allocation order
☐ Understand consolidation rules

Start with PHASE 1, Task 1.1.
Ask Sukumar if anything unclear.