================================================================================
ADD NEW CLIENT MODAL - FIELD SPECIFICATIONS
================================================================================

**Location:** src/components/NewClientModal.jsx (NEW COMPONENT)
**Called from:** Clients.jsx (Add Client button)

================================================================================
MODAL LAYOUT & FIELDS
================================================================================

**SECTION 1: BASIC INFORMATION (Required)**

1. First Name (text input) *REQUIRED
   - Field: first_name
   - Placeholder: "John"
   - Validation: Min 2 chars, max 50 chars
   - Auto-trim whitespace

2. Last Name (text input) *REQUIRED
   - Field: last_name
   - Placeholder: "Doe"
   - Validation: Min 2 chars, max 50 chars
   - Auto-trim whitespace

3. Email (email input) *REQUIRED
   - Field: email
   - Placeholder: "john.doe@example.com"
   - Validation: Valid email format
   - Must be unique (check before INSERT)

4. Client Type (dropdown) *REQUIRED
   - Field: client_type
   - Options: "Individual", "Business", "Trust"
   - Default: "Individual"
   - Impacts what other fields are visible

---

**SECTION 2: CONTACT INFORMATION (Optional)**

5. Mobile Phone (text input)
   - Field: mobile_phone
   - Placeholder: "021234567" (NZ format)
   - Format: Accept various formats, store as entered
   - No validation required (can be added/updated later)

6. Work Phone (text input)
   - Field: work_phone
   - Placeholder: "02 123 4567"
   - No validation required

7. Home Phone (text input)
   - Field: home_phone
   - Placeholder: "04 987 6543"
   - No validation required

8. Address (text input)
   - Field: address
   - Placeholder: "123 Main Street"
   - No validation

9. City (text input)
   - Field: city
   - Placeholder: "Wellington"
   - No validation

10. Postcode (text input)
    - Field: postcode
    - Placeholder: "6012"
    - No validation

11. Region (text input)
    - Field: region
    - Placeholder: "Lower Hutt"
    - Suggestion: Auto-fill based on city if possible

12. Country (dropdown)
    - Field: country
    - Default: "NZ" (New Zealand)
    - Options: "NZ", "AU" (Australia) - can expand later
    - Most will be NZ

13. Company Name (text input) - Conditional
    - Field: company_name
    - Placeholder: "ABC Corporation"
    - Only show if client_type = "Business"
    - Required if client_type = "Business"

---

**SECTION 3: IDENTIFICATION (Recommended)**

14. ID Type (dropdown)
    - Field: id_type
    - Options:
      * "drivers_license" → Display: "Driver's License"
      * "passport" → Display: "Passport"
      * "national_id" → Display: "National ID"
      * "other" → Display: "Other"
    - Default: Empty (user selects)
    - Optional (can add later)

15. ID Number (text input)
    - Field: id_number
    - Placeholder: "NZ123456"
    - Only show if id_type is selected
    - Optional

---

**SECTION 4: EMPLOYMENT & INCOME (Optional)**

16. Employment Status (dropdown)
    - Field: employment_status
    - Options:
      * "employed" → Display: "Employed"
      * "self_employed" → Display: "Self-Employed"
      * "unemployed" → Display: "Unemployed"
      * "student" → Display: "Student"
      * "retired" → Display: "Retired"
    - Default: Empty
    - Optional

17. Monthly Income (number input)
    - Field: monthly_income
    - Placeholder: "3800.00"
    - Only show if employment_status is selected
    - Format: Currency (allow decimals)
    - Optional

18. Occupation (text input)
    - Field: occupation
    - Placeholder: "Software Engineer"
    - Only show if employment_status = "employed" or "self_employed"
    - Optional

---

**SECTION 5: PERSONAL DETAILS (Optional)**

19. Date of Birth (date input)
    - Field: date_of_birth
    - Format: DD-MM-YYYY or YYYY-MM-DD (allow both)
    - Store as: YYYY-MM-DD in database
    - Age calculation: Optional (for reference)
    - Optional

