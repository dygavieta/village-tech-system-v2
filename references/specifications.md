# Residential Community Management Platform - Application Details

## Overview

A comprehensive multi-tenant platform for managing residential communities governed by homeowners associations. The platform consists of four specialized applications serving different stakeholder groups.

---

## 1. PLATFORM Web App (Superadmin Portal)

### Purpose
Central management system for the multi-tenant HOA platform. Enables superadmins to provision, configure, and monitor residential community tenants.

### Target Users
- **Superadmin** – Platform administrators responsible for creating and managing residential community tenants, monitoring performance, and handling platform-wide configurations.

---

## Feature 1.1: Create New Tenant (Residential Community)

### Business Value
Enables platform growth by allowing rapid onboarding of new residential communities without manual database configuration or technical intervention.

### User Story
```
As a Superadmin
I want to create a new residential community tenant
So that I can onboard new HOAs to the platform efficiently
```

### Detailed Requirements

#### Functional Requirements

**FR-1.1.1: Community Basic Information**
- Community name (required, unique across platform)
- Community legal name (for contracts)
- Community type (HOA, Condo Association, Gated Village, Subdivision)
- Total number of residences/units
- Year established
- Primary contact information (phone, email, address)

**FR-1.1.2: Tenant Configuration**
- Tenant subdomain (e.g., `community-name.platform.com`)
- Tenant database schema provisioning
- Tenant-specific branding (logo upload, color scheme)
- Timezone configuration
- Language/locale settings

**FR-1.1.3: Subscription & Limits**
- Maximum number of residences allowed
- Maximum number of admin users
- Maximum number of security personnel
- Storage quota for documents/files
- Feature toggles (which modules are enabled)

**FR-1.1.4: Initial Setup Wizard**
- Step 1: Basic information
- Step 2: Property/residence setup
- Step 3: Gate/entrance configuration
- Step 4: Admin account creation
- Step 5: Review and activate

#### Non-Functional Requirements

**NFR-1.1.1: Performance**
- Tenant creation completes within 60 seconds
- Database schema provisioned asynchronously
- Background job for initial data seeding

**NFR-1.1.2: Security**
- Tenant data completely isolated (schema-per-tenant or database-per-tenant)
- Encrypted storage for sensitive community data
- Audit log of tenant creation with timestamp and superadmin user

**NFR-1.1.3: Scalability**
- Support for 1000+ tenants on single platform instance
- Horizontal scaling capability for high-volume periods

### Acceptance Criteria

```gherkin
Given I am logged in as a Superadmin
When I navigate to "Create New Tenant"
And I complete the setup wizard with valid information
Then a new tenant is created with isolated database schema
And the initial admin head user receives activation credentials via email
And the tenant appears in the tenant management dashboard
And I can access the tenant's admin portal using the subdomain
```

### Business Rules

- **BR-1.1.1:** Tenant name must be unique across the platform
- **BR-1.1.2:** Subdomain must be alphanumeric and available
- **BR-1.1.3:** At least one admin head user must be created during setup
- **BR-1.1.4:** Tenant cannot be activated until all required steps are completed
- **BR-1.1.5:** Default village rules template is applied to new tenant

### Edge Cases & Error Handling

- Duplicate tenant name → Display error, suggest alternatives
- Email delivery failure for admin credentials → Queue for retry, show warning
- Database provisioning failure → Rollback tenant creation, log error, notify tech team
- Invalid subdomain format → Real-time validation with inline error message

---

## Feature 1.2: Define Residence/Property Information

### Business Value
Establishes the foundational data structure for the community, enabling accurate resident management, fee calculation, and service delivery.

### User Story
```
As a Superadmin
I want to define the residences and properties in a community
So that the community admin can assign households to specific addresses
```

### Detailed Requirements

#### Functional Requirements

**FR-1.2.1: Property Structure Definition**
- Address format configuration (Street, Block, Lot, Unit)
- Property hierarchy (Phases, Blocks, Streets, Lots)
- Custom address fields (e.g., "Tower A, Floor 5, Unit 502")
- Property types (Single-family home, Townhouse, Condo unit, Lot only)

**FR-1.2.2: Residence Attributes**
- Unique identifier (auto-generated or custom)
- Full address/location
- Property size (square meters/feet)
- Lot size (if applicable)
- Number of bedrooms/bathrooms
- Parking slots allocated
- Property status (Occupied, Vacant, Under Construction, For Sale)

**FR-1.2.3: Bulk Property Import**
- CSV/Excel upload for mass property creation
- Data validation and error reporting
- Preview before commit
- Duplicate detection

**FR-1.2.4: Property Map Integration**
- GPS coordinates for each residence
- Map view of community layout
- Clickable property markers

#### Non-Functional Requirements

**NFR-1.2.1: Data Integrity**
- Unique constraint on property addresses within tenant
- Referential integrity with household assignments
- Audit trail for property data changes

**NFR-1.2.2: Usability**
- Bulk import processes up to 5000 properties in single upload
- Real-time validation feedback during manual entry
- Search and filter properties by multiple criteria

### Acceptance Criteria

```gherkin
Given I am creating a new tenant
When I reach the "Property Definition" step
And I upload a CSV file with 100 residences
Then the system validates all addresses
And displays a preview table with validation results
And I can correct errors and re-upload
And upon confirmation, all 100 residences are created
And each residence has a unique identifier
```

### Business Rules

- **BR-1.2.1:** Each residence must have a unique address within the tenant
- **BR-1.2.2:** A residence can only be assigned to one household at a time
- **BR-1.2.3:** Property attributes can be updated but not deleted if linked to a household
- **BR-1.2.4:** GPS coordinates are optional but recommended for map features

---

## Feature 1.3: Define Community Entrances and Gates

### Business Value
Enables security operations by establishing the physical access points where the Sentinel app will be used for entry/exit management.

### User Story
```
As a Superadmin
I want to define all gates and entrances for a community
So that security personnel can be assigned to specific entry points
```

### Detailed Requirements

#### Functional Requirements

**FR-1.3.1: Gate/Entrance Definition**
- Gate name (e.g., "Main Gate", "North Entrance", "Service Gate")
- Gate type (Primary, Secondary, Service, Emergency)
- Operational status (Active, Inactive, Under Maintenance)
- Operating hours (24/7 or scheduled hours)
- GPS coordinates for location tracking

**FR-1.3.2: Gate Equipment Configuration**
- RFID reader assignment (serial number, IP address)
- Camera/CCTV integration (camera ID, feed URL)
- Barrier gate control (manual, automatic, semi-automatic)
- Intercom system configuration
- Backup power status monitoring

**FR-1.3.3: Gate Personnel Assignment**
- Assign security officers to specific gates
- Shift schedule configuration (day/night/swing shifts)
- Guard house location designation
- Roving patrol zones linked to gates

**FR-1.3.4: Access Rules per Gate**
- Which user types can enter (Residents, Guests, Delivery, Construction)
- Restricted hours for certain entry types (e.g., construction only 7am-5pm)
- Gate-specific curfew enforcement

#### Non-Functional Requirements

**NFR-1.3.1: Integration**
- API endpoints for RFID reader communication
- WebSocket connection for real-time gate status
- MQTT support for IoT barrier control (future)

**NFR-1.3.2: Reliability**
- Gate status monitoring with health checks every 30 seconds
- Automatic failover to manual mode if equipment fails
- Offline mode for Sentinel app when connectivity lost

### Acceptance Criteria

```gherkin
Given I am setting up a new tenant
When I define 3 gates (Main, North, Service)
And I assign RFID readers to Main and North gates
And I set operating hours for Service Gate (6am-6pm)
Then all 3 gates appear in the Sentinel app for security officers
And the Main and North gates can scan RFID stickers
And the Service Gate shows restricted hours warning
And gate status is visible in real-time on the superadmin dashboard
```

### Business Rules

- **BR-1.3.1:** Every community must have at least one active gate
- **BR-1.3.2:** RFID reader serial numbers must be unique across platform
- **BR-1.3.3:** Gates cannot be deleted if entry logs exist (archive instead)
- **BR-1.3.4:** Emergency gates allow exit-only by default

---

## Feature 1.4: Create Initial Admin Head User

### Business Value
Establishes the first point of administrative access for the community, enabling the HOA to begin managing residents and operations immediately after onboarding.

### User Story
```
As a Superadmin
I want to create the initial admin head user for a new community
So that the HOA leadership can start using the admin portal
```

### Detailed Requirements

#### Functional Requirements

**FR-1.4.1: Admin Head Account Creation**
- Full name (first, middle, last)
- Email address (unique, used for login)
- Mobile phone number (for 2FA)
- Position/title in HOA (e.g., "President", "Chairperson")
- Emergency contact information
- Preferred language

**FR-1.4.2: Credential Delivery**
- Auto-generated temporary password
- Email with login instructions and credentials
- SMS verification code for first login
- Password reset link included

**FR-1.4.3: Role & Permissions Assignment**
- Admin Head role with full permissions
- Access to all modules (household, permits, fees, announcements)
- Ability to create additional admin officers
- Superadmin cannot be assigned this role (separation of duties)

**FR-1.4.4: Onboarding Checklist**
- Welcome email with platform overview
- Link to admin user guide/documentation
- Setup wizard on first login (personalization)
- Option to schedule onboarding call

#### Non-Functional Requirements

**NFR-1.4.1: Security**
- Temporary password expires in 24 hours
- Multi-factor authentication required on first login
- Password complexity requirements enforced
- Account locked after 5 failed login attempts

**NFR-1.4.2: Compliance**
- User creation logged with timestamp and superadmin
- Terms of service acceptance required on first login
- GDPR consent for data processing (if applicable)

### Acceptance Criteria

```gherkin
Given I am completing tenant setup
When I create the admin head user with email "admin@community.com"
Then an email is sent with temporary credentials
And the user can log in to the admin portal using the subdomain
And the user is prompted to change password on first login
And the user has full access to all admin features
And the user can create additional admin officers
```

### Business Rules

- **BR-1.4.1:** Only one admin head per tenant initially (additional heads can be promoted later)
- **BR-1.4.2:** Email must be unique across the tenant (not globally)
- **BR-1.4.3:** Admin head cannot be deleted, only deactivated
- **BR-1.4.4:** Admin head must accept ToS before accessing features

---

## Feature 1.5: Create Initial Admin Officer Users

### Business Value
Enables distribution of administrative tasks among HOA board members, improving operational efficiency and accountability.

### User Story
```
As a Superadmin
I want to create initial admin officer accounts
So that the HOA board can divide responsibilities across multiple officers
```

### Detailed Requirements

#### Functional Requirements

**FR-1.5.1: Officer Account Creation**
- Same profile fields as admin head (name, email, phone, position)
- Role assignment (Treasurer, Secretary, Board Member)
- Custom role creation with specific permissions
- Department/area assignment (Finance, Security, Maintenance)

**FR-1.5.2: Permission Granularity**
- Module access (which features they can use)
- Action permissions (view, create, edit, delete, approve)
- Data scope (all households vs. specific zones)
- Financial limits (approve fees up to certain amount)

**FR-1.5.3: Approval Workflows**
- Define which actions require multi-officer approval
- Approval routing (e.g., officer proposes, head approves)
- Escalation rules for pending approvals

**FR-1.5.4: Officer Management**
- Bulk officer creation via CSV
- Invitation system (officer receives invite, sets own password)
- Officer directory visible to all admins
- Active/inactive status management

#### Non-Functional Requirements

**NFR-1.5.1: Role-Based Access Control (RBAC)**
- Permissions enforced at API level
- Frontend hides/disables unavailable features
- Audit log captures permission-based actions

**NFR-1.5.2: User Experience**
- Role-specific dashboards on login
- Notification for actions outside permission scope
- Help text explaining each permission

### Acceptance Criteria

```gherkin
Given I am setting up initial officers
When I create 3 officer accounts (Treasurer, Secretary, Board Member)
And I assign the Treasurer role with financial module access
And I assign the Secretary role with announcement permissions
Then all 3 officers receive invitation emails
And the Treasurer can access fee management but not construction permits
And the Secretary can send announcements but not approve permits
And the admin head can view all officer activities in the audit log
```

### Business Rules

- **BR-1.5.1:** Admin officers report to admin head (hierarchy enforced)
- **BR-1.5.2:** Officers cannot delete or deactivate the admin head
- **BR-1.5.3:** Officers cannot modify their own permissions (requires admin head)
- **BR-1.5.4:** Minimum 2 officers recommended but not required

---


## 2. ADMIN Web App (Residential Community Administration)

### Purpose
Used by homeowners association (HOA) officers to manage community operations, enforce policies, and provide resident services.

### Target Users
- **Admin Head** – Primary administrator with full access  
- **Admin Officers** – Board members with role-specific permissions  

---

## Feature 2.1: Set Up Residence Information and Household Head Users

### Business Value
Establishes the resident database, enabling all downstream features like stickers, permits, fees, and communication.

### User Story
```
As an Admin Head
I want to set up residences and create household head accounts
So that residents can start using the platform and requesting services
```

### Detailed Requirements

#### Functional Requirements

**FR-2.1.1: Residence Selection & Assignment**
- View list of all properties (from superadmin setup)
- Filter by status (vacant, occupied, under construction)
- Select a residence to assign a household
- Mark residence as occupied upon household assignment

**FR-2.1.2: Household Head Creation**
- Personal information (name, email, phone)
- Government ID verification (optional upload)
- Ownership proof (deed, lease agreement upload)
- Move-in date
- Emergency contact information

**FR-2.1.3: Account Activation**
- Send welcome email with login credentials
- Initial password setup link
- Mobile app download instructions
- Onboarding checklist for household head

**FR-2.1.4: Household Structure**
- Household head as primary contact
- Option to add household members (family)
- Define roles (head, spouse, adult member, minor)
- Beneficial users (non-residents with vehicle access)

**FR-2.1.5: Bulk Resident Onboarding**
- CSV import for multiple households
- Residence-to-household mapping
- Email batch sending for credentials
- Progress tracking for bulk operations

#### Non-Functional Requirements

**NFR-2.1.1: Data Validation**
- Email format validation
- Phone number format validation
- Duplicate email detection within tenant
- Residence cannot be assigned to multiple households

**NFR-2.1.2: Performance**
- Bulk upload supports up to 500 households
- Real-time validation during CSV upload
- Background job for email delivery

### Acceptance Criteria

```gherkin
Given I am an admin head
When I select an unoccupied residence "123 Main Street"
And I create a household head with email "resident@example.com"
And I submit the form
Then the residence status changes to "Occupied"
And an email is sent to the household head with login credentials
And the household head can log in to the Residence mobile app
And the household appears in the household directory
```

### Business Rules

- **BR-2.1.1:** One residence can only have one household head at a time
- **BR-2.1.2:** Household head email must be unique within the community
- **BR-2.1.3:** Residence cannot be marked vacant if active stickers exist
- **BR-2.1.4:** Household head can manage multiple residences (for owners with multiple properties)

---

## Feature 2.2: Approve Gate Pass Requests (Vehicle Stickers)

### Business Value
Controls vehicle access to the community, ensuring only authorized vehicles can enter, reducing security risks and unauthorized entries.

### User Story
```
As an Admin Officer
I want to review and approve vehicle sticker requests from households
So that residents receive RFID stickers for their vehicles
```

### Detailed Requirements

#### Functional Requirements

**FR-2.2.1: Sticker Request Inbox**
- Dashboard showing all pending sticker requests
- Filter by household, request date, status
- Sorting by priority (urgent, standard)
- Request details view (vehicle info, reason, household history)

**FR-2.2.2: Request Review**
- View household profile and history
- Check number of stickers already issued
- Verify against community sticker allocation rules
- View vehicle details (make, model, plate number, OR/CR upload)

**FR-2.2.3: Approval Actions**
- Approve request (triggers sticker issuance)
- Reject request (with reason)
- Request more information (sends notification to household)
- Conditional approval (e.g., temporary sticker for rental)

**FR-2.2.4: Sticker Issuance Tracking**
- Mark sticker as "Ready for Pickup"
- Notify household head via app and email
- Track pickup date and signature
- Assign RFID serial number to sticker
- Link sticker to vehicle plate number

**FR-2.2.5: Sticker Types**
- Resident sticker (permanent, expires annually)
- Beneficial user sticker (non-resident, renewable)
- Temporary sticker (guest, expires after set duration)
- Contractor sticker (linked to active permit)

#### Non-Functional Requirements

**NFR-2.2.1: Workflow Automation**
- Auto-approve if household under allocation limit
- Auto-reject if household exceeds limit (with override option)
- Scheduled email reminders for pending requests > 3 days

**NFR-2.2.2: Integration**
- RFID sticker database sync
- Sentinel app real-time update on approval
- Audit trail for all approval decisions

### Acceptance Criteria

```gherkin
Given a household has submitted a sticker request
When I review the request as an admin officer
And I see the household has 2 active stickers (limit is 3)
And I approve the request
Then the request status changes to "Approved - Ready for Pickup"
And the household receives a notification
And the sticker appears in the pickup queue
And when the household collects the sticker, I mark it as "Issued"
And the RFID serial number is linked to the vehicle plate
And the Sentinel app can scan this sticker at the gate
```

### Business Rules

- **BR-2.2.1:** Household cannot exceed sticker allocation (set in village rules)
- **BR-2.2.2:** Vehicle plate number must be registered before sticker issuance
- **BR-2.2.3:** Stickers expire annually and require renewal
- **BR-2.2.4:** Lost/damaged stickers require replacement fee (configurable)
- **BR-2.2.5:** Beneficial user stickers require household head endorsement

---

## Feature 2.3: Send Announcements

### Business Value
Facilitates mass communication with residents and security personnel, ensuring critical information reaches all stakeholders quickly.

### User Story
```
As an Admin Head
I want to send announcements to residents and security personnel
So that important information is communicated efficiently
```

### Detailed Requirements

#### Functional Requirements

**FR-2.3.1: Announcement Creation**
- Title and message body (rich text editor)
- Urgency level (Critical, Important, Info)
- Category (Event, Maintenance, Security Alert, Policy Update)
- Effective dates (start and end date for visibility)
- Attachments (PDFs, images, documents)

**FR-2.3.2: Audience Selection**
- All residents
- Specific households (multi-select)
- By zone/block/street
- All security personnel
- Specific gates/guard house
- Combination of above

**FR-2.3.3: Delivery Channels**
- Push notification (mobile app)
- Email
- SMS (for critical alerts)
- In-app announcement board
- Posted at guard house display

**FR-2.3.4: Scheduling & Automation**
- Send immediately
- Schedule for future date/time
- Recurring announcements (weekly, monthly)
- Auto-delete after expiration

**FR-2.3.5: Acknowledgment Tracking**
- Track who has read the announcement
- Require acknowledgment for critical alerts
- Send reminders to non-readers
- Reporting dashboard for engagement metrics

#### Non-Functional Requirements

**NFR-2.3.1: Delivery Performance**
- Push notifications delivered within 10 seconds
- Support for 5000+ recipients
- Batch email sending to avoid spam flags
- SMS rate limiting per provider limits

**NFR-2.3.2: Content Moderation**
- Character limits for push notifications (150 chars)
- Image size limits (2MB max)
- Profanity filter (optional)
- Admin head approval required for critical alerts

### Acceptance Criteria

```gherkin
Given I am an admin head
When I create an announcement about "Community Pool Maintenance"
And I select "All Residents" as the audience
And I set urgency as "Important"
And I schedule it for tomorrow at 9:00 AM
Then the announcement is saved as scheduled
And at 9:00 AM tomorrow, all residents receive a push notification
And the announcement appears in the Residence app announcement board
And I can track how many residents have read it
```

### Business Rules

- **BR-2.3.1:** Critical alerts require admin head approval
- **BR-2.3.2:** Announcements cannot be edited after sending (only deleted)
- **BR-2.3.3:** SMS delivery incurs cost (admin must confirm)
- **BR-2.3.4:** Announcement history retained for 2 years
- **BR-2.3.5:** Security alerts auto-delivered to all guard posts

---

## Feature 2.4: Approve Construction Permits

### Business Value
Ensures construction activities are authorized, fees collected, and safety protocols followed, protecting community property values and security.

### User Story
```
As an Admin Officer
I want to review and approve construction permit requests
So that construction work is properly authorized and monitored
```

### Detailed Requirements

#### Functional Requirements

**FR-2.4.1: Permit Request Inbox**
- List of pending permit requests
- Filter by household, permit type, date submitted
- Quick view of project scope and timeline
- Household history (previous permits, violations)

**FR-2.4.2: Request Review & Fee Calculation**
- View project details (type, scope, timeline, contractor)
- Uploaded documents (plans, contractor license, insurance)
- Automatic road fee calculation based on:
  - Project duration
  - Number of workers
  - Materials volume
  - Heavy equipment usage
- Manual fee adjustment option with reason

**FR-2.4.3: Permit Approval Workflow**
- Approve with standard conditions
- Approve with special conditions (custom rules)
- Request revisions (send back to household)
- Reject with reason
- Conditional approval pending payment

**FR-2.4.4: Payment Collection**
- Generate invoice with fee breakdown
- Payment methods (online, bank transfer, cash at office)
- Payment deadline (permit inactive until paid)
- Receipt generation upon payment
- Refund processing for cancelled permits

**FR-2.4.5: Permit Distribution**
- Digital permit sent to household (PDF with QR code)
- Permit details pushed to Sentinel app
- Guard house receives worker list and vehicle info
- Permit active dates displayed at gates

**FR-2.4.6: Construction Monitoring**
- Track permit status (Active, On Hold, Completed)
- Place on hold if payment late or violations occur
- Extend permit duration (with additional fee)
- Mark as completed when project done
- Incident reports linked to permit

#### Non-Functional Requirements

**NFR-2.4.1: Fee Calculation Engine**
- Configurable fee rules per community
- Support for complex formulas (duration × workers × rate)
- Audit trail of fee calculations
- Tax calculation if applicable

**NFR-2.4.2: Document Management**
- Support PDF, image, CAD file uploads
- Maximum 20MB per file
- Virus scanning on upload
- Secure storage with access control

### Acceptance Criteria

```gherkin
Given a household has submitted a construction permit request
When I review the request as an admin officer
And I see the project is "Kitchen Renovation - 30 days, 5 workers"
And the system calculates road fee as $500
And I approve the request
Then an invoice is sent to the household
And when the household pays $500
Then a receipt is issued
And the permit is activated
And the guard house receives the worker list
And security can verify contractor IDs against the permit at the gate
And after 30 days, I mark the permit as completed
```

### Business Rules

- **BR-2.4.1:** Permit inactive until full payment received
- **BR-2.4.2:** Road fees based on community-defined formula
- **BR-2.4.3:** Construction on hold if payment overdue > 7 days
- **BR-2.4.4:** Workers cannot enter without active permit in Sentinel system
- **BR-2.4.5:** Permit violations result in fines (separate fee schedule)
- **BR-2.4.6:** Permit extensions require admin approval

---

## Feature 2.5: Set Village Rules and Guidelines

### Business Value
Establishes and communicates community policies, ensuring residents and security personnel understand and comply with HOA regulations.

### User Story
```
As an Admin Head
I want to define and publish village rules
So that residents and security know the policies governing the community
```

### Detailed Requirements

#### Functional Requirements

**FR-2.5.1: Rules Library**
- Pre-defined rule categories (Noise, Parking, Pets, Construction, Visitors)
- Rich text editor for rule descriptions
- Version control (track rule changes over time)
- Effective date for new rules
- Archive outdated rules (retain history)

**FR-2.5.2: Curfew Settings**
- Set curfew hours (e.g., 10pm - 6am)
- Curfew exceptions (residents, essential workers)
- Curfew-specific rules (no construction, limited guest entry)
- Seasonal adjustments (holidays, special events)

**FR-2.5.3: Sticker Allocation Rules**
- Number of stickers per household (default)
- Exceptions for larger households (approval required)
- Beneficial user sticker limits
- Temporary sticker duration limits

**FR-2.5.4: Fee Schedules**
- Association fees (monthly/annual)
- Late payment penalties
- Construction permit fees
- Sticker replacement fees
- Violation fines

**FR-2.5.5: Rule Distribution**
- Publish to Residence app (all households see rules)
- Push to Sentinel app (security can reference)
- Email notification on rule updates
- Require acknowledgment for major changes
- Printable PDF for offline reference

#### Non-Functional Requirements

**NFR-2.5.1: Version Control**
- Track who made changes and when
- Compare versions (diff view)
- Rollback capability
- Resident notification on changes

**NFR-2.5.2: Accessibility**
- Searchable rule database
- Categorized for easy navigation
- Multi-language support (future)

### Acceptance Criteria

```gherkin
Given I am an admin head
When I create a new rule "No parking on streets after 10pm"
And I set the effective date as next Monday
And I publish the rule
Then all residents receive a notification about the new rule
And the rule appears in the Residence app under "Parking Rules"
And security personnel see the rule in the Sentinel app
And residents must acknowledge the rule before next Monday
```

### Business Rules

- **BR-2.5.1:** Major rule changes require 7-day notice to residents
- **BR-2.5.2:** Curfew changes must be approved by admin head
- **BR-2.5.3:** Fee schedule changes require HOA board vote (external to app)
- **BR-2.5.4:** Rules cannot be deleted, only archived
- **BR-2.5.5:** Security must enforce published rules at gates

---

## Feature 2.6: Association Fee Management

### Business Value
Ensures sustainable HOA operations by collecting dues from residents, tracking payments, and managing delinquencies.

### User Story
```
As an Admin Officer (Treasurer)
I want to manage association fees for all households
So that the HOA has funds for maintenance and operations
```

### Detailed Requirements

#### Functional Requirements

**FR-2.6.1: Fee Structure Definition**
- Monthly or annual fee options
- Flat rate or tiered by property size
- Special assessments (one-time fees)
- Discounts for early payment
- Payment plans for large amounts

**FR-2.6.2: Fee Assignment**
- Auto-assign to all households
- Custom fees for specific households (exemptions)
- Pro-rated fees for mid-month move-ins
- Fee adjustments for financial hardship (approval required)

**FR-2.6.3: Billing & Invoicing**
- Auto-generate monthly invoices
- Email delivery of invoices
- Invoice includes due date and payment instructions
- Itemized breakdown (base fee + special assessments)
- Payment history on invoice

**FR-2.6.4: Payment Collection**
- Online payment via credit/debit card
- Bank transfer (upload proof)
- Cash/check at admin office (manual receipt)
- Payment gateway integration (Stripe, PayPal)
- Installment payment tracking

**FR-2.6.5: Receipt Issuance**
- Auto-generate receipt on payment
- Email and in-app delivery
- Receipt number for accounting
- Tax receipt for deductible portions (if applicable)

**FR-2.6.6: Delinquency Management**
- Track overdue payments
- Auto-send reminders (7 days, 14 days, 30 days overdue)
- Late fees applied automatically
- Delinquent household list
- Escalation to collections (external process)

**FR-2.6.7: Financial Reporting**
- Monthly revenue report
- Outstanding balances report
- Payment trend analysis
- Delinquency rate metrics
- Export to accounting software (CSV, Excel)

#### Non-Functional Requirements

**NFR-2.6.1: Payment Security**
- PCI-DSS compliant payment processing
- Encrypted storage of payment info
- Tokenization for recurring payments
- Fraud detection integration

**NFR-2.6.2: Reconciliation**
- Daily payment reconciliation
- Automated matching of payments to invoices
- Dispute resolution workflow
- Audit trail for all financial transactions

### Acceptance Criteria

```gherkin
Given I am the admin treasurer
When I set the monthly association fee to $100
And I generate invoices for all households
Then each household receives an invoice via email and app notification
And households can pay online using credit card
And when a household pays $100
Then a receipt is auto-generated and sent
And the payment is recorded in the financial report
And if a household does not pay within 7 days
Then a reminder is sent automatically
```

### Business Rules

- **BR-2.6.1:** Invoices generated on 1st of each month
- **BR-2.6.2:** Payment due by 15th of each month
- **BR-2.6.3:** Late fees applied after 15th (configurable %)
- **BR-2.6.4:** Households with >3 months delinquency flagged for escalation
- **BR-2.6.5:** Special assessments require HOA board approval
- **BR-2.6.6:** Payment records retained for 7 years (compliance)

---


## 3. RESIDENCE Mobile App (Household Management)

### Purpose
Portal for household heads and members to manage household information, request services, handle gate passes, and communicate with community administration.

### Target Users
- **Household Head** – Primary resident administrator responsible for managing the household  
- **Household Member** – Registered residents under a household  
- **Household Beneficial User** – Non-residents associated with a household (e.g., relatives, helpers, drivers)

---

## Feature 3.1: Manage Household Members

### Business Value
Empowers household heads to maintain accurate household information, ensuring proper communication, access control, and accountability.

### User Story
```
As a Household Head
I want to add and manage family members in my household
So that everyone in my family can access community services
```

### Detailed Requirements

#### Functional Requirements

**FR-3.1.1: Member Addition**
- Add household member (name, relationship, age, photo)
- Member types (Spouse, Child, Parent, Sibling, Other)
- Contact information (email, phone for adults)
- Government ID upload (optional for adults)
- Member status (Active, Temporarily Away, Moved Out)

**FR-3.1.2: Member Roles & Permissions**
- Household head (primary, full access)
- Adult member (can request stickers, approve guests)
- Minor member (view-only, no permissions)
- Senior member (special access needs)

**FR-3.1.3: Member Management**
- Edit member details
- Deactivate member (when moved out)
- Transfer household head role (ownership change)
- Emergency contact designation

**FR-3.1.4: Member App Access**
- Send app invitation to adult members
- Members log in with own credentials
- Members see household shared data (guests, stickers, announcements)
- Activity log per member (who requested what)

#### Non-Functional Requirements

**NFR-3.1.1: Privacy**
- Minor member data restricted from public view
- Photo upload optional but recommended
- Member data encrypted at rest

**NFR-3.1.2: Usability**
- Quick add via contact import
- Photo capture via camera or gallery
- Relationship dropdown for consistency

### Acceptance Criteria

