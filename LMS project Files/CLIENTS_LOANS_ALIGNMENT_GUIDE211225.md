================================================================
SCHEMA & CODE ALIGNMENT - CLIENTS & LOANS DATA POPULATION
================================================================

ISSUE SUMMARY:
- Loans360Modal still has FK ambiguity error
- Fields not populating (Term, Balance, Outstanding, etc.)
- Client360Modal not showing correct data
- term field now INTEGER (fixed in DB), but code not aligned

================================================================
SCHEMA REFERENCE (POST-MIGRATION)
================================================================

LOANS TABLE:
- term: INTEGER (e.g., 12, 52, 26) - number of periods
- repayment_frequency: VARCHAR ('Monthly', 'Weekly', 'Fortnightly')
- instalments_due: INTEGER (same as term)
- annual_interest_rate: NUMERIC
- product_id: UUID (FK to loan_products - PRIMARY)
- rate_id: UUID (FK to loan_products - SECONDARY) ⚠️ AMBIGUOUS
- establishment_fee, start_date, end_date: existing fields

LOAN_BALANCES TABLE:
- current_outstanding_balance: NUMERIC (total owed)
- outstanding_principal: NUMERIC
- outstanding_interest: NUMERIC
- unpaid_fees: NUMERIC
- loan_id: UUID (FK to loans - UNIQUE)

CLIENTS TABLE:
- All existing fields work correctly
- No changes needed

================================================================
FILES THAT NEED UPDATES
================================================================

1. LOANS360MODAL.JSX
   Problem: FK ambiguity error - has TWO relationships to loan_products
   Fix: Specify which FK to use: loan_products!loans_product_id_fkey
   Line to fix: The .select() query joining loan_products
   
   Current (WRONG):
   .select('*, loan_products(*), ...')
   
   Should be:
   .select('*, loan_products!loans_product_id_fkey(*), ...')
   
   Also need to fetch loan_balances for balance data

---

2. USELOANS.JS
   Problem: Fetches term as VARCHAR but now INTEGER
   Fix: Already correct if schema migration was successful
   Verify: term should be displayed as NUMBER + frequency
   
   Example display:
   const displayTerm = `${loan.term} ${loan.repayment_frequency}`;
   // Result: "12 Months" or "52 Weeks"

---

3. LOANS.JSX (Table display)
   Problem: Uses wrong column names
   Current: loan.term_months (doesn't exist)
   Fix: Use loan.term + loan.repayment_frequency
   
   Line 294 should be:
   <td>{loan.term} {loan.repayment_frequency === 'Weekly' ? 'Weeks' : 
                    loan.repayment_frequency === 'Fortnightly' ? 'Fortnights' : 
                    'Months'}</td>

---

4. CLIENT360MODAL.JSX
   Problem: loan_balances not fetched, fields showing $0.00
   Fix: Ensure loan_balances is included in query
   
   Also displays "Original Amount" - this should be loan_amount from loans table
   
   Fields to populate from loan_balances:
   - Current Balance: loan_balances.current_outstanding_balance
   - Outstanding Principal: loan_balances.outstanding_principal
   - Outstanding Interest: loan_balances.outstanding_interest
   - Unpaid Fees: loan_balances.unpaid_fees

---

5. NEWLOANMODAL.JSX (form input)
   Problem: Accepts term_months as form field but DB expects term
   Fix: When submitting, send to edge function as:
   {
     term: parseInt(formData.term_months),
     repayment_frequency: formData.repayment_frequency,
     ...
   }

---

6. CREATE-LOAN EDGE FUNCTION
   Problem: Creates term as text format, not integer
   Fix: Store as INTEGER
   
   When creating:
   term: parseInt(String(term_months))  // Convert to INTEGER
   repayment_frequency: formData.repayment_frequency // Keep as VARCHAR

================================================================
DISPLAY FORMATTING PATTERN (use everywhere)
================================================================

TERM DISPLAY (consistent across all components):
```javascript
const formatTermDisplay = (term, frequency) => {
  if (!term || !frequency) return 'N/A';
  
  const unit = frequency === 'Weekly' ? 'Weeks' :
               frequency === 'Fortnightly' ? 'Fortnights' :
               'Months';
  
  return `${term} ${unit}`;
};

// Usage:
<td>{formatTermDisplay(loan.term, loan.repayment_frequency)}</td>
// Output: "12 Months" or "52 Weeks"
```

================================================================
QUERIES THAT NEED FK SPECIFICATION
================================================================

WHERE loan_products IS JOINED:
- Loans360Modal fetchFullLoanData
- useLoans.js fetchLoans (if it joins loan_products)
- Any other place joining loans to loan_products

FIX SYNTAX:
.select('*, loan_products!loans_product_id_fkey(id, product_name, annual_interest_rate), ...')

This tells Supabase to use the product_id FK, not rate_id.

================================================================
BALANCE DATA REQUIREMENTS
================================================================

All modals showing loan balance must include:
.select('*, loan_balances(*), ...')

Then access as:
- getBalance(loan).current_outstanding_balance
- getBalance(loan).outstanding_principal
- getBalance(loan).outstanding_interest
- getBalance(loan).unpaid_fees

Helper function (already in Client360Modal):
```javascript
const getBalance = (loan) => {
  const balances = Array.isArray(loan.loan_balances) ? 
    loan.loan_balances[0] : loan.loan_balances;
  return balances || {};
};
```

================================================================
PRIORITY ORDER TO FIX
================================================================

1. Loans360Modal - Fix FK ambiguity + term display + balance fetch
2. Loans.jsx - Fix term + frequency display
3. Client360Modal - Already has getBalance helper, just ensure loan_balances is fetched
4. NewLoanModal - Ensure term sent as INTEGER to edge function
5. useLoans.js - Verify term display logic

================================================================
TEST AFTER FIXES
================================================================

✓ Click on loan in Loans table → Loans360Modal opens with populated data
✓ Loans360Modal shows: "12 Months" or "52 Weeks" in Term field
✓ Loans360Modal shows balance from loan_balances
✓ Click on client → Client360Modal shows loans with correct balances
✓ Loans table displays term correctly: "12 Months", "52 Weeks", etc.
✓ New Loan form creates loan with term as integer

================================================================
