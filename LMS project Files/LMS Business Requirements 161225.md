All Apps Ltd - Loan Management System
Business Requirements Document
Document Version: 2.0
Date: July 14, 2025
Company: All Apps Ltd
Project: Comprehensive Loan Management System
1. Executive Summary
All Apps Ltd requires a comprehensive loan management system to manage
individual loans across short-term and long-term products with varying interest rates.
The system must handle thousands of customers, provide complete audit trails,
enable bank reconciliation through CSV uploads, and maintain compliance with New
Zealand financial regulations.
2. Business Context
2.1 Current Business Model
● Primary Business: Advancing loans to individuals
● Loan Types: Short-term and long-term loans
● Interest Calculation: Daily compounding interest
● Customer Base: Thousands of individual borrowers
● Geographic Scope: New Zealand operations
2.2 Current Challenges
● Manual loan tracking and management
● Lack of automated interest calculations
● No centralized customer view
● Manual bank reconciliation processes
● Limited audit trail capabilities
● No systematic reporting
● Compliance concerns with manual processes
3. Functional Requirements
3.1 Customer Management
REQ-CM-001: The system must store comprehensive customer information
● Personal details (name, contact information, address)
● Identification details for compliance
● Customer status (Active, Inactive, Suspended)
● Registration date and source
● Complete interaction history
REQ-CM-002: The system must provide a 360-degree customer view
● All active and historical loans
● Total outstanding amounts across all loans
● Payment history and patterns
● Risk indicators and flags
● Communication history
REQ-CM-003: The system must support customer search and filtering
● Search by name, email, phone, or customer ID & address
● Filter by status, location, or loan activity
● Sort by various criteria
● Export customer lists for analysis
3.2 Loan Product Management
REQ-LP-001: The system must support multiple loan products
● Current Products Required:
○ Short Term 5.50% interest rate
○ Short Term 7.20% interest rate
○ Long Term 9.50% interest rate
○ Long Term 12.00% interest rate
● Ability to add new products with new interest rates without system changes
● Product activation/deactivation capabilities
REQ-LP-002: Each loan product must define:
● Interest rate (annual percentage)
● Minimum and maximum loan amounts
● Term length parameters
● Associated fees and charges
● Eligibility criteria
● Product status (Active/Inactive)
3.3 Loan Origination and Management
REQ-LM-001: The system must support complete loan lifecycle management
● Loan application processing
● Loan approval workflow
● Loan disbursement tracking
● Ongoing loan monitoring
● Loan closure processes
● Loan refinancing
REQ-LM-002: For each loan, the system must track:
● Unique loan identifier
● Associated customer
● Loan product type
● Original principal amount
● Current outstanding balance (principal + accumulated interest + unpaid
fees)
● Principal balance component (for tax calculation)
● Interest balance component (for tax calculation)
● Unpaid fees balance (management fees, dishonor charges, etc.)
● Interest rate
● Start and end dates
● Weekly fee anniversary day (based on loan start date)
● Current status (Active, Paid, Defaulted, Consolidated)
● Payment schedule
● Total interest charged to date
● Total interest collected to date
● Total principal collected to date
● Total fees charged and collected
REQ-LM-003: The system must handle loan consolidation
● Combine multiple existing loans into a new single loan
● Transfer outstanding balances from old loans to new loan
● Mark consolidated loans appropriately
● Maintain complete audit trail of consolidation process
● Apply this as standard practice for existing customers with outstanding
amounts
3.4 Interest Calculation and Management
REQ-IC-001: The system must calculate interest on a daily basis
● Formula: Daily Interest = (Outstanding Balance × Annual Rate ÷ 365) ÷ 100
● Apply calculations automatically each day
● Compound interest (add daily interest to outstanding balance)
● Handle different rates for different loan products
● Process calculations for all active loans simultaneously
REQ-IC-002: Interest calculation accuracy requirements
● Calculations must be precise to two decimal places
● System must handle leap years correctly
● Backdated calculations for missed days
● Manual adjustment capabilities with audit trail
3.5 Fee Management
REQ-FM-001: The system must support various fee types
● Management fees: $25 charged weekly to all active loans
● Cheque dishonor charges: $5 per occurrence for failed payments
● Establishment feesUpto $100= $45
$101-$399= $95
$400-$999= $195
$1000-$1999= $295
$2000- $2999= $395
$3000-$5000+= 495
There should be flexibility to change the establishment and put any amount as
required.
● Late payment fees $5/week
● Early repayment fees-None
● Administrative fees: $2/Week
● Custom fees as needed
REQ-FM-002: Fee application and scheduling
● One-time fees
● Recurring fees (daily, weekly, monthly, annually)
● Automatic fee application based on triggers
● Manual fee application with justification
● Fee reversal capabilities with approval workflow
3.6 Bank Reconciliation and Transaction Management
REQ-TR-001: CSV file upload and processing
● Support standard bank CSV formats
● Map CSV columns to transaction fields
● Validate data integrity during upload
● Handle various date and currency formats
● Error reporting for failed uploads
REQ-TR-002: Transaction processing capabilities
● Import bank transactions via CSV upload
● Manual transaction entry
● Transaction categorization (Payment, Fee, Interest, etc.)
● Reference matching to specific loans
● Duplicate transaction detection and prevention
REQ-TR-003: Specific fee management requirements
● Management Fees: No management Fee
● Direct Dishonor Charges: $5 per occurrence automatically applied when
dishonored payments detected in uploaded bank statements
● Dishonor Detection: System must identify failed/returned payments from
bank CSV data and trigger automatic fee application
● Automatic fee application based on schedule and triggers
● Manual fee application with reason codes
● Fee reversal capabilities with approval workflow
● Fee waiver functionality with authorization levels
REQ-TR-004: Bank reconciliation workflow
● Display unreconciled transactions
● Match transactions to customers and loans
● Automatic matching suggestions based on amount and date
● Manual matching capabilities
● Payment allocation tracking: Separate principal, interest, and fee
components for each payment
● Reconciliation status tracking
● Exception handling for unmatched transactions
● Tax reporting integration: Ensure payment allocations support income
calculation requirements
3.7 Reporting and Analytics
REQ-RP-001: Standard company reports
● Portfolio Summary Report:
○ Total active loans count and value
○ Total outstanding balance across all loans
○ Interest income generated (daily, monthly, annual)
○ Average loan size and interest rate
○ Loan distribution by product type
● Customer Analysis Report:
○ Customer count by status
○ Top customers by outstanding balance
○ Customer acquisition trends
○ Geographic distribution
○ Customer risk analysis
● Financial Performance Report:
○ Daily interest income
○ Fee income by type
○ Collection efficiency metrics
○ Loan loss provisions
○ Profitability by loan product
● Tax Calculation Report:
○ Principal and interest breakdown by loan for selected periods
○ Total collections segregated into principal vs. interest components
○ Income calculation (all collections less principal repayments)
○ Interest earned vs. interest collected reconciliation
○ Period-specific income statements for tax filing purposes
REQ-RP-002: Operational reports
● Daily reconciliation status
● Overdue loan listings
● Upcoming maturity report
● Exception reports (failed calculations, unreconciled transactions)
● Audit trail reports
REQ-RP-003: Report filtering and period selection
● Date Range Selection: All reports must support custom start and end date
selection
● Predefined Periods: Quick selection options (Current Month, Last Month,
Quarter, Year-to-Date, Financial Year: April 1 - March 31)
● New Zealand Financial Year: Default financial year periods follow NZ tax
year (April 1 to March 31)
● Real-time Filtering: Dynamic report updates based on selected criteria
● Period Comparison: Ability to compare metrics across different time periods
● Export Functionality: Export filtered reports in multiple formats (PDF, Excel,
CSV)
REQ-RP-004: Compliance reports
● Loan register (complete loan inventory)
● Customer due diligence reports
● Transaction monitoring reports
● Data retention compliance reports
● Regulatory submission reports
4. Non-Functional Requirements
4.1 Performance Requirements
REQ-PF-001: System must handle thousands of customers efficiently
● Support minimum 5,000 active customers
● Process daily interest calculations for all loans within 30 minutes
● Generate reports within 60 seconds for standard queries
● Support concurrent users (minimum 10 simultaneous users)
REQ-PF-002: Data processing requirements
● CSV uploads up to 10,000 transactions
● Real-time transaction processing
● Batch processing for end-of-day operations
● Automated backup and recovery procedures
4.2 Security Requirements
REQ-SC-001: Data protection and privacy
● Encrypt sensitive customer data
● Secure user authentication and authorization
● Role-based access control
● Audit trail for all data access and modifications
● Comply with New Zealand Privacy Act 2020
REQ-SC-002: System security
● HTTPS encryption for all communications
● Regular data backups with secure storage
● User session management
● Password complexity requirements
● Account lockout after failed attempts
4.3 Compliance Requirements
REQ-CP-001: New Zealand regulatory compliance
● Anti-Money Laundering and Countering Financing of Terrorism
(AML/CFT) Act:
○ Customer due diligence records
○ Transaction monitoring capabilities
○ Suspicious activity reporting
○ Record retention for 5 years minimum
● Privacy Act 2020:
○ Consent management
○ Data access and correction rights
○ Breach notification capabilities
○ Data retention and disposal
● Financial Markets Authority (FMA) requirements:
○ Proper accounting records
○ Audit trail maintenance
○ Governance documentation
○ Risk management records
REQ-CP-002: Record retention
● Maintain all records for minimum 7 years
● Immutable audit trail
● Secure archival processes
● Retrieval capabilities for historical data
4.4 Usability Requirements
REQ-US-001: User interface requirements
● Intuitive design for non-technical users
● Responsive design for desktop and tablet use
● Clear navigation structure
● Comprehensive help documentation
● Error messages with clear guidance
REQ-US-002: User experience requirements
● Maximum 3 clicks to reach any major function
● Quick search capabilities across all modules
● Bulk operations for common tasks
● Export capabilities for all reports and lists
● Customizable dashboard views
5. User Roles and Permissions
5.1 System Administrator
Permissions:
● Full system access and configuration
● User management and role assignment
● System settings and loan product management
● Audit log access
● Data export and backup management
5.2 Loan Manager
Permissions:
● Customer and loan management
● Transaction processing and reconciliation
● Report generation and analysis
● Fee application and adjustment
● Loan consolidation approval
5.3 Operations User
Permissions:
● Customer data entry and updates
● Transaction entry and basic reconciliation
● Standard report viewing
● Customer inquiry responses
● Basic loan servicing tasks
5.4 Read-Only User
Permissions:
● View customer and loan information
● Access to standard reports
● Export capabilities for assigned data
● No modification rights
6. Business Rules
6.1 Loan Business Rules
BR-LN-001: Interest calculation rules
● Interest calculated daily at 11:59 PM NZ time
● Minimum balance for interest calculation: $0.01
● Interest rounded to nearest cent
● No negative interest calculations
BR-LN-002: Loan consolidation rules
● Only active loans can be consolidated
● Consolidated loan inherits highest interest rate of component loans
● Original loans marked as "Consolidated" status
● New loan starts fresh amortization schedule
BR-LN-003: Payment application rules
● Payments applied first to fees, then interest, then principal
● Overpayments held as credit balance
● Partial payments allocated proportionally
6.2 Customer Business Rules
BR-CM-001: Customer account rules
● One customer record per individual
● Unique email address required
● Customer ID auto-generated and immutable
● Customer status changes require approval
6.3 Fee Business Rules
BR-FM-001: Fee application rules
● Management fees: $25 applied automatically every week on the same day
as loan start date (e.g., loan started Tuesday = charged every Tuesday)
● Cheque dishonor charges: $5 applied automatically when dishonored
payment detected in uploaded bank statements
● Late fees applied automatically after grace period
● Maximum fee limits per loan product
● Fee waivers require manager approval
● Fees can be reversed within 24 hours of application
BR-FM-002: Payment allocation rules for tax purposes
● Simplified allocation: Payments reduce total outstanding balance on the day
(principal + accrued interest + all fees)
● Outstanding balance composition: Principal balance + accumulated daily
interest + unpaid fees
● Clear separation of principal vs. interest components for tax reporting
● Income recognition: All collections minus principal repayments
● Interest earned vs. interest collected tracking for accrual vs. cash accounting
7. Integration Requirements
7.1 Current Integration Needs
REQ-IN-001: No external system integrations required initially
● Self-contained system
● Manual data entry acceptable for initial implementation
● CSV import/export capabilities sufficient
7.2 Future Integration Considerations
● Bank API connections for real-time transaction feeds
● Credit bureau integrations for risk assessment
● Accounting system integration
● Payment gateway connections
● Regulatory reporting system connections
8. Data Requirements
8.1 Data Volume Estimates
● Customers: 5,000+ active customers
● Loans: 10,000+ total loans (historical and active)
● Transactions: 50,000+ annual transactions
● Growth rate: 20% annual increase
8.2 Data Retention Requirements
● Active data: Immediate access required
● Historical data: 7-year retention minimum
● Archived data: Secure storage with retrieval capability
● Backup frequency: Daily incremental, weekly full backup
9. Success Criteria
9.1 Functional Success Criteria
● Successfully process daily interest calculations for all active loans
● Complete bank reconciliation process within 24 hours of CSV upload
● Generate all required reports within specified time limits
● Handle loan consolidation process with complete audit trail
● Maintain 99.9% data accuracy in calculations
9.2 Business Success Criteria
● Reduce manual processing time by 80%
● Improve customer inquiry response time to under 2 minutes
● Achieve 100% compliance with regulatory requirements
● Increase operational efficiency by 50%
● Eliminate manual calculation errors
9.3 Technical Success Criteria
● System availability of 99.5% during business hours
● Support concurrent user load without performance degradation
● Complete data backup and recovery tested successfully
● All security requirements implemented and verified