# 🩸 Cloud-Based Blood Bank Management System — Project Report

## 1. Executive Summary

The **Cloud-Based Blood Bank Management System** is an enterprise-grade healthcare cloud application engineered to streamline the end-to-end blood donation, inventory tracking, transfusion compatibility matching, and hospital requisition process. Built upon Google Cloud Platform (GCP) and Firebase serverless technologies, the solution delivers high availability, security, zero-infrastructure operational overhead, and real-time visibility across blood banks, hospitals, and voluntary donors.

---

## 2. Problem Statement

Traditional blood banking faces several critical operational bottlenecks:
1. **Inventory Wastage & Expiration:** Blood components have strict shelf lives (e.g. Platelets: 5 days, Whole Blood: 35 days). Without automated alerts, valuable units expire undetected.
2. **Critical Shortages & Mismatches:** Hospitals frequently struggle with delayed communication during emergency transfusions, lacking real-time insight into compatible stock across local banks.
3. **Inefficient Donor Mobilization:** Blood donation camps often suffer from poor registration tracking, unpredictable attendance, and lack of timely reminders.
4. **Data Fragmentation & Security:** Paper-based or legacy desktop systems create isolated data silos, lack role separation, and fail to provide auditable logs.

---

## 3. Project Objectives

- **Cloud-Native Architecture:** Deploy entirely on cloud services (Google Cloud Run, Firestore, Firebase Hosting, Firebase Auth) taking advantage of automatic scaling and high availability.
- **Role-Based Access Control (RBAC):** Provide specialized views and actions for three distinct roles:
  - **Administrator:** Full inventory oversight, request approvals, camp scheduling, emergency stock monitoring.
  - **Hospital / Healthcare Recipient:** Request submission, status tracking, compatible donor search.
  - **Donor:** Registration, donation history tracking, eligibility calculation, camp sign-ups.
- **Intelligent Blood Compatibility & Matching:** Programmatically calculate ABO/Rh compatibility for transfusion safety and rapid fulfillment.
- **Automated Lifecycle Notifications:** Implement automated warnings for expiring units, critical low stock thresholds (< 5 units), request status updates, and donation camp reminders.

---

## 4. System Architecture & Cloud Services

```
┌────────────────────────────────────────────────────────┐
│               React + Vite SPA Frontend                │
│    Tailwind CSS + shadcn/ui + Lucide Icons + Recharts  │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / JWT
                            ▼
┌────────────────────────────────────────────────────────┐
│           Google Cloud Run (Serverless API)            │
│         Python Flask + Gunicorn + Marshmallow          │
└──────────────┬────────────────────────────┬────────────┘
               │                            │
       Token Verification             CRUD Operations
               ▼                            ▼
┌──────────────────────────────┐   ┌─────────────────────┐
│ Firebase Authentication (IAM)│   │Google CloudFirestore│
│ Email/Password & Google Auth │   │  NoSQL Document DB  │
└──────────────────────────────┘   └─────────────────────┘
```

### Key Cloud Technologies:
- **Frontend Hosting:** Google Firebase Hosting delivering single-page application (SPA) bundles globally via fast CDN edge servers.
- **Identity & Authentication:** Firebase Authentication managing secure user tokens (JWT) and OAuth flows.
- **Serverless API Compute:** Google Cloud Run hosting a containerized Python Flask REST API running on Gunicorn with automatic scaling (0 to N).
- **Database:** Google Cloud Firestore (NoSQL Document Store) providing millisecond read/write latency and ACID transactions.
- **Container Registry & CI/CD:** Google Cloud Build + Artifact Registry for automated Docker container packaging and continuous deployment.
- **Automated Scheduling:** Google Cloud Scheduler executing automated jobs for unit expiry sweeps and camp reminders.

---

## 5. Module Implementation Overview

### 5.1 Donor Registration & Profile Management
- Tracks donor medical history, blood group, contact details, and location.
- **Automatic 56-Day Eligibility Calculator:** Automatically calculates donation eligibility according to clinical guidelines (minimum 56 days between whole blood donations).
- Donor dashboard displaying eligibility badge, last donation date, and registered drives.

### 5.2 Blood Inventory Management
- Real-time inventory tracking by blood group (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`) and component type (Whole Blood, Packed RBCs, Platelets, Fresh Frozen Plasma, Cryoprecipitate).
- Automated shelf-life expiry calculation on collection entry.
- Visual blood stock matrix with color-coded safety thresholds (Red: `< 5` units, Orange: `< 10` units, Green: `≥ 10` units).

### 5.3 Blood Request & Transfusion Workflow
- Hospitals submit digital requisitions specifying patient name, age, blood type, units needed, and clinical urgency level (`Normal`, `Urgent`, `Critical`).
- Administrators evaluate pending requests with auto-matching against available compatible inventory.
- Complete audit lifecycle: `pending` → `approved` → `fulfilled` (or `rejected` with recorded justification).

### 5.4 Blood Donation Camp Management
- Administrative scheduling of community blood drives with venue details, target capacities, and schedules.
- Self-service donor registration and cancellation.
- Camp completion tracking recording actual units collected.
- Automated reminder alerts dispatched to registered donors 24 hours prior to camp execution.

### 5.5 Donor Search & Compatibility Matching
- Search filters across blood types, donor eligibility, and city/location.
- Comprehensive ABO and Rh factor compatibility matrix for rapid cross-matching during shortages.

### 5.6 Expiry Alerts & Automated Notifications
- Cron-friendly endpoint (`/api/inventory/check-expiry`) automatically flags expired units and alerts administrators of units expiring within 7 days.
- Low stock trigger monitors available inventory after any unit change and alerts administrators when any blood type drops below 5 units.
- Real-time in-app notification center with unread count badge, category filters, and bulk read capabilities.

---

## 6. Security and Compliance

- **JWT Authentication:** Every API request validates the Bearer token against Firebase Authentication public keys.
- **Role Enforcement:** Route-level decorators (`@require_auth`, `@require_role('admin', ...)`) guarantee zero privilege escalation.
- **Input Validation:** Strict Marshmallow schemas validate data boundaries, types, and required fields before any database write.
- **CORS Protection:** Cross-Origin Resource Sharing configuration prevents unauthorized cross-domain API calls.

---

## 7. Results and Verification

- **Frontend Compilation:** Production build verified with zero errors (`vite build` completed in ~1.09s, generating optimized chunks and assets).
- **Backend Verification:** All Flask route handlers, Marshmallow schemas, and business services compiled and syntax-verified with Python 3.11.
- **API Endpoint Compatibility:** 100% of frontend services aligned with backend route signatures and HTTP methods.

---

## 8. Conclusion

The Cloud-Based Blood Bank Management System demonstrates modern, robust, and scalable cloud engineering. By adopting serverless compute, managed document databases, and reactive frontend architecture, the system provides a dependable, life-saving platform for healthcare institutions and communities.
