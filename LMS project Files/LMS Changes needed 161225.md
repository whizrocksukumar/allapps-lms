Clients:

Supabase and correspondingly all appropriate pages needs to have 2 more files for phone numbers: the current Phoen to be changed to Mobile and Work and hOme to be added.
Remove company name from header. 
Add 2 columns Loan # and Date Opened (date loan commenced “Start Date”) - These can appear after the status field.
Contact Name, Region, Phone fields should be sortable. Region particularly can be filterable
The Search box needs to be fuzzy global search .
Remove Prospect from the buttons. 
The Active, Export, Import buttons are not working.
The layout of the buttons are not uniform
No Print option present. Add button. The export should be to Excel as CSV and Print should be to PDF. Page print layouts should auto adjust to the format being exported to or printed to.
The View Client modal is missing “Client Type, Status”. Add to the Client Details column.
“Add New Client” should have all the fields that are currently reflected in the cards of a client in the client view modal including Client type.
A “Add New Loan” button needs to be added next to “Add New Contact” Modal. A “Add New Loan” Modal needs to be created under components


Loans:


Loan Products
The ‘Term” field needs to be changed to a dropdown rather than the current integer field. The dropdown options need to be Weekly, Fortnightly and Monthly. Whether we use this or there is another column called “repayment_frequency”. This may need consolidation of the 2 fields.
The above needs to be reflected under the header column Term in the loans page
The loans page is reflecting the Product ID under Rate ID column. The field that needs to be reflected here is “annual_interest_rate”


Add New Loan
Add new modal to be created under components with a box from where a client can be selected. 
Loan number to be auto Generated. A checkbox if it is a New Loan or Consolidation option to be be provided (required field)
If new loan is selected - then the following fields need to be available: Principal Amount, Establishment fee, Loan Term, Start Date, Annual Interest rate - (Beside or within the dropdown, annual interest rate an option to add new loan product to be available)
If Consolidation is selected - then the following fields need to be available: Principal Amount - this box needs to autopopulate from the current_balance of the existing loan, Establishment fee, Loan Term, Start Date, Annual Interest rate - (Beside or within the dropdown, annual interest rate an option to add new loan product to be available). 
The source should be updated to reflect the new or consolidation status
Transactions
Each Client Transactions should have a reference from the following options:
ADV = Loan Advance (Initial loan disbursement)
EST = Establishment Fee
INT = Interest
FACC = Fee - Account/Administrative Charge
PAY = Payment (customer payment in)
AP = Additional Payment

The above needs to be stored in look up table under transaction_type” in “Transactions” table and needs to be reflected in the Transactions view as below for each Client Loan in the loan Details Modal:


Date
Reference
Transaction_type
Debit
Credit
Balance
Notes
10/07/2024
ADV
ADV
15,000.00


15,000.00
Loan Advance
10/07/2024


EST
495


15,495.00


16/07/2024
Interest
INT
74.26


15,569.26
Interest from 10/07/2024 to 16/07/2024 (7 days) at 24.99%
17/07/2024


FACC
3


15,572.26


23/07/2024
AP
PAY


450
15,122.26
BNZ
23/07/2024
Interest
INT
74.32


15,196.58
Interest from 17/07/2024 to 23/07/2024 (7 days) at 24.99%
24/07/2024


FACC
3


15,199.58


30/07/2024
Interest
INT
72.85


15,272.43
Interest from 24/07/2024 to 30/07/2024 (7 days) at 24.99%
31/07/2024


FACC
3


15,275.43


06/08/2024
AP
PAY


450
14,825.43
BNZ
06/08/2024
Interest
INT
72.9


14,898.33
Interest from 31/07/2024 to 06/08/2024 (7 days) at 24.99%



Loans Details Modal:


The repayment schedule: This is currently reflected as a table in the loan details modal. This should be either a separate modal or a page (recommend modal - since to be used in multiple places. This needs a Link to the Repayment schedule modal under Loan Information Card .
As soon as a new loan is created , the repayment schedule needs to be created. See BRD document for rules. Also check if the edge function has already been created in supabase for the calculation.
The Repayment Schedule modal needs to have an export to excel and Print to pdf options as in Loan Details Modal. 
The current Loan Details Modal title font color is in black - change to White


Repayments (for each individual loan) : this is the menu in the side bar:

This is exactly as the repayment schedule but with an extra column for actual date of repayment which is updated when a payment entry is made. Rule needs to be created as an edge function
Repayment Statement. A client may need a repayment transaction statement. Ability to export, print to PDF and send by email option should be present on this page. The repayment transactions.
The transaction table shown above could be reused to create the repayment transactions

Reports:

Portfolio Summary Report: - this report can be presented in the dashboard as cards or as a single card. Should be able to be filtered by from and to date date selector fields
Total active loans count and value 
Total outstanding balance across all loans 
Interest income generated (daily, monthly, annual) 
Average loan size and interest rate 
Loan distribution by product type


Customer Analysis Report: presented in dashboard as cards or table as appropriate. Should be selectable by geographic location - which is Region/City in our case and by date selectors from and to
Customer count by status 
Top customers by outstanding balance 
Customer acquisition trends 
Geographic distribution 
Financial Performance Report: again in dashboard selectable by dates and compared to previous period, date,etc for 
All types of income eg interest income, Fees income by type, e establishment fees, etc
Tax and  Profit & Loss: this needs to be under menu item reports
Profit and loss by the financial year, date selectable and compared to period
Principal and interest breakdown by loan for selected periods ○ Total collections segregated into principal vs. interest components ○ Income calculation (all collections less principal repayments) ○ Interest earned vs. interest collected reconciliation ○ Period-specific income statements for tax filing purposes

Supabase: we need a new table for capturing expense information for the company. Use a standard chart of accounts for expenses

Expenses: need a separate menu item for entering expenses, with chart of accounts as dropdown, reference, date, amount and notes.
 