```gherkin
Given I am a household head
When I tap "Add Member"
And I enter my spouse's name and relationship
And I upload a photo
And I send an app invitation
Then my spouse receives an email to download the app
And my spouse can log in with own credentials
And my spouse can see our household's guest list
And my spouse can approve visitor entries via the app
```

### Business Rules

- **BR-3.1.1:** Only household head can add/remove members
- **BR-3.1.2:** One household head per household (can be transferred)
- **BR-3.1.3:** Adult members must have unique email addresses
- **BR-3.1.4:** Minor members cannot have independent app access
- **BR-3.1.5:** Maximum 10 members per household (configurable)

---

## Feature 3.2: Manage Beneficial Users (Non-Resident Sticker Recipients)

### Business Value
Allows households to grant vehicle access to non-resident individuals (helpers, drivers, relatives) who regularly visit, improving convenience while maintaining security.

### User Story
```
As a Household Head
I want to register beneficial users who need vehicle stickers
So that my helper/driver can enter the community without delays
```

### Detailed Requirements

#### Functional Requirements

**FR-3.2.1: Beneficial User Registration**
- Full name and relationship to household
- Contact information (phone)
- Government ID upload (required)
- Vehicle information (plate, make, model)
- Reason for access (Helper, Driver, Caregiver, Family)
- Access validity period (start and end date)

**FR-3.2.2: Sticker Request for Beneficial User**
- Submit sticker request linked to beneficial user
- Vehicle OR/CR document upload
- Household head endorsement (digital signature)
- Admin approval workflow (same as resident stickers)

**FR-3.2.3: Beneficial User Management**
- View all beneficial users
- Extend or terminate access
- Update vehicle information
- Renewal notifications before expiry

**FR-3.2.4: Access Tracking**
- View beneficial user entry/exit logs
- Receive alerts if beneficial user enters during unusual hours
- Revoke access immediately if needed

#### Non-Functional Requirements

**NFR-3.2.1: Security**
- Government ID verification (manual by admin)
- Photo captured at gate on first entry
- Access logs auditable

**NFR-3.2.2: Limits**
- Maximum beneficial users per household (e.g., 2-3)
- Beneficial user stickers count against household allocation

### Acceptance Criteria

```gherkin
Given I am a household head
When I add a beneficial user "Maria - Helper"
And I upload Maria's ID and vehicle registration
And I request a sticker for Maria's vehicle
Then the request is sent to the admin for approval
And when approved, Maria receives a sticker
And Maria can enter the community using RFID scan
And I can see Maria's entry logs in my app
```

### Business Rules

- **BR-3.2.1:** Beneficial user stickers count toward household allocation
- **BR-3.2.2:** Beneficial users cannot request services independently
- **BR-3.2.3:** Beneficial user access auto-expires after set period
- **BR-3.2.4:** Household head liable for beneficial user violations
- **BR-3.2.5:** Admin can revoke beneficial user access for violations

---

## Feature 3.3: Request Vehicle Stickers

### Business Value
Enables residents to request RFID stickers for their vehicles, ensuring authorized access while maintaining household allocation rules.

### User Story
```
As a Household Head
I want to request vehicle stickers for my cars
So that my family can enter the community without gate delays
```

### Detailed Requirements

#### Functional Requirements

**FR-3.3.1: Sticker Request Submission**
- Select member or beneficial user for sticker
- Enter vehicle details (plate, make, model, color)
- Upload OR/CR (vehicle registration document)
- Select sticker type (Permanent, Temporary, Replacement)
- Specify reason for request

**FR-3.3.2: Request Tracking**
- View all sticker requests (Pending, Approved, Rejected)
- Request status notifications (push + email)
- Estimated pickup date displayed
- Rejection reason visible if denied

**FR-3.3.3: Sticker Pickup**
- Notification when sticker ready for pickup
- Pickup location and hours displayed
- Digital signature for acknowledgment
- Assign sticker to vehicle in app (RFID number)

**FR-3.3.4: Sticker Management**
- View all active stickers
- Sticker expiration date tracking
- Renewal reminders (30 days before expiry)
- Report lost/stolen sticker (triggers deactivation)
- Request replacement sticker (with fee)

**FR-3.3.5: Vehicle Registration**
- Register vehicle plate number in app
- Link plate to RFID sticker
- Multiple vehicles per household (up to allocation)
- Update vehicle info (sold, new car)

#### Non-Functional Requirements

**NFR-3.3.1: Document Validation**
- OR/CR image quality check
- File size limit (5MB)
- OCR to auto-extract plate number (future)

**NFR-3.3.2: Real-Time Updates**
- Sticker approval pushes real-time to app
- Sentinel app updates within 30 seconds of approval

### Acceptance Criteria

```gherkin
Given I am a household head
When I request a sticker for my car with plate "ABC-1234"
And I upload the vehicle registration
And I submit the request
Then the admin receives the request
And when the admin approves it
Then I receive a notification "Sticker approved - ready for pickup"
And I go to the admin office to collect the sticker
And I scan the QR code on the sticker to link it to my app
And the next day, the gate guard scans my sticker and I enter smoothly
```

### Business Rules

- **BR-3.3.1:** Household cannot exceed sticker allocation
- **BR-3.3.2:** Vehicle OR/CR required for all sticker requests
- **BR-3.3.3:** Stickers expire annually on Dec 31st
- **BR-3.3.4:** Lost sticker replacement incurs fee
- **BR-3.3.5:** Sticker deactivated if vehicle sold (household must notify)

---

## Feature 3.4: Request Construction Permits

### Business Value
Streamlines the permit request process for residents, reducing back-and-forth with admin and ensuring all required information is collected upfront.

### User Story
```
As a Household Head
I want to submit a construction permit request
So that I can get approval for home renovation work
```

### Detailed Requirements

#### Functional Requirements

**FR-3.4.1: Permit Request Form**
- Project type (Renovation, Addition, Repair, Landscaping)
- Project description (text + photos)
- Timeline (start date, estimated duration)
- Contractor information (name, license, insurance upload)
- Number of workers
- Materials list (for road fee calculation)
- Special requirements (heavy equipment, extended hours)

**FR-3.4.2: Fee Quotation**
- Submit request for fee calculation
- Admin computes road fee
- Receive fee breakdown notification
- Accept or cancel based on fee

**FR-3.4.3: Payment**
- Pay road fee via app (online payment)
- Upload bank transfer proof (if paying offline)
- Payment confirmation notification

**FR-3.4.4: Permit Approval**
- Receive approval notification with permit PDF
- Permit includes QR code for gate scanning
- Worker list submission (names, IDs)
- Permit active/inactive status visible

**FR-3.4.5: Construction Monitoring**
- Submit progress updates (optional photos)
- Extend permit if timeline exceeded (request extension)
- Mark project as completed
- Receive incident reports from security (if any)

#### Non-Functional Requirements

**NFR-3.4.1: Document Management**
- Support PDF, JPG, PNG for uploads
- Maximum 10 files per request
- Contractor license verification (admin side)

**NFR-3.4.2: Payment Integration**
- Secure payment gateway (Stripe/PayPal)
- Receipt auto-generated
- Failed payment retry mechanism

### Acceptance Criteria

```gherkin
Given I am a household head
When I submit a construction permit request for "Bathroom Renovation"
And I upload contractor license and project photos
Then the admin receives my request
And the admin calculates a road fee of $300
And I receive a notification with the fee breakdown
And I pay $300 via the app
Then I receive a receipt
And the admin approves the permit
And I receive a digital permit with QR code
And I register 3 workers with IDs
And the workers can enter the gate by showing ID (matched against permit)
```

### Business Rules

- **BR-3.4.1:** Permit inactive until payment received
- **BR-3.4.2:** Workers cannot enter without active permit
- **BR-3.4.3:** Permit auto-expires after specified duration
- **BR-3.4.4:** Extension requires admin approval + additional fee
- **BR-3.4.5:** Violations result in permit suspension

---

## Feature 3.5: Schedule and Manage Guests

### Business Value
Provides residents with control over visitor access, reducing gate delays and improving security through pre-authorization.

### User Story
```
As a Household Member
I want to pre-register guests for upcoming visits
So that they can enter the community without calling me at the gate
```

### Detailed Requirements

#### Functional Requirements

**FR-3.5.1: Guest Pre-Registration**
- Guest name and contact information
- Visit type (Day trip, Multi-day stay)
- Visit date and expected arrival time
- Vehicle information (plate number)
- Purpose of visit (optional)
- Number of guests (if group visit)

**FR-3.5.2: Visit Duration Management**
- Day trip (same-day entry/exit)
- Multi-day visit (check-in and check-out dates)
- Overnight stay flagged to security
- Kulit (extended stay) tracking

**FR-3.5.3: Guest Approval Workflow**
- Pre-registered guests auto-approved at gate
- Unregistered guests trigger notification to household
- Real-time approval request (household approves via app)
- Reject guest entry remotely

**FR-3.5.4: Guest Notifications**
- Guest arrival notification (when gate logs entry)
- Guest departure notification
- Overstay alert (multi-day guest exceeds planned duration)

**FR-3.5.5: Guest History**
- View all past guests with entry/exit logs
- Frequent visitor identification (suggest beneficial user)
- Export guest history (CSV for records)

#### Non-Functional Requirements

**NFR-3.5.1: Real-Time Communication**
- Approval request delivered within 5 seconds
- WebSocket for instant household notification
- SMS fallback if app not connected

**NFR-3.5.2: Privacy**
- Guest data retained for audit (6 months)
- Guest cannot access household data
- Temporary access only

### Acceptance Criteria

```gherkin
Given I am a household member
When I pre-register my friend "John" for a visit tomorrow at 2pm
And I enter John's vehicle plate "XYZ-5678"
Then John appears in my guest list as "Pre-Registered"
And when John arrives at the gate tomorrow
Then the guard scans John's ID or plate
And the guard sees "Pre-Registered Guest for [My Name]"
And John is allowed entry without calling me
And I receive a notification "John has arrived"
And when John leaves, I receive "John has departed"
```

### Business Rules

- **BR-3.5.1:** Household must approve all guest entries (pre-registered or real-time)
- **BR-3.5.2:** Multi-day guests require admin notification (future)
- **BR-3.5.3:** Guest overstays trigger alert to household and security
- **BR-3.5.4:** Household liable for guest violations
- **BR-3.5.5:** Curfew hours limit guest entry (policy-dependent)

---

## Feature 3.6: Communication with Admin

### Business Value
Provides direct communication channel between residents and HOA administration, improving transparency and issue resolution.

### User Story
```
As a Household Head
I want to send messages to the admin
So that I can report issues, ask questions, or provide feedback
```

### Detailed Requirements

#### Functional Requirements

**FR-3.6.1: Messaging Interface**
- Compose message to admin (specific officer or general)
- Subject and message body
- Attach photos/documents (issue evidence)
- Message categories (Inquiry, Complaint, Request, Feedback)

**FR-3.6.2: Message Tracking**
- View all sent messages
- Message status (Sent, Read, Replied, Resolved)
- Reply notifications (push + email)
- Thread view for back-and-forth conversations

**FR-3.6.3: Admin Announcements**
- Receive announcements from admin
- Acknowledge important announcements
- View announcement history
- Filter by category

**FR-3.6.4: Emergency Contact**
- Quick dial to guard house
- Emergency button for urgent issues
- GPS location sharing for emergencies

#### Non-Functional Requirements

**NFR-3.6.1: Response Time Expectations**
- Admin SLA: respond within 24 hours
- Urgent messages flagged (admin sees priority inbox)
- Auto-reminder if no response after 48 hours

**NFR-3.6.2: Audit Trail**
- All messages logged with timestamp
- Dispute resolution records
- Export conversation history

### Acceptance Criteria

```gherkin
Given I am a household head
When I send a message to the admin about "Broken streetlight near my house"
And I attach a photo of the broken light
Then the admin receives my message in their inbox
And the admin replies "We will fix it within 3 days"
And I receive the reply as a push notification
And 3 days later, the admin marks the issue as "Resolved"
And I can confirm resolution in my message thread
```

### Business Rules

- **BR-3.6.1:** All messages timestamped and logged
- **BR-3.6.2:** Admin must respond within SLA (configurable)
- **BR-3.6.3:** Escalation to admin head if no response after 48 hours
- **BR-3.6.4:** Emergency messages bypass normal queue

---

## 4. SENTINEL Mobile/Tablet App (Security Gate Management)

### Purpose
A real-time entry and exit management system used by security officers to verify, monitor, and log all persons and vehicles entering or leaving the community.

### Target Users
- **Security Head** – Administrator of the security operations  
- **Security Officer** – On-duty personnel assigned to gate operations  

---

## Feature 4.1: Manage Resident Entry at Gate (RFID Scanning)

### Business Value
Automates resident vehicle verification, reducing gate processing time and eliminating manual checks for authorized residents.

### User Story
```
As a Gate Guard
I want to scan resident RFID stickers at the gate
So that authorized vehicles can enter quickly without manual verification
```

### Detailed Requirements

#### Functional Requirements

**FR-4.1.1: RFID Scanner Integration**
- Connect to RFID reader via Bluetooth/USB
- Auto-detect sticker when vehicle approaches
- Display resident info on successful scan (name, address, photo)
- Audio/visual feedback (beep + green light for valid sticker)

**FR-4.1.2: Sticker Validation**
- Verify sticker is active (not expired, not reported lost)
- Check against blacklist (delinquent payments, violations)
- Validate sticker belongs to current tenant
- Display expiration date and warning if expiring soon

**FR-4.1.3: Entry Logging**
- Auto-log entry with timestamp
- Capture vehicle plate (manual or camera OCR)
- Log gate location
- Log guard on duty
- Entry/exit tracking (pair entry with exit)

**FR-4.1.4: Manual Override**
- Allow entry for residents with forgotten stickers (temporary pass)
- Manual entry with reason (log for audit)
- Call household for verification
- Issue temporary gate pass (QR code valid for 24 hours)

**FR-4.1.5: Barrier Control**
- Auto-open barrier on valid scan
- Manual barrier control (open/close buttons)
- Emergency full-open mode (power failure)

#### Non-Functional Requirements

**NFR-4.1.1: Performance**
- RFID scan and validation within 2 seconds
- Entry logging background process (non-blocking)
- Offline mode if internet down (local cache of valid stickers)

**NFR-4.1.2: Reliability**
- RFID reader failure fallback (manual plate entry)
- Sync entry logs when connectivity restored
- Battery-powered reader for power outages

### Acceptance Criteria

```gherkin
Given I am a gate guard on duty
When a resident vehicle approaches the gate
And I scan the RFID sticker on the windshield
Then the system displays "Valid - [Resident Name] - 123 Main St"
And the barrier opens automatically
And the entry is logged with timestamp and vehicle plate
And the resident enters the community
And when the resident exits later, I scan again
And the exit is logged, completing the entry/exit pair
```

### Business Rules

- **BR-4.1.1:** Expired stickers trigger alert but can be overridden (grace period)
- **BR-4.1.2:** Lost/stolen stickers immediately deactivated (no entry)
- **BR-4.1.3:** Sticker transfers between vehicles not allowed (must re-register)
- **BR-4.1.4:** Entry logs retained for 1 year
- **BR-4.1.5:** Manual overrides require guard supervisor approval

