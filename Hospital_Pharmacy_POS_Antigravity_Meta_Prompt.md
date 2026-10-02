# MASTER META PROMPT
## Hospital Pharmacy POS & Inventory Management System

You are my senior full-stack software architect, developer, UI/UX designer, database designer, tester, and technical mentor.

I am a pharmacy student and a beginner in programming. I am building a college project called:

**"Hospital Pharmacy POS System with Role-Based Access, Billing, Inventory Management, Automatic Stock Deduction, Low-Stock Alerts and Expiry Management."**

Your job is to help me build the complete working application from zero to final testing.

---

# 1. IMPORTANT: UNDERSTAND THE PROJECT

This is initially a **college/demo project**.

I do NOT have real hospital data.

Use only dummy/sample pharmacy data during development.

Do not use real patient information.

The system should behave like a real hospital pharmacy POS system.

The final concept should support a pharmacy where:

- An Admin manages medicines, inventory and users.
- Cashiers process medicine sales.
- Billing automatically deducts stock.
- The system warns when medicine stock is low.
- The system warns about medicines approaching expiry.
- Expired medicines cannot be sold.
- All sales are stored.
- Stock movements are recorded.
- Different users have different permissions.
- The architecture should be suitable for eventually running on a central hospital server with multiple computers connected to it.

---

# 2. MAIN OBJECTIVE

Build a full-stack web-based Hospital Pharmacy POS system that integrates:

1. Authentication
2. Role-based access
3. Medicine management
4. Inventory management
5. Batch management
6. Expiry-date management
7. POS billing
8. Automatic stock deduction
9. Low-stock warnings
10. Critical-stock warnings
11. Near-expiry warnings
12. Expired-medicine blocking
13. Sales history
14. Stock movement history
15. Dashboard
16. Reports
17. Invoice generation/printing
18. User management
19. Audit logging
20. Proper validation and security

---

# 3. TECHNOLOGY STACK

Use a beginner-friendly modern full-stack architecture.

Preferred stack:

Frontend:
- React
- Modern CSS/Tailwind CSS if appropriate

Backend:
- Node.js
- Express.js

Database:
- SQLite for the initial version

Authentication:
- Secure password hashing
- Session/JWT-based authentication as appropriate
- Role-based authorization

Architecture:

Frontend
    ↓
Backend API
    ↓
Database

Keep frontend, backend and database logically separated.

Do NOT put the entire application into one file.

Use a clean professional project structure.

Suggested structure:

/frontend
/backend
/database
/docs

You may improve this structure if there is a good technical reason, but explain the reason before making major architectural changes.

---

# 4. FUTURE SERVER REQUIREMENT

Although the first version will run on my own computer, design the application so that it can later be deployed on a hospital/local server.

Future architecture:

                Hospital Pharmacy Server
                         |
                  Central Database
                         |
          +--------------+--------------+
          |              |              |
       Admin PC       Cashier PC     Cashier PC

Multiple authorized computers should eventually be able to use the same central database through the backend server.

Do NOT build the complicated server deployment first.

First make the complete application work locally.

Keep the backend API and database architecture suitable for later deployment.

---

# 5. USER ROLES

There must be at least two roles:

## ADMIN

Admin can:

- Login
- Logout
- View dashboard
- Add medicine
- Edit medicine
- Delete medicine when appropriate
- Add stock
- Adjust stock with authorization
- View inventory
- Search inventory
- Filter inventory
- View batch information
- View expiry dates
- Set low-stock/reorder levels
- View low-stock alerts
- View critical-stock alerts
- View near-expiry alerts
- View expired medicines
- View sales
- View invoices
- View reports
- Manage cashier accounts
- Create cashier accounts
- Activate/deactivate cashier accounts
- View stock movement history
- View audit history

Admin should NOT be able to accidentally modify historical sales records without an explicit controlled process.

---

# 6. CASHIER

Cashier can:

- Login
- Logout
- View cashier dashboard
- Search medicines
- View available medicines
- View available stock
- Select medicine
- Enter quantity
- Add medicine to cart
- Remove medicine from cart
- Change quantity
- Calculate subtotal
- Calculate total
- Complete billing
- Generate invoice
- Print invoice
- View appropriate sales history

Cashier must NOT be able to:

- Create an Admin
- Delete Admin
- Change system settings
- Modify medicine master data
- Change medicine price unless specifically authorized
- Directly edit stock
- Delete sales records
- Access Admin-only pages
- Access Admin-only APIs

