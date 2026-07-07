# Module Specification Document (MSD)
## Eventspace: Society & Event Management Platform

This document defines the modular architecture of Eventspace. The platform is designed around a **Configurable Event Modules architecture**, where events are not defined by a fixed feature set, but are composed of toggleable modules that Society Administrators can enable or disable during event creation to tailor the system to different event formats.

---

### 1. Architectural Overview: Configurable Event Modules

In Eventspace, an event is a dynamic collection of functional modules. During event creation, the Society Administrator chooses which operational modules are active. This enables the platform to serve highly diverse university scenarios without code modification or over-engineering.

#### 1.1 Example Configurations
* **Hackathon Setup:**
  * Active Modules: *Identity, Event & Timeline, Registration & Team Management, Dynamic Registration Form Builder, Project Submission, Attendance & Scan, Judicial Scoring, Credential Management, Gallery, Notification Management, Audit Logs.*
* **Workshop Setup:**
  * Active Modules: *Identity, Event & Timeline, Registration & Team Management, Dynamic Registration Form Builder, Attendance & Scan, Credential Management, Feedback & Analytics, Notification Management.*
* **Cultural Celebration / Fest Setup:**
  * Active Modules: *Identity, Event & Timeline, Registration & Team Management, Dynamic Registration Form Builder, Attendance & Scan, Task & Collaboration, Financial Ledger, Gallery, Feedback & Analytics, Notification Management, Audit Logs.*

#### 1.2 Event Templates
To streamline event creation, the system supports reusable event templates. Society Administrators can select a pre-configured template that automatically enables the recommended set of modules:
* **Hackathon:** Enables Team Management, Project Submission, Judicial Scoring, Attendance & Scan, Credentials, Gallery, and Notifications.
* **Workshop:** Enables Individual Registration, Attendance & Scan, Credentials, Feedback, and Notifications.
* **Seminar:** Enables Registration, Attendance & Scan, and Notifications.
* **Technical Talk:** Enables Registration, Attendance & Scan, and Notifications.
* **Festival:** Enables Registration, Attendance & Scan, Volunteers, Gallery, Budget, and Notifications.
* **Farewell:** Enables Registration, Budget, Gallery, and Notifications.
* **Sports Event:** Enables Team Management, Attendance & Scan, Volunteers, and Notifications.
* **Coding Contest:** Enables Registration, Attendance & Scan, Judicial Scoring, and Notifications.
* **Photography Competition:** Enables Registration, Project Submission, Judicial Scoring, Gallery, and Notifications.

---

### 2. Event Lifecycle

Each event created on the platform transitions through a strict lifecycle. Society Administrators control these state transitions, which dictate allowed and restricted actions for all users:

* **Draft:**
  * *Purpose:* Pre-launch planning phase where organizers define details and configure active modules.
  * *Allowed Actions:* Edit event metadata, toggle active modules, configure timeline schedules, upload sponsor assets.
  * *Restricted Actions:* Public visibility, participant registrations, ticket check-ins, evaluation grading, certificate generation.
* **Published:**
  * *Purpose:* Publicly list the event to generate interest and visibility before signups begin.
  * *Allowed Actions:* Public viewing of the landing page, schedule, sponsors, and announcements.
  * *Restricted Actions:* Participant registration, ticket check-ins, evaluations.
* **Registration Open:**
  * *Purpose:* Active signup window.
  * *Allowed Actions:* Individual/team registrations, custom form submissions, QR ticket generation, registration cancellations.
  * *Restricted Actions:* Ticket check-ins, evaluation scoring, certificate generation.
* **Registration Closed:**
  * *Purpose:* Locking the roster to prepare logistics.
  * *Allowed Actions:* Roster review, volunteer task assignments, judge assignments, team composition overrides.
  * *Restricted Actions:* New registrations, participant-led team edits.
* **Ongoing:**
  * *Purpose:* Active execution of the event on the designated date(s).
  * *Allowed Actions:* Real-time QR check-in scanning, project submission uploads, volunteer task progress updates, real-time activity timelines.
  * *Restricted Actions:* Registration modifications, timeline creation changes.
* **Completed:**
  * *Purpose:* Wrap-up phase.
  * *Allowed Actions:* Judicial scoring, aggregate feedback submission, budget reconciliation, certificate generation.
  * *Restricted Actions:* Participant check-ins, project submissions.
* **Archived:**
  * *Purpose:* Immutable record preservation.
  * *Allowed Actions:* Read-only historical data searches, report downloads, public certificate validation lookups.
  * *Restricted Actions:* All database modifications, scoring changes, budget logs.

---

### 3. Member Lifecycle

Users transition through specific stages to obtain administrative or operational membership within a college society:

1. **Invitation:** An authorized Administrator or Core Team member dispatches an invitation link/token to a user.
2. **Registration:** The user creates their account profile and claims their society affiliation.
3. **Pending Approval:** The user's membership request is held in an administrative verification queue.
4. **Active Member:** The user is approved, granting access to society-only announcements, events, and forums.
5. **Core Team:** General member is elevated to operational leadership, granting privileges to manage event sub-tasks, logistics, and budgets.
6. **Society Administrator:** Core Team member is promoted to full society manager, obtaining global control over the society's specific configurations and events.
7. **Alumni / Inactive:** The user graduates or steps down. Their account transitions to a read-only historical archive state to preserve historical audit logs.

---

### 4. Permission Matrix

The following matrix defines role-based access rights across Eventspace functions:

| Function | Super Admin | Society Admin | Core Team | Volunteer | Judge | Participant | Guest |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Create Event** | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Edit Event** | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Delete Event** | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Publish Event** | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Register** | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| **Scan Attendance** | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| **Manage Volunteers** | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Manage Budget** | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Upload Gallery** | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| **Generate Certs** | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **View Reports** | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Submit Scores** | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| **Download Certs** | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ |

---

### 5. Module Specifications

---

#### 5.1 Tenant & Identity Module
* **Purpose:** Provides secure authentication, identity verification, user profile management, and multi-tenant access control boundaries.
* **Responsibilities:**
  * Managing user profiles, roles, and tenant (society) affiliations.
  * Ensuring cryptographic password security and token-based session lifecycle.
  * Enforcing role-based access control (RBAC) boundaries across all platform interfaces.
* **Main Features:**
  * Single sign-on and self-registration workflows for participants.
  * Admin-mediated onboarding for Society Admins, Volunteers, and Judges.
  * Cross-tenant data separation (ensuring one society cannot access another’s ledger or registry).
  * Email verification and password recovery flows.
* **User Roles:**
  * *Super Admin:* Manages global settings, onboard new societies, and elevates user roles.
  * *Society Admin:* Manages club volunteers and evaluates judges.
  * *All Roles:* Authentication, password management, and profile updates.
* **Dependencies:** None. This is the foundation module for all other modules.
* **Future Scope:** Integration with university Single Sign-On (SSO) systems and multi-factor authentication (MFA).

---

#### 5.2 Event Configuration & Scheduling Module
* **Purpose:** Handles the creation, scheduling, status tracking, and module configuration for events.
* **Responsibilities:**
  * Storing event metadata (name, dates, venue, capacity, status, banners).
  * Managing active module flags for each event instance.
  * Storing and displaying chronological event timelines and tracking overall administrative activities.
* **Main Features:**
  * Wizard interface for creating events and selecting active toggleable modules instead of a fixed feature set.
  * Real-time status tracker (Draft, Published, Registration Open, Registration Closed, Ongoing, Completed, Archived).
  * Drag-and-drop chronological timeline designer.
  * **Activity Timeline:** A real-time chronological timeline tracking and displaying platform events to administrators (e.g., *10:15 AM - Event Created; 10:32 AM - Volunteer Assigned; 11:05 AM - Participant Registered; 12:10 PM - Certificate Generated*).
  * Public-facing event directory and search.
* **User Roles:**
  * *Super Admin / Society Admin:* Full CRUD operations on events, status transitions, and module toggles.
  * *Participant / Public:* Browsing events and viewing timelines.
* **Dependencies:** *Tenant & Identity Module*.
* **Future Scope:** Calendar integration exports and automated room reservation conflicts detection.

---

#### 5.3 Registration & Team Management Module
* **Purpose:** Handles user registration, check-ins, capacity limits, and team formations.
* **Responsibilities:**
  * Managing individual and group registration states.
  * Enforcing registration deadlines and capacity caps.
  * Handling team composition validation.
* **Main Features:**
  * Team creation, invitation tokens, and member management.
  * Automatic waitlisting when registration capacity limit is reached.
  * Duplicate entry prevention based on email or identity credentials.
* **User Roles:**
  * *Society Admin:* Configure capacities, deadlines, and view registries.
  * *Participant:* Register, create teams, and invite members.
* **Dependencies:** *Tenant & Identity Module*, *Event Configuration & Scheduling Module*.
* **Future Scope:** Automated waitlist clearance algorithms and team matchmaking based on skill filters.

---

#### 5.4 Dynamic Registration Form Builder Module
* **Purpose:** Allows each event configuration to define its own unique registration form to collect specialized participant data.
* **Responsibilities:**
  * Storing form layouts and validation schemas per event.
  * Processing and validating submitted data fields.
* **Main Features:**
  * Drag-and-drop form building dashboard.
  * Supported Field Types: Text, Email, Phone, Number, Dropdown, Radio Buttons, Checkbox, Date, File Upload, Resume Upload, GitHub Repository URL, Portfolio URL, Live Demo URL, Demo Video URL, LinkedIn, and Custom Fields.
  * Dynamic form rendering on event registration views.
* **User Roles:**
  * *Society Admin / Core Team:* Build and edit registration forms.
  * *Participant:* View and fill out custom registration forms.
* **Dependencies:** *Tenant & Identity Module*, *Event Configuration & Scheduling Module*, *Registration & Team Management Module*.
* **Future Scope:** Conditional logic fields and integration with external student academic databases for auto-fill data.

---

#### 5.5 Project Submission Module
* **Purpose:** Allows participants of technical events to submit their project artifacts for evaluation.
* **Responsibilities:**
  * Storing and validating project submission metadata.
  * Linking submissions to registered teams or individual participants.
  * Restricting submission access based on active event status and deadlines.
* **Main Features:**
  * GitHub Repository URL collection (collect-only; no external API integration).
  * Live Demo URL collection.
  * Demo Video link collection.
  * Document upload capability (e.g. project presentation slides).
  * Custom notes field for project explanations.
  * Automated deadline lock (disabling submissions when deadline expires).
* **User Roles:**
  * *Participant (Team Leader):* Create, update, and delete project submission before deadline.
  * *Judge / Society Admin:* View submissions for evaluation purposes.
* **Dependencies:** *Tenant & Identity Module*, *Event Configuration & Scheduling Module*, *Registration & Team Management Module*, *Dynamic Registration Form Builder Module*.
* **Future Scope:** Code analysis validation, commit history checking, and build verification metrics.

---

#### 5.6 Attendance & Scan Module
* **Purpose:** Manages automated check-ins and check-out logs using QR tickets.
* **Responsibilities:**
  * Generating unique QR-code ticket data linked to confirmed participants.
  * Validating ticket check-ins and logging scanning history.
  * Enforcing single-use validation constraints to prevent duplicate scanning fraud.
* **Main Features:**
  * Unique QR-code ticket rendering on participant dashboards.
  * Mobile web camera scanner interface.
  * Real-time attendance dashboard (present vs. absent statistics).
  * CSV/Excel check-in log reports export.
* **User Roles:**
  * *Volunteer / Society Admin:* Scan and validate tickets, view attendance statistics.
  * *Participant:* View and download personal QR check-in ticket.
* **Dependencies:** *Tenant & Identity Module*, *Event Configuration & Scheduling Module*, *Registration & Team Management Module*.
* **Future Scope:** Offline verification support via local cached credentials, and multi-session check-in logs.

---

#### 5.7 Task & Collaboration Module
* **Purpose:** Facilitates task delegation, management, and progress tracking for event organizers.
* **Responsibilities:**
  * Creating, assigning, and updating volunteer tasks.
  * Sending notifications on task changes.
  * Enforcing role-based volunteer task visibility boundaries.
* **Main Features:**
  * Task creation dashboard with description, priority, and deadline fields.
  * Volunteer-specific task list boards.
  * Status updates tracking (Pending, In Progress, Completed).
  * System notification alerts on task assignments.
* **User Roles:**
  * *Society Admin:* Create, assign, update, and delete tasks; track overall progress.
  * *Volunteer:* View assigned tasks and update progress status.
* **Dependencies:** *Tenant & Identity Module*, *Event Configuration & Scheduling Module*.
* **Future Scope:** Kanban board layouts, file attachments on tasks, and task dependency configurations.

---

#### 5.8 Judicial Scoring Module
* **Purpose:** Manages team evaluations, scoring rubrics, and dynamic leaderboard rankings.
* **Responsibilities:**
  * Storing multi-criteria scoring configurations.
  * Recording scoring submissions from assigned judges.
  * Aggregating scores and computing leaderboard positions dynamically.
* **Main Features:**
  * Rubric builder supporting customizable evaluation criteria weightages.
  * Secure Judge scoring entry sheet interface.
  * Live aggregate leaderboard calculations.
  * Evaluation stats export for administrative archives.
* **User Roles:**
  * *Society Admin:* Define evaluation rubrics, assign teams to judges, and view master scoring boards.
  * *Judge:* Access assigned team profiles, view submissions, and record numeric scores.
  * *Participant / Public:* View authorized leaderboard rankings.
* **Dependencies:** *Tenant & Identity Module*, *Event Configuration & Scheduling Module*, *Registration & Team Management Module*, *Project Submission Module*.
* **Future Scope:** Real-time judge disagreement flag checks and automated rubric templates.

---

#### 5.9 Financial Ledger Module
* **Purpose:** Tracks allocations, income streams, and expenditure logs for events.
* **Responsibilities:**
  * Managing total allocated budgets for events.
  * Recording individual income items (sponsorships, university grants).
  * Tracking expenditure items (food, logistics, printing) and storing receipt links.
  * Enforcing budget limit checks.
* **Main Features:**
  * General ledger balance overview displaying real-time cash flow.
  * Category-wise expenses tracking charts.
  * Digital receipt upload storage links.
  * Financial CSV/Excel transaction report exports.
* **User Roles:**
  * *Super Admin / Society Admin:* Log transactions, modify allocations, and view financial dashboards.
  * *University Auditor / Club Advisor:* Read-only financial ledger access.
* **Dependencies:** *Tenant & Identity Module*, *Event Configuration & Scheduling Module*.
* **Future Scope:** Automated billing ledger integration and multi-currency exchange rate conversions.

---

#### 5.10 Faculty Approval Workflow Module
* **Purpose:** Manages college administration oversight, approval pipelines, and budget compliance governance.
* **Responsibilities:**
  * Handling multi-stage event proposal approvals.
  * Storing review comments, status flags, and budget signing events.
* **Main Features:**
  * Event proposal submittal board for society admins.
  * Faculty Coordinator review panel with Approve, Reject, and Revision request options.
  * Budget request review and signature logs.
  * Society compliance and activity report generation.
* **User Roles:**
  * *Faculty Coordinator:* Review proposed events, approve budgets, view reports, and monitor society activities.
  * *Society Admin:* Submit event proposals and budget requests.
* **Dependencies:** *Tenant & Identity Module*, *Event Configuration & Scheduling Module*, *Financial Ledger Module*.
* **Future Scope:** Automatic multi-department routing (e.g. Finance, Logistics, and Academic boards).

---

#### 5.11 Asset & Inventory Management Module
* **Purpose:** Allows societies to manage shared university equipment, check availability, and log reservations.
* **Responsibilities:**
  * Tracking equipment inventory and asset conditions.
  * Managing reservation schedules and availability conflicts.
  * Recording reservation issuance and returns history.
* **Main Features:**
  * Inventory directory tracking items (Projector, Microphone, Camera, Laptop, Extension Boards, Standees, Banners).
  * Real-time item availability indicators.
  * Reservation schedule request wizard.
  * History logging for issues, returns, and damages.
* **User Roles:**
  * *Society Admin / Core Team:* Reserve items, record issue/return status.
  * *Super Admin / Lab In-Charge:* Add/modify inventory listings, override reservation conflicts.
* **Dependencies:** *Tenant & Identity Module*, *Event Configuration & Scheduling Module*.
* **Future Scope:** Maintenance alarm systems and RFID/barcode integrations.

---

#### 5.12 Notification Management Module
* **Purpose:** Centralizes, routes, and dispatches all platform notification dispatches.
* **Responsibilities:**
  * Storing templates and handling user notification preferences.
  * Routing and processing dispatch requests.
* **Main Features:**
  * In-app notification bell feed.
  * Email notification engine.
  * Automated dispatches for: Registration Confirmation, Event Reminders, Certificate Availability, Volunteer Assignments, Judge Assignments, and Broadcast Announcements.
* **User Roles:**
  * *All Users:* View notifications, edit preference settings.
  * *Society Admin / Super Admin:* Broadcast event announcement alerts.
* **Dependencies:** *Tenant & Identity Module*.
* **Future Scope:** Push notifications, SMS integration, and WhatsApp integration.

---

#### 5.13 Credential Management Module
* **Purpose:** Automates credential generation, verification, and user notification dispatches.
* **Responsibilities:**
  * Compiling custom certificate documents securely.
  * Hosting public lookup verification portals.
* **Main Features:**
  * Dynamic template generation with placeholder values (name, event, date, role).
  * Asynchronous document compilation pipelines.
  * Cryptographic certificate hash generation for public verification queries.
* **User Roles:**
  * *Society Admin:* Choose template, trigger bulk credential dispatch, and monitor delivery reports.
  * *Participant:* Download personal certificate from dashboard.
  * *Third-Party Verification (Public):* Input certificate hash to verify authenticity.
* **Dependencies:** *Tenant & Identity Module*, *Event Configuration & Scheduling Module*, *Registration & Team Management Module*.
* **Future Scope:** Digital signatures, automated LinkedIn direct-sharing integrations.

---

#### 5.14 Feedback & Analytics Module
* **Purpose:** Collects participant surveys and aggregates feedback metrics to assess event success.
* **Responsibilities:**
  * Storing and validating survey templates.
  * Logging participant feedback submissions securely and anonymously.
  * Aggregating rating scores for analytical dashboards.
* **Main Features:**
  * Post-event feedback forms with numeric ratings and text fields.
  * Anonymous submission toggles.
  * Event analytics overview dashboard.
* **User Roles:**
  * *Society Admin:* Design feedback forms and view analytical summaries.
  * *Participant:* Submit post-event feedback surveys.
* **Dependencies:** *Tenant & Identity Module*, *Event Configuration & Scheduling Module*, *Registration & Team Management Module*.
* **Future Scope:** Multi-event trend analysis charts and automated sentiment analysis on text responses.

---

#### 5.15 Audit Logs Module
* **Purpose:** Records administrative activities to audit compliance, security breaches, and change tracking.
* **Responsibilities:**
  * Storing immutable transaction logs of admin actions.
  * Providing search and audit filters for security teams.
* **Main Features:**
  * Immutable record generation for events: Event Created, Event Updated, Budget Modified, Volunteer Assigned, Certificate Generated, Member Removed, and Announcement Published.
  * Metadata capturing (action, timestamp, operator user ID, and device profile).
  * System-wide audit search log.
* **User Roles:**
  * *Super Admin:* Full read-only audit log dashboard access.
  * *Society Admin:* Read-only logs restricted to their own society tenant.
* **Dependencies:** *Tenant & Identity Module*.
* **Future Scope:** Automatic anomaly detection warnings (e.g. alert super admin on rapid permission alterations).

---

#### 5.16 Public Event Portal Module
* **Purpose:** Serves public visitors with an open, non-authenticated portal to discover and register for events.
* **Responsibilities:**
  * Serving public-facing data (upcoming events, announcements, details).
  * Allowing initial registration steps without requiring a registered account.
* **Main Features:**
  * Public event calendar and registry.
  * Event detailed landing pages.
  * Public gallery view and sponsor display blocks.
  * Contact boards and news updates.
* **User Roles:**
  * *Guest / Public Visitor:* Browse upcoming events, view sponsors, view gallery, and register for open events.
* **Dependencies:** *Event Configuration & Scheduling Module*, *Registration & Team Management Module*.
* **Future Scope:** Automated SEO meta tag generation, social media share buttons, and public RSS feeds.

---

### 6. Product Design Philosophy

Eventspace follows a modular architecture governed by the following core principles:
* **Independent Tenant Operations:** Every university society operates within its own secure tenant boundary, isolating data, financials, member rosters, and configurations.
* **Highly Configurable Event Instances:** No event has a fixed feature set. Society Administrators select which functional modules are active for an event instance, optimizing resource utilization.
* **Extensible Module Plug-ins:** The codebase is designed so that new modules (e.g. automated certificate design tools or payment processor integrations) can be written as plug-ins and integrated without structural redesign of the core system database or router.
* **Scale-First Design:** The application structures read-write transactions, document generations, and ledger balancing flows to support peak campus fests with zero single points of performance bottlenecks.