---

## Feature 4.2: Manage Guest Entry at Gate

### Business Value
Balances security with resident convenience by verifying guests efficiently while maintaining audit trails.

### User Story
```
As a Gate Guard
I want to verify and log guest entries
So that only authorized visitors can enter the community
```

### Detailed Requirements

#### Functional Requirements

**FR-4.2.1: Guest Verification - Pre-Registered**
- Search guest list by name or plate number
- View guest details (name, host household, visit date)
- Verify guest ID matches registration
- Check-in guest (mark as arrived)
- Issue temporary gate pass (QR code or paper slip)

**FR-4.2.2: Guest Verification - Unregistered**
- Guest not in system triggers household notification
- Call household via app (one-tap call)
- Request household approval (approve/reject)
- Real-time approval response (within 2 minutes)
- If rejected, politely deny entry with reason

**FR-4.2.3: Guest Entry Logging**
- Capture guest name, ID number, plate number
- Purpose of visit
- Host household
- Expected duration (day trip vs. overnight)
- Photo capture (optional, for security record)
- Entry timestamp

**FR-4.2.4: Guest Exit Tracking**
- Search for guest in active entry logs
- Mark guest as departed
- Calculate visit duration
- Alert if overstay (multi-day guest exceeds planned duration)

**FR-4.2.5: Frequent Visitor Handling**
- Identify repeat guests (suggest beneficial user registration)
- Quick re-entry for same-day return
- Guest history visible to guard (previous visits)

#### Non-Functional Requirements

**NFR-4.2.1: Real-Time Approval**
- Household notification delivered within 5 seconds
- Approval timeout after 2 minutes (default deny + call household)
- SMS fallback if app not responding

**NFR-4.2.2: User Experience**
- Quick search (autocomplete)
- Minimal data entry (pre-filled from guest list)
- Offline guest approval queue (sync when online)

### Acceptance Criteria

```gherkin
Given I am a gate guard
When a guest arrives and says "I'm visiting Mr. Smith at 123 Main St"
And I search for "Smith" in the guest list
And I see the guest is pre-registered with plate "ABC-1234"
Then I verify the guest's ID matches the registration
And I check in the guest
And the barrier opens
And the entry is logged
And Mr. Smith receives a notification "Your guest has arrived"

Scenario: Unregistered Guest
When a guest arrives who is not pre-registered
Then I tap "Request Approval"
And Mr. Smith receives a push notification "Guest at gate - Approve?"
And Mr. Smith taps "Approve"
And I receive the approval within 10 seconds
And I allow the guest to enter
```

### Business Rules

- **BR-4.2.1:** All guests must be logged (no exceptions)
- **BR-4.2.2:** Unregistered guests require household approval
- **BR-4.2.3:** Guest denied if household does not respond within 2 minutes
- **BR-4.2.4:** Multi-day guests flagged for admin awareness (future)
- **BR-4.2.5:** Guest violations reported to host household

---

## Feature 4.3: Manage Delivery Entry at Gate

### Business Value
Ensures safe and efficient delivery handling while protecting residents from unwanted solicitation and theft.

### User Story
```
As a Gate Guard
I want to verify and monitor deliveries
So that legitimate deliveries reach residents while preventing unauthorized access
```

### Detailed Requirements

#### Functional Requirements

**FR-4.3.1: Delivery Verification**
- Delivery company name (LBC, JRS, FedEx, etc.)
- Driver name and ID check
- Recipient household (search by address or name)
- Package description (size, perishable flag)
- Delivery tracking number (optional)

**FR-4.3.2: Household Notification**
- Notify household via app: "Delivery for you at gate"
- Household responds:
  - "Allow entry - deliver to house"
  - "Hold at guard house - will pick up later"
  - "Not expecting - reject"
- Real-time response expected within 3 minutes

**FR-4.3.3: Perishable Item Handling**
- Flag perishable deliveries (food, medicine)
- Priority notification to household
- Expedited entry if household confirms
- Refrigeration at guard house if held (future)

**FR-4.3.4: Delivery Monitoring**
- Timer starts when delivery enters
- Alert if delivery takes too long (>30 mins)
- Response protocol for delayed delivery:
  - Call household to check
  - Dispatch roving guard to investigate
- Exit logging when delivery leaves

**FR-4.3.5: Package Hold Management**
- Log packages held at guard house
- Storage location tracking
- Household notification: "Package ready for pickup"
- Signature capture on resident pickup
- Unclaimed package alerts (>3 days)

#### Non-Functional Requirements

**NFR-4.3.1: Monitoring Automation**
- Automatic timer for delivery duration
- Push alerts for overstay
- GPS tracking integration (future)

**NFR-4.3.2: Storage Management**
- Package inventory system at guard house
- Barcode scanning for packages (future)
- Photo capture of package at intake

### Acceptance Criteria

```gherkin
Given I am a gate guard
When a delivery driver arrives with a package for "456 Oak Street"
Then I tap "Delivery Entry"
And I enter the driver's name and delivery company
And I notify the household "You have a delivery"
And the household responds "Allow entry"
Then I allow the driver to enter
And I start a timer for the delivery
And when the driver exits 10 minutes later
Then I log the exit
And the household receives "Delivery completed"

Scenario: Perishable Delivery
When a delivery is marked as "Perishable"
And the household responds "Hold at guard house"
Then I store the package in the cooler
And I log the storage location
And the household receives "Package at guard house - pickup ASAP"
```

### Business Rules

- **BR-4.3.1:** All deliveries require household approval
- **BR-4.3.2:** Perishable items flagged for priority
- **BR-4.3.3:** Delivery overstay (>30 min) triggers investigation
- **BR-4.3.4:** Unclaimed packages returned to sender after 7 days
- **BR-4.3.5:** Guard house storage capacity limited (policy per community)

---

## Feature 4.4: Manage Construction Worker Entry

### Business Value
Ensures only authorized construction workers enter, protects community from unauthorized contractors, and monitors project activity.

### User Story
```
As a Gate Guard
I want to verify construction workers against active permits
So that only approved workers can enter for authorized projects
```

### Detailed Requirements

#### Functional Requirements

**FR-4.4.1: Permit Verification**
- Search for active construction permits by address
- View permit details (project type, timeline, household)
- Display worker list (names registered by household)
- Verify permit is active (not expired, payment received)

**FR-4.4.2: Worker ID Check**
- Match worker ID against registered list
- Capture worker photo on first entry (face recognition setup)
- Log worker entry with timestamp
- Issue worker pass (temporary, valid for permit duration)

**FR-4.4.3: Worker Entry/Exit Logging**
- Daily check-in/check-out
- Track hours on site
- Alert if worker remains after curfew
- Material/equipment entry logging (heavy trucks)

**FR-4.4.4: Permit Status Monitoring**
- Display permit expiration date
- Alert if permit expired (no entry)
- On-hold permits flagged (payment issue, violation)
- Notify household if unauthorized worker attempts entry

**FR-4.4.5: Project Completion**
- Final exit logging
- Permit marked as completed
- Worker passes deactivated
- Exit inspection for material removal (optional)

#### Non-Functional Requirements

**NFR-4.4.1: Security**
- Photo capture mandatory for all workers
- ID verification against government database (future)
- Blacklist check for banned contractors

**NFR-4.4.2: Audit Trail**
- Complete worker entry/exit history per permit
- Time-on-site calculation
- Violation reporting linked to permits

### Acceptance Criteria