Every protected action must also be protected on the BACKEND, not only hidden in the frontend.

---

# 7. MEDICINE MASTER DATA

Each medicine should support:

- Medicine ID
- Medicine name
- Generic name
- Brand name if applicable
- Strength
- Dosage form
- Unit of measure
- Manufacturer
- Batch number
- Expiry date
- Purchase price
- Selling price
- Current stock quantity
- Low-stock/reorder level
- Critical-stock level
- Created date
- Updated date
- Active/inactive status

Examples of dummy medicines:

- Paracetamol 500 mg
- Aceclofenac 100 mg
- Amoxicillin 500 mg
- Cetirizine 10 mg
- Omeprazole 20 mg
- Pantoprazole 40 mg
- Azithromycin 500 mg

These are ONLY demo records.

---

# 8. BATCH MANAGEMENT

The system must support batch numbers.

Example:

Medicine:
Paracetamol 500 mg

Batch:
PCM001

Expiry:
2027-12-31

Stock:
1000 tablets

Where practical, treat different batches as separate inventory records so that batch-specific expiry and stock can be tracked.

Do not incorrectly combine two different batches into one record.

---

# 9. EXPIRY MANAGEMENT

Every batch should have an expiry date.

The system must identify:

## NORMAL

Medicine has sufficient time before expiry.

## NEAR EXPIRY

Medicine is approaching its expiry date.

Use a configurable warning period where possible.

Example:

"Near expiry within 90 days."

## EXPIRED

The expiry date has passed.

Expired medicine must NOT be available for sale.

If a cashier tries to sell an expired batch, prevent the transaction and display a clear message:

"Cannot sell this medicine because the selected batch has expired."

Admin should be able to see expired medicines separately.

---

# 10. LOW-STOCK WARNING SYSTEM

This is a major feature.

Every medicine/batch should have a configurable:

**Low Stock / Reorder Level**

Example:

Medicine:
Paracetamol 500 mg

Current stock:
100

Low-stock level:
50

If:

Current stock > Low-stock level

Show:

🟢 NORMAL STOCK

If:

Current stock <= Low-stock level

Show:

🟡 LOW STOCK

Also support a configurable critical threshold.

Example:

Current stock <= Critical level

Show:

🔴 CRITICAL STOCK

The Admin Dashboard must contain:

## INVENTORY ALERTS

Show:

🔴 Critical Stock
🟡 Low Stock
🟠 Near Expiry
🔴 Expired Medicines

Each alert should show:

- Medicine name
- Batch number
- Current quantity
- Low-stock level
- Critical-stock level
- Expiry date
- Alert status

The system must automatically recalculate the alert after:

- Medicine is added
- Stock is added
- Stock is deducted
- Sale is completed
- Sale is cancelled/voided if cancellation is implemented

The warning system must NOT automatically modify stock.

It only monitors and alerts.

---

# 11. STOCK MANAGEMENT

Admin can add stock.

Example:

Current stock:

100

New shipment:

500

New stock:

600

Every stock addition must create a stock movement record.

Record:

- Movement ID
- Medicine/batch
- Previous quantity
- Quantity added
- New quantity
- Reason
- User
- Date/time

For manual stock adjustments, require an appropriate reason.

Examples:

- New stock received
- Damaged stock
- Expired stock
- Correction
- Physical inventory adjustment

---

# 12. AUTOMATIC STOCK DEDUCTION

This is one of the most important features.

Example:

Initial stock:

100

Cashier sells:

10

After successful sale:

100 - 10 = 90

The system must automatically update inventory.

The stock deduction should happen as part of the successful sale transaction.

If the sale fails, stock should NOT be incorrectly deducted.

Use appropriate database transaction handling.

---

# 13. INSUFFICIENT STOCK PROTECTION

Example:

Available stock:

5

Cashier tries to sell:

8

The system must reject the sale.

Show:

"Insufficient stock. Only 5 units are available."

Do not allow negative inventory.

Never allow:

5 → -3

---

# 14. POS BILLING SCREEN

Create a professional POS screen.

It should include:

- Medicine search
- Search by medicine name
- Search by generic name
- Search by batch number where appropriate
- Medicine selection
- Quantity
- Add to cart
- Cart
- Remove item
- Change quantity
- Subtotal
- Grand total
- Payment method
- Checkout
- Invoice generation
- Print invoice

The interface should be fast and simple for a cashier.

---

# 15. BILL CALCULATION

For every item:

Quantity × Selling Price = Item Total

Example:

Paracetamol:

10 × ₹2 = ₹20

Then:

Subtotal = sum of item totals

Grand Total = subtotal + applicable charges/taxes if implemented

For the initial project, keep tax handling simple unless specifically required.

Use accurate decimal/currency handling.

Do not use unsafe floating-point logic for financial calculations where avoidable.

---

# 16. PAYMENT

Support basic demo payment methods such as:

- Cash
- Card
- UPI

Store the selected payment method with the sale.

Do NOT integrate real payment gateways unless explicitly requested later.

This is a college/demo system.

---

# 17. INVOICE

Generate a professional printable invoice.

Invoice should contain:

DEMO HOSPITAL PHARMACY

- Invoice number
- Date
- Time
- Cashier
- Medicine name
- Batch number
- Quantity
- Unit price
- Item total
- Grand total
- Payment method

Example:

--------------------------------
      DEMO HOSPITAL PHARMACY
--------------------------------
Invoice: INV-000001
Date: 01/10/2026
Cashier: cashier01

Medicine       Qty   Price   Total
-----------------------------------
Paracetamol    10    ₹2      ₹20
Cetirizine      5    ₹5      ₹25
-----------------------------------
TOTAL                         ₹45
-----------------------------------

Provide a print-friendly invoice.

---

# 18. SALES DATABASE

Every completed sale must be permanently recorded.

Create appropriate tables such as:

Users
Medicines
Batches/Inventory
Sales
SaleItems
StockMovements
AuditLogs

Sales should contain:

- Sale ID
- Invoice number
- Cashier ID
- Sale date/time
- Subtotal
- Total
- Payment method
- Status

Sale items should contain:

- Sale item ID
- Sale ID
- Medicine/batch ID
- Quantity
- Unit price
- Total

Historical sales must remain available.

---

# 19. STOCK MOVEMENT HISTORY

Every important stock change must be recorded.

Examples:

SALE

Stock:

100 → 90

Record:

- Type: SALE
- Quantity: -10
- User: cashier01
- Date/time
- Sale ID

STOCK RECEIVED

100 → 600

Record:

- Type: STOCK_RECEIVED
- Quantity: +500
- User: admin01
- Reason
- Date/time

MANUAL ADJUSTMENT

Record:

- Previous quantity
- Change
- New quantity
- Reason
- User
- Date/time

This creates traceability.

---

# 20. AUDIT LOG

Create an audit log for important actions.

Examples:

- Admin login
- Cashier login
- Medicine created
- Medicine updated
- Stock added
- Stock adjusted
- Sale completed
- User created
- User deactivated

Store:

- User
- Action
- Target/resource
- Date/time
- Relevant details

Do not store passwords in audit logs.

---

# 21. ADMIN DASHBOARD

Create a clean dashboard.

Display cards such as:

Total Medicines
Total Stock Units
Today's Sales
Today's Bills
Low Stock
Critical Stock
Near Expiry
Expired Medicines

Also display an:

## INVENTORY ALERTS

section.

Example:

⚠️ Inventory Alerts

🔴 Amoxicillin 500 mg
Batch AMX001
Stock: 5
Critical level: 10

🟡 Aceclofenac 100 mg
Batch ACE001
Stock: 25
Reorder level: 50

🟠 Omeprazole 20 mg
Batch OME001
Expires soon

Make alerts visually clear.

---

# 22. CASHIER DASHBOARD

Cashier dashboard should be simple.

Show:

- New Bill
- Search Medicine
- Current Cart
- Today's Bills
- Today's Sales
- Recent Transactions

Do not overwhelm the cashier with Admin functionality.

---

# 23. INVENTORY PAGE

Create a professional inventory table.

Columns:

Medicine
Generic Name
Strength
Dosage Form
Batch
Expiry
Stock
Reorder Level
Selling Price
Status
Actions

Use visual status indicators:

🟢 Normal
🟡 Low
🔴 Critical
🟠 Near Expiry
⚫ Expired

Provide:

- Search
- Filter
- Sort
- Pagination if needed

---

# 24. USER MANAGEMENT

Admin can:

- Create cashier
- Edit cashier details
- Activate/deactivate cashier
- Reset password through a secure mechanism if implemented

Do not expose passwords.

Passwords must be securely hashed.

---

# 25. AUTHENTICATION

Implement secure authentication.

Requirements:

- Login
- Logout
- Password hashing
- Protected routes
- Backend authorization
- Role checking
- Session/token handling appropriate to architecture

Never store passwords as plain text.

Never hard-code secret keys in source code.

Use environment variables for secrets.

Create an appropriate `.env.example`.

Do NOT expose secrets to the frontend.

---

# 26. DATABASE DESIGN

Use a relational design.

At minimum consider:

users
medicines
inventory/batches
sales
sale_items
stock_movements
audit_logs

Create appropriate primary keys and foreign keys.

Use database constraints where appropriate.

Avoid duplicate or inconsistent data.

Before implementation, show me the database relationship design in simple language.

---

# 27. API DESIGN

Create a clean backend API.

Possible areas:

Authentication:
POST /api/auth/login
POST /api/auth/logout

Medicines:
GET /api/medicines
POST /api/medicines
PUT /api/medicines/:id
DELETE /api/medicines/:id

Inventory:
GET /api/inventory
POST /api/inventory/stock
GET /api/inventory/alerts

Sales:
POST /api/sales
GET /api/sales
GET /api/sales/:id

Users:
GET /api/users
POST /api/users
PUT /api/users/:id

Dashboard:
GET /api/dashboard

You may change the exact API structure if there is a better architecture.

Protect every sensitive endpoint with backend authorization.

---

# 28. VALIDATION

Validate all important inputs.

Examples:

- Required medicine name
- Valid price
- Positive stock quantity
- Valid expiry date
- Valid batch number
- Valid user credentials
- Valid quantity
- Insufficient stock protection
- Expired medicine protection
- Duplicate records where appropriate

Never trust frontend validation alone.

Always validate on the backend.

---

# 29. ERROR HANDLING

Create understandable error messages.

Examples:

Invalid login:

"Invalid username or password."

Insufficient stock:

"Insufficient stock. Only 5 units are available."

Expired medicine:

"This batch has expired and cannot be sold."

Unauthorized action:

"You do not have permission to perform this action."

Do not expose sensitive technical information to normal users.

---

# 30. UI/UX REQUIREMENTS

Create a modern, professional pharmacy-management interface.

Requirements:

- Clean dashboard
- Sidebar navigation
- Clear buttons
- Responsive layout
- Tables
- Search
- Filters
- Alerts
- Status badges
- Confirmation dialogs for destructive actions
- Loading states
- Error states
- Empty states

Keep the interface simple enough for a college demonstration.

Do not make the design unnecessarily complicated.

---

# 31. ACCESSIBILITY AND USABILITY

Use:

- Clear labels
- Readable text
- Good contrast
- Keyboard-friendly controls where practical
- Clear error messages
- Consistent navigation

The cashier should be able to create a bill quickly.

---

# 32. DUMMY DATA

Create a database seed script with realistic DEMO data.

Example medicines:

Paracetamol 500 mg
Aceclofenac 100 mg
Amoxicillin 500 mg
Cetirizine 10 mg
Omeprazole 20 mg
Pantoprazole 40 mg
Azithromycin 500 mg

Create different stock conditions so the alert system can be demonstrated.

For example:

Normal stock
Low stock
Critical stock
Near expiry
Expired

This is important because I need to demonstrate the warning system.

Use clearly fictional/demo users.

Never use real patient information.

---

# 33. TEST DATA SCENARIOS

Create test data that demonstrates:

1. Normal stock
2. Low stock
3. Critical stock
4. Near-expiry medicine
5. Expired medicine
6. Multiple batches
7. Successful sale
8. Insufficient stock
9. Cashier access restriction
10. Admin access

---

# 34. TESTING

Create a proper testing checklist.

Test:

### Authentication
- Admin login
- Cashier login
- Wrong password
- Logout

### Authorization
- Admin access
- Cashier access
- Cashier blocked from Admin functions
- Unauthorized API request blocked

### Inventory
- Add medicine
- Edit medicine
- Add stock
- Stock adjustment
- Low-stock warning
- Critical-stock warning
- Near-expiry warning
- Expired status

### POS
- Search medicine
- Add to cart
- Change quantity
- Remove item
- Calculate total
- Checkout
- Invoice

### Stock deduction
Test:

Stock = 100
Sale = 10
Expected = 90

### Insufficient stock

Stock = 5
Sale = 8
Expected = transaction rejected

### Expired medicine

Expected:
Sale rejected

### Database

Verify:
Sale created
Sale items created
Stock decreased
Stock movement created
Audit record created

---

# 35. TRANSACTION SAFETY

When a sale is completed:

1. Validate user
2. Validate medicine
3. Validate batch
4. Check expiry
5. Check available stock
6. Calculate total
7. Create sale
8. Create sale items
9. Deduct inventory
10. Create stock movement
11. Commit transaction

If any critical step fails:

ROLL BACK the entire transaction.

Never create a sale while failing to update inventory correctly.

Never deduct stock twice.

---

# 36. SECURITY

Use secure development practices.

Requirements:

- Password hashing
- Authentication
- Role-based authorization
- Backend validation
- Parameterized/database-safe queries
- Environment variables
- No secrets in Git
- No passwords in logs
- Proper error handling
- Protected API routes

Create `.gitignore` including sensitive files such as:

.env
node_modules
database files if appropriate
build artifacts where appropriate

Create `.env.example` without real secrets.

---

# 37. DOCUMENTATION

Create a `/docs` folder.

Prepare documentation for:

1. Project introduction
2. Problem statement
3. Objectives
4. Existing system
5. Proposed system
6. Features
7. User roles
8. System architecture
9. Database design
10. Modules
11. API structure
12. Security
13. Testing
14. Screens
15. Future scope
16. Conclusion

Keep explanations suitable for a pharmacy student.

---

# 38. COLLEGE PROJECT PRESENTATION

Prepare the application so I can demonstrate this workflow:

STEP 1:
Login as Admin.

STEP 2:
Show dashboard.

STEP 3:
Show medicine inventory.

STEP 4:
Show a low-stock warning.

STEP 5:
Show a near-expiry warning.

STEP 6:
Show an expired medicine.

STEP 7:
Add stock.

STEP 8:
Logout.

STEP 9:
Login as Cashier.

STEP 10:
Create a new bill.

STEP 11:
Select medicine.

STEP 12:
Enter quantity.

STEP 13:
Complete sale.

STEP 14:
Show generated invoice.

STEP 15:
Return to inventory.

STEP 16:
Show automatic stock deduction.

STEP 17:
Show sales history.

STEP 18:
Show stock movement/audit history.

This should clearly demonstrate the project's main purpose.

---

# 39. DEVELOPMENT PHASES

Build the project in this exact general order.

## PHASE 0 — REQUIREMENTS & ARCHITECTURE

Before writing major code:

Explain:

- Project architecture
- Technology
- Folder structure
- Database tables
- Relationships
- User roles
- Main pages
- API structure
- Development plan

Then STOP.

Wait for my confirmation.

---

## PHASE 1 — PROJECT SETUP

Create:

- Frontend
- Backend
- Database setup
- Environment configuration
- Git configuration
- Basic README

Run the application.

Test that frontend and backend work.

STOP and explain how I test it.

---

## PHASE 2 — DATABASE

Create database schema.

Create:

- Users
- Medicines
- Inventory/Batches
- Sales
- Sale Items
- Stock Movements
- Audit Logs

Add demo seed data.

Test database.

STOP.

---

## PHASE 3 — AUTHENTICATION

Build:

- Login
- Logout
- Password hashing
- Admin role
- Cashier role
- Protected routes
- Backend authorization

Test both roles.

STOP.

---

## PHASE 4 — ADMIN DASHBOARD

Build:

- Dashboard cards
- Inventory alerts
- Low-stock alerts
- Critical-stock alerts
- Near-expiry alerts
- Expired alerts
- Sales summary

STOP and test.

---

## PHASE 5 — INVENTORY

Build:

- Inventory list
- Add medicine
- Edit medicine
- Batch management
- Expiry
- Stock addition
- Stock adjustment
- Search
- Filter
- Stock movement history

STOP and test.

---

## PHASE 6 — CASHIER POS

Build:

- POS screen
- Medicine search
- Cart
- Quantity
- Price calculation
- Total
- Payment method
- Checkout

STOP and test.

---

## PHASE 7 — STOCK DEDUCTION

Connect:

POS → Sale → Database → Stock deduction → Stock movement → Alerts

Test carefully.

STOP and test multiple scenarios.

---

## PHASE 8 — INVOICE

Build:

- Invoice number
- Printable invoice
- Pharmacy information
- Medicine items
- Total
- Payment method
- Cashier

STOP and test.

---

## PHASE 9 — SALES & REPORTS

Build:

- Sales history
- Invoice history
- Daily sales
- Inventory reports
- Low-stock report
- Expiry report
- Stock movement report

STOP and test.

---

## PHASE 10 — SECURITY & VALIDATION

Review:

- Authentication
- Authorization
- API protection
- Input validation
- Password handling
- Secrets
- Database safety
- Error handling

Fix identified issues.

---

## PHASE 11 — UI POLISH

Improve:

- Layout
- Colors
- Typography
- Tables
- Alerts
- Buttons
- Navigation
- Mobile/responsive behavior
- Loading states
- Empty states
- Error messages

Do not change working business logic unnecessarily.

---

## PHASE 12 — COMPLETE TESTING

Run the complete end-to-end workflow.

Test:

Admin → Inventory → Stock → Cashier → Billing → Sale → Stock deduction → Alert → Invoice → Reports.

Fix all important bugs.

---

## PHASE 13 — DOCUMENTATION

Create final project documentation.

Include:

- Introduction
- Objectives
- Modules
- Architecture
- Database
- Screens
- Testing
- Results
- Future scope
- Conclusion

---

# 40. VERY IMPORTANT BEGINNER INSTRUCTIONS

I am a beginner.

You MUST explain things in simple English.

Whenever you ask me to run a command:

1. Tell me where to open the terminal.
2. Tell me which folder I should be in.
3. Give me the exact command.
4. Explain what the command does.
5. Tell me what result I should expect.
6. Tell me what to do if I get an error.

Do NOT assume I know:

- npm
- Node.js
- React
- Express
- SQLite
- APIs
- databases
- environment variables
- Git
- terminals
- ports
- authentication

Explain these concepts briefly when they become relevant.

---

# 41. ONE STEP AT A TIME

Do NOT give me 30 commands at once.

Work incrementally.

After each major phase:

1. Tell me what was built.
2. Tell me which files changed.
3. Tell me how to test it.
4. Ask me to confirm the result.
5. Only then continue.

If an error occurs:

STOP the current development phase.

Help me diagnose and fix the error.

Do not continue building additional features on top of broken functionality.

---

# 42. CODE QUALITY RULES

Write clean, understandable code.

Use:

- Meaningful names
- Modular components
- Reusable functions
- Clear API structure
- Proper error handling
- Database constraints
- Comments where useful

Do not create unnecessary complexity.

Do not introduce additional frameworks or services unless there is a clear benefit.

If you recommend changing the technology stack, explain why before changing it.

---

# 43. DO NOT DESTROY WORKING CODE

Before modifying an existing feature:

- Inspect the existing implementation.
- Understand how it works.
- Make the smallest safe change.
- Test the affected functionality.

Do not rewrite the entire application just to add a small feature.

---

# 44. GIT

Prepare the project for Git/GitHub.

Create:

.gitignore

Do NOT commit:

- Passwords
- API keys
- `.env`
- Secret credentials
- Private certificates
- Real patient data
- Real hospital data

The project should be safe to upload as a college demo project.

---

# 45. FUTURE DEPLOYMENT

After the local version is fully working, explain how it could eventually be deployed on:

Hospital/local server
    ↓
Central backend
    ↓
Central database
    ↓
Multiple pharmacy computers

Do not deploy it to a real hospital automatically.

This is initially a college/demo project.

---

# 46. FINAL SUCCESS CRITERIA

The project is considered complete only when all of these work:

[ ] Admin login
[ ] Cashier login
[ ] Role-based access
[ ] Medicine management
[ ] Batch management
[ ] Expiry management
[ ] Inventory
[ ] Stock addition
[ ] Low-stock warning
[ ] Critical-stock warning
[ ] Near-expiry warning
[ ] Expired-medicine blocking
[ ] POS billing
[ ] Cart
[ ] Quantity validation
[ ] Automatic stock deduction
[ ] Insufficient stock protection
[ ] Invoice generation
[ ] Invoice printing
[ ] Sales history
[ ] Stock movement history
[ ] Audit logs
[ ] Dashboard
[ ] Reports
[ ] Input validation
[ ] Authentication security
[ ] Backend authorization
[ ] Error handling
[ ] Demo data
[ ] Documentation
[ ] Complete testing

---

# 47. YOUR FIRST RESPONSE

DO NOT start coding immediately.

First provide me:

1. A simple explanation of the complete system.
2. Complete architecture.
3. Technology stack.
4. Folder structure.
5. Database tables and relationships.
6. Main application pages.
7. API structure.
8. Development phases.
9. Testing strategy.
10. What we will build first.

Explain everything in simple English because I am a beginner.

After giving this planning information:

STOP.

Wait for my confirmation before starting Phase 1.

Do not generate the entire application in the first response.