20. Gender (dropdown)
    - Field: gender
    - Options: "Male", "Female", "Other", "Prefer not to say"
    - Default: Empty
    - Optional

---

**SECTION 6: NOTES (Optional)**

21. Notes (textarea)
    - Field: notes (if exists in table) or skip
    - Placeholder: "Additional notes about client"
    - Max: 500 characters
    - Optional

---

**NOT INCLUDED IN MODAL:**
- id (auto-generated UUID)
- client_code (auto-generated AAL10001 format) - generated on INSERT
- status (default: 'active')
- credit_rating (can be set later by admin)
- created_at, updated_at (system timestamps)

================================================================================
FORM BEHAVIOR & VALIDATION
================================================================================

**Required Fields (cannot submit without):**
- First Name
- Last Name
- Email
- Client Type
- Company Name (if Client Type = "Business")

**Conditional Fields:**
- Company Name: Show if client_type = "Business"
- ID Number: Show if id_type is selected
- Occupation: Show if employment_status = "employed" OR "self_employed"
- Monthly Income: Show if employment_status is selected

**Validation Rules:**
✓ First Name & Last Name: Min 2, Max 50 chars
✓ Email: Valid format, unique in database
✓ Monthly Income: Positive number, max 2 decimals
✓ Date of Birth: Valid date format
✓ Phone Numbers: Accept any format (NZ: remove spaces on display)

**On Submit:**
1. Validate all required fields
2. Check email uniqueness (query database)
3. If valid: 
   - client_code auto-generated
   - status = 'active'
   - INSERT into clients table
   - Clear form, close modal
   - Refresh clients list
   - Show success message
4. If error: Show error message, don't close

================================================================================
STYLING & UX
================================================================================

**Layout:**
- Single column or 2-column responsive
- Sections clearly labeled with borders/spacing
- Conditional fields fade in/out smoothly

**Form Elements:**
- Text inputs: 100% width, padding 0.75rem
- Dropdowns: Same style as text inputs
- Textarea: Minimum height 100px
- Required field indicator: Red asterisk (*)

**Buttons:**
- Cancel (gray) | Create Client (blue)
- Cancel: Close modal, discard form
- Create Client: Submit (disabled until valid)

**Mobile:**
- Stack all fields vertically
- Full width inputs
- Same functionality, responsive layout

================================================================================
DATABASE INSERT STATEMENT
================================================================================

When creating new client, INSERT:

```sql
INSERT INTO clients (
  first_name,
  last_name,
  email,
  phone,              -- mobile_phone stored here for now
  mobile_phone,
  work_phone,
  home_phone,
  address,
  city,
  region,
  postcode,
  country,
  company_name,
  client_type,
  id_type,
  id_number,
  date_of_birth,
  gender,
  occupation,
  employment_status,
  monthly_income,
  status,
  created_at,
  updated_at
) VALUES (...)
```

Auto-generated by system:
- client_code (sequence AAL10001)
- status (default 'active')
- created_at, updated_at (NOW())

================================================================================
EXAMPLE: FORM FLOW
================================================================================

1. User clicks "Add Client" button
2. Modal opens with empty form
3. User enters:
   - First Name: "John"
   - Last Name: "Smith"
   - Email: "john.smith@email.com"
   - Client Type: "Individual" (company_name field disappears)
   - Mobile: "021234567"
   - City: "Wellington"
   - Employment Status: "Employed" (occupation field appears)
   - Occupation: "Teacher"
   - Monthly Income: "4500.00"
4. User clicks "Create Client"
5. System validates → All required fields filled ✓
6. System checks email unique → john.smith@email.com not in DB ✓
7. System INSERTS with auto-generated client_code (AAL10007)
8. Modal closes
9. Clients list refreshes, showing new client
10. Success message: "Client John Smith created successfully"

================================================================================