```gherkin
Given I am a gate guard
When a construction worker arrives and says "Working at 789 Elm Street"
And I search for the permit at 789 Elm Street
Then I see an active permit for "Kitchen Renovation"
And I see the worker list includes "Juan Dela Cruz"
And the worker shows ID matching "Juan Dela Cruz"
Then I take the worker's photo
And I log the entry
And I issue a temporary worker pass valid for 30 days
And when the worker exits at end of day, I log the exit
```

### Business Rules

- **BR-4.4.1:** Workers cannot enter without active permit
- **BR-4.4.2:** Worker ID must match registered list
- **BR-4.4.3:** Permit on hold = no entry (payment issue)
- **BR-4.4.4:** Expired permits require renewal before worker entry
- **BR-4.4.5:** Unregistered workers require household to update permit first

---

## Feature 4.5: Live Incident Reporting

### Business Value
Enables real-time security incident documentation and response coordination, improving community safety and accountability.

### User Story
```
As a Security Officer
I want to report incidents as they happen
So that the guard house can coordinate response and admin is notified
```

### Detailed Requirements

#### Functional Requirements

**FR-4.5.1: Incident Report Creation**
- Incident type (Suspicious person, Theft, Vandalism, Noise complaint, Medical emergency, Fire, Other)
- Location (gate, street, specific address)
- Severity (Low, Medium, High, Critical)
- Description (text + voice note)
- Photo/video capture (evidence)
- Involved parties (residents, guests, unknowns)

**FR-4.5.2: Real-Time Alerts**
- Auto-notify guard house on incident creation
- Critical incidents push to admin immediately
- Household notification if incident at their address
- SMS to emergency contacts (configurable)

**FR-4.5.3: CCTV Integration**
- View live CCTV feed at incident location
- AI-detected threat/anomaly alerts
- Bookmark footage timestamp for review
- Request footage archive for evidence

**FR-4.5.4: Response Coordination**
- Guard house assigns officers to respond
- Roving guard dispatched to location
- Status updates (Reported → Responding → Resolved)
- Resolution notes and actions taken

**FR-4.5.5: Incident History**
- View all incidents (filterable by type, date, location)
- Export incident reports (PDF)
- Incident analytics (hotspot mapping)
- Link related incidents (pattern detection)

#### Non-Functional Requirements

**NFR-4.5.1: Real-Time Performance**
- Incident alert delivered within 5 seconds
- CCTV feed loads within 10 seconds
- GPS location auto-captured from device

**NFR-4.5.2: Reliability**
- Offline incident logging (syncs when online)
- Photo/video compression for upload
- Backup to cloud storage immediately

### Acceptance Criteria

```gherkin
Given I am a roving guard
When I see suspicious activity near 321 Pine Street
And I tap "Report Incident"
And I select "Suspicious Person" and severity "High"
And I capture a photo and add description
And I submit the report
Then the guard house receives an alert immediately
And the guard house dispatcher assigns another officer to assist
And I receive "Backup en route - Officer Mike, ETA 2 mins"
And when the incident is resolved, I mark it as "Resolved"
And the admin receives the incident report for records
```

### Business Rules

- **BR-4.5.1:** All incidents must be logged (no verbal-only reports)
- **BR-4.5.2:** Critical incidents require immediate admin notification
- **BR-4.5.3:** Incident reports cannot be deleted (audit compliance)
- **BR-4.5.4:** Medical emergencies auto-dial external emergency services
- **BR-4.5.5:** Incident data retained for 3 years

---

## Cross-Application Integration

### Data Synchronization
- Real-time updates between Admin and Residence apps for approvals
- Sentinel app receives immediate updates when passes are approved
- Guest schedules sync from Residence to Sentinel
- Construction permits sync from Admin to Sentinel

### Notification System
- Admin actions trigger notifications to Residence app users
- Residence requests trigger workflow notifications to Admin
- Sentinel incidents notify both Admin and relevant households
- System-wide announcements pushed to all apps

### Security & Access Control
- Role-based access enforced across all apps
- Tenant isolation ensures data privacy between communities
- Audit logging for all sensitive operations
- Single sign-on (SSO) capability for users with multiple roles

### Reporting & Analytics
- Platform app aggregates data across all tenants
- Admin app generates community-specific reports
- Residence app shows household-specific history
- Sentinel app provides gate activity analytics

---

## Technical Architecture Considerations

### Multi-Tenancy Strategy
- Database-per-tenant or schema-per-tenant approach
- Tenant-aware routing and authentication
- Resource isolation and security
- Cross-tenant data protection

### Application Platform
- **Platform & Admin Apps**: Responsive web applications
- **Residence App**: Progressive web app (PWA) or native mobile app
- **Sentinel App**: Native mobile app with offline capability

### Architecture Patterns
- Microservices architecture for each app
- API gateway for inter-app communication
- Event-driven architecture for real-time updates
- Caching layers for performance optimization

### Security Implementation
- End-to-end encryption for sensitive data
- Multi-factor authentication for admin users
- Role-based access control (RBAC)
- Regular security audits and penetration testing
- GDPR and data privacy compliance

### Scalability & Performance
- Horizontal scaling for high-traffic periods
- Load balancing across application servers
- Database replication and sharding
- CDN for static assets
- Real-time messaging via WebSockets

---

## User Journey Examples

### Example 1: New Resident Onboarding
1. **Platform**: Superadmin creates residence in the community
2. **Admin**: Admin Head sets up household and creates household head account
3. **Residence**: Household head receives credentials, logs in, adds family members
4. **Residence**: Household head requests vehicle gate passes
5. **Admin**: Admin officer reviews and approves gate passes
6. **Residence**: Household head receives approval notification and QR codes
7. **Sentinel**: Security officer verifies resident at gate using QR code

### Example 2: Construction Permit Process
1. **Residence**: Household head submits construction permit with project details
2. **Admin**: Admin officer reviews application and calculates fees
3. **Residence**: Household head receives invoice and pays online
4. **Admin**: Admin officer approves permit after payment confirmation
5. **Residence**: Household head registers construction workers and generates passes
6. **Sentinel**: Security officers verify workers daily using worker passes
7. **Admin**: Admin monitors construction progress and receives incident reports

### Example 3: Guest Visit
1. **Residence**: Household member schedules guest visit (day trip)
2. **Sentinel**: Guest arrives at gate, security officer finds guest in system
3. **Sentinel**: Security officer verifies ID, issues temporary pass
4. **Sentinel**: Guest exits, security officer logs departure

---

## Implementation Roadmap

### Phase 1: Foundation (Months 1-3)
- Platform app core functionality
- Multi-tenancy infrastructure
- User authentication and authorization
- Basic admin app (household management)

### Phase 2: Core Operations (Months 4-6)
- Admin app gate pass approval system
- Residence app with household and vehicle management
- Basic Sentinel app for entry/exit logging
- Announcement system

### Phase 3: Advanced Features (Months 7-9)
- Construction permit workflow
- Guest management system
- Delivery tracking
- Election management system

### Phase 4: Enhancement & Optimization (Months 10-12)
- Mobile app optimization
- Offline capability for Sentinel
- Advanced reporting and analytics
- Payment gateway integration
- Performance optimization

---

## Success Metrics

### Platform Metrics
- Number of active communities (tenants)
- System uptime and reliability
- User satisfaction scores
- Support ticket resolution time

### Community Metrics
- Resident adoption rate
- Gate pass processing time
- Announcement engagement rate
- Construction permit turnaround time
- Guest entry processing time

### Security Metrics
- Entry/exit accuracy rate
- Incident response time
- Unauthorized entry attempts blocked
- Worker compliance rate

---

## Conclusion

This comprehensive platform provides an end-to-end solution for modern residential community management, streamlining operations for administrators, empowering residents with self-service capabilities, and enhancing security through digital verification systems. The modular architecture allows for scalability and customization to meet diverse community needs.