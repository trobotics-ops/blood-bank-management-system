# 🏗️ Cloud Blood Bank System Architecture

## High-Level System Architecture Diagram

```mermaid
flowchart TD
    subgraph Clients["Clients / Web Browsers"]
        Donor["Donor User<br/>(Mobile / Desktop)"]
        Hospital["Hospital User<br/>(Desktop / Portal)"]
        Admin["Blood Bank Admin<br/>(Dashboard)"]
    end

    subgraph FirebaseHosting["Google Cloud Platform — Edge Hosting"]
        StaticCDN["Firebase Hosting / CDN<br/>React + Vite SPA<br/>(Tailwind CSS + shadcn/ui)"]
    end

    subgraph AuthLayer["Identity & Access Management"]
        FirebaseAuth["Firebase Authentication<br/>(Email/Password & Google Sign-In)<br/>JWT Bearer Tokens"]
    end

    subgraph BackendHosting["Compute & Application Layer (GCP)"]
        CloudRun["Google Cloud Run (Serverless Container)<br/>Python Flask REST API + Gunicorn<br/>Role-Based Access Control (RBAC)"]
    end

    subgraph StorageLayer["Data & Persistence Layer (GCP)"]
        Firestore[("Google Cloud Firestore<br/>(NoSQL Document Database)<br/>Collections: users, donors,<br/>bloodInventory, bloodRequests, camps, notifications")]
    end

    subgraph BackgroundAutomations["Automation & Scheduled Tasks"]
        Scheduler["Google Cloud Scheduler<br/>(Periodic HTTP Triggers)"]
        ExpiryJob["/api/inventory/check-expiry<br/>(Daily Expiry Check)"]
        CampJob["/api/camps/reminders<br/>(Daily Camp Reminders)"]
    end

    subgraph NotificationsLayer["Alerting & Notification Services"]
        MailService["Flask-Mail / SMTP<br/>(Gmail SMTP Relay)"]
        InAppNotif["Firestore In-App Notifications<br/>(Realtime Unread Badge & Alerts)"]
    end

    %% Interactions
    Donor -->|HTTPS / Browsing| StaticCDN
    Hospital -->|HTTPS / Browsing| StaticCDN
    Admin -->|HTTPS / Browsing| StaticCDN

    Donor -.->|Authenticate| FirebaseAuth
    Hospital -.->|Authenticate| FirebaseAuth
    Admin -.->|Authenticate| FirebaseAuth

    StaticCDN -->|API Requests with Bearer JWT| CloudRun
    CloudRun -->|Verify ID Token & Check Claims| FirebaseAuth
    CloudRun -->|CRUD Queries & Transactions| Firestore

    Scheduler -->|Triggers| ExpiryJob
    Scheduler -->|Triggers| CampJob
    ExpiryJob -->|Invoke Endpoint| CloudRun
    CampJob -->|Invoke Endpoint| CloudRun

    CloudRun -->|Low Stock / Expiry / Request Status| InAppNotif
    CloudRun -->|Emergency Alerts / Reminders| MailService
    InAppNotif -->|Persist In-App Alerts| Firestore
```

---

## Component Breakdown

### 1. Presentation Tier (Frontend SPA)
- **Framework:** React 18, Vite build tool, Tailwind CSS, shadcn/ui component primitives, Lucide React icons.
- **Routing & State:** React Router 6, React Context (`AuthContext`), custom API hooks (`useApi`).
- **Hosting:** Firebase Hosting with global SSD CDN distribution, SSL/TLS termination, and single-page routing rewrites.

### 2. Identity Tier (Firebase Authentication)
- Manages authentication via Email/Password and OAuth (Google Sign-In).
- Issues signed JSON Web Tokens (JWT) verified on every backend API invocation via Firebase Admin SDK.
- Decouples credentials from the backend database while preserving granular Role-Based Access Control (`admin`, `hospital`, `donor`).

### 3. Application Tier (Backend REST API on Google Cloud Run)
- **Engine:** Python 3.11 with Flask, Marshmallow schema validation, and Gunicorn WSGI container.
- **Containerization:** Production Docker container deployed to Google Cloud Run with automatic horizontal scaling (0 to N instances).
- **Security:** Token verification decorator (`@require_auth`), role enforcement decorator (`@require_role`), CORS origin filtering.

### 4. Database Tier (Google Cloud Firestore)
- Fully managed, highly available NoSQL document database.
- Key Collections:
  - `users`: User metadata and roles (`admin`, `hospital`, `donor`).
  - `donors`: Donor personal details, blood group, eligibility calculation, donation history.
  - `bloodInventory`: Inventory units, blood type, collection/expiry dates, status.
  - `bloodRequests`: Hospital requests, patient info, urgency level, approval/fulfillment status.
  - `camps`: Blood donation drives, venues, capacities, registered donors.
  - `notifications`: User notifications for expiry, request updates, camp reminders, low stock.

### 5. Automated Background Jobs (Cloud Scheduler)
- **Daily Expiry Check:** Calls `/api/inventory/check-expiry` to auto-mark expired blood units and notify administrators of units expiring within 7 days.
- **Camp Reminders:** Calls `/api/camps/reminders` 24 hours before scheduled donation drives to notify registered donors.
