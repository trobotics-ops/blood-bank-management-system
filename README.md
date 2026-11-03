# 🩸 Cloud-Based Blood Bank Management System

A comprehensive, production-ready blood bank management system engineered with modern cloud technologies and deployed on Google Cloud Platform (GCP) and Firebase.

## 🚀 Tech Stack

| Layer | Technology | Description |
|-------|-----------|-------------|
| **Frontend** | React 18 + Vite | Modern single-page application |
| **Styling & UI** | Tailwind CSS + shadcn/ui | Accessible, responsive design system |
| **Icons & Charts** | Lucide React + Recharts | Rich visualizations and iconography |
| **Backend API** | Python 3.11 + Flask | RESTful microservice with Marshmallow |
| **WSGI Server** | Gunicorn | High-performance multi-threaded WSGI |
| **Database** | Google Cloud Firestore | Serverless NoSQL document database |
| **Authentication** | Firebase Authentication | Email/Password & Google OAuth (JWT) |
| **Frontend Hosting** | Firebase Hosting | Global SSD CDN with SSL & caching |
| **Backend Hosting** | Google Cloud Run | Fully managed serverless container runtime |
| **CI / CD** | Google Cloud Build | Multi-stage build and deployment pipeline |
| **Automations** | Google Cloud Scheduler | Automated cron for expiry and reminders |
| **Container** | Docker | Production containerization |

---

## 🌟 Core Features

1. **Donor Registration & Profile Management** — Self-service donor registration, automated 56-day clinical eligibility calculation, donation history tracking.
2. **Blood Inventory Management** — Real-time tracking by blood group (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`) and component type (`Whole Blood`, `Packed RBCs`, `Platelets`, `Plasma`, `Cryoprecipitate`).
3. **Blood Request Management** — Hospital blood requests with urgency ratings (`Normal`, `Urgent`, `Critical`), automated compatibility checks against inventory, and approval/fulfillment tracking.
4. **Donation Camp Management** — Schedule blood donation drives, manage attendee registrations, record collected units, and trigger 24h reminders.
5. **Donor Search & Compatibility Matching** — Search donors by blood type, location, and clinical eligibility with ABO/Rh transfusion compatibility checks.
6. **Expiry Alerts & Notifications** — Scheduled automatic expiry detection (`/api/inventory/check-expiry`), automated low-stock warnings (< 5 units), and in-app notification center.

---

## 👥 User Roles

- **Admin** — Complete system control (inventory additions, request approvals/rejections/fulfillments, camp creation, low-stock and expiry monitoring).
- **Hospital / Recipient** — Submit blood requests, track requisition status, search compatible donors, monitor available stock.
- **Donor** — Register as a donor, check donation eligibility, sign up for blood donation camps, view notifications.

---

## 📁 Project Structure

```
ccproj/
├── backend/
│   ├── app/
│   │   ├── models/         # Marshmallow data schemas (User, Donor, Inventory, Request, Camp)
│   │   ├── routes/         # Flask blueprints (auth, users, donors, inventory, requests, camps, notifications)
│   │   ├── services/       # Core business logic & Firestore CRUD
│   │   ├── utils/          # Compatibility chart & validators
│   │   ├── auth.py         # Firebase token verification & RBAC decorators
│   │   ├── config.py       # Environment configuration
│   │   └── __init__.py     # Flask factory & blueprint registration
│   ├── Dockerfile          # Production container specification
│   ├── requirements.txt    # Python dependencies
│   ├── run.py              # Application entrypoint
│   └── .env.example        # Backend environment template
├── frontend/
│   ├── src/
│   │   ├── components/     # UI primitives (shadcn) & common components (StatsCard, EmptyState, etc.)
│   │   ├── contexts/       # AuthContext for Firebase user state
│   │   ├── hooks/          # useAuth, useApi custom hooks
│   │   ├── lib/            # utils (formatting, constants, badges) & firebase client config
│   │   ├── pages/          # Auth, Dashboard, Donors, Inventory, Requests, Camps, Notifications
│   │   └── services/       # API integration client services
│   ├── package.json        # Node dependencies & build scripts
│   └── vite.config.js      # Vite bundler configuration
├── docs/
│   ├── architecture-diagram.md  # Detailed system architecture with Mermaid
│   └── project-report.md        # Complete academic/technical capstone report
├── firebase.json           # Firebase Hosting configuration with SPA rewrites
├── .firebaserc             # Firebase project configuration
└── cloudbuild.yaml         # GCP Cloud Build CI/CD pipeline
```

---

## ⚡ Quick Start & Local Development

### 1. Prerequisites
- **Python 3.11+**
- **Node.js 18+ & npm**
- **Firebase Project** with Authentication and Firestore enabled

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Place your Firebase serviceAccountKey.json in the backend/ directory

# Start Flask development server (runs on http://localhost:5000)
python run.py
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Update VITE_FIREBASE_* variables with your Firebase web configuration

# Start Vite development server (runs on http://localhost:5173)
npm run dev

# Or build for production
npm run build
```

---

## ☁️ Deployment Instructions

### Method 1: Automated CI/CD via Google Cloud Build

Ensure Google Cloud SDK is authenticated, then trigger Cloud Build:

```bash
gcloud builds submit --config=cloudbuild.yaml
```

### Method 2: Manual Step-by-Step Deployment

#### Deploy Backend to Google Cloud Run:
```bash
cd backend

# Build and push container to Google Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/blood-bank-api

# Deploy to Cloud Run
gcloud run deploy blood-bank-api \
  --image gcr.io/YOUR_PROJECT_ID/blood-bank-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="FLASK_ENV=production,FIREBASE_PROJECT_ID=YOUR_PROJECT_ID"
```

#### Deploy Frontend to Firebase Hosting:
```bash
cd frontend

# Build optimized production bundle
npm run build

# Deploy to Firebase Hosting from project root
cd ..
firebase deploy --only hosting
```

#### Set Up Automated Cloud Scheduler Cron:
```bash
# Daily Expiry Check at 00:00 UTC
gcloud scheduler jobs create http blood-expiry-check \
  --schedule="0 0 * * *" \
  --uri="https://YOUR_CLOUD_RUN_URL/api/inventory/check-expiry" \
  --http-method=POST

# Daily Camp Reminders at 08:00 UTC
gcloud scheduler jobs create http blood-camp-reminders \
  --schedule="0 8 * * *" \
  --uri="https://YOUR_CLOUD_RUN_URL/api/camps/reminders" \
  --http-method=POST
```

---

## 📡 Key API Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/api/auth/register` | Register user document in Firestore | Authenticated |
| `GET` | `/api/users/me` | Fetch authenticated user profile | Authenticated |
| `GET` | `/api/donors/me` | Fetch donor profile of authenticated user | Authenticated |
| `PUT` | `/api/donors/me` | Update donor profile | Donor / Admin |
| `GET` | `/api/donors` | List all registered donors | Admin |
| `POST` | `/api/donors` | Register as a blood donor | Donor |
| `GET` | `/api/donors/search` | Search donors by blood type, city, eligibility | Admin, Hospital |
| `GET` | `/api/inventory` | List blood inventory units | Admin, Hospital (summary) |
| `GET` | `/api/inventory/summary` | Grouped blood stock counts by type | Authenticated |
| `GET` | `/api/inventory/stats` | Aggregated inventory statistics | Authenticated |
| `GET` | `/api/inventory/expiring` | Units expiring within specified days | Admin |
| `POST` | `/api/inventory` | Add blood unit (auto-calculates expiry) | Admin |
| `POST` | `/api/inventory/check-expiry`| Mark expired units & notify admins | Scheduler / Public |
| `GET` | `/api/requests` | List blood requests (admin: all, hospital: own) | Authenticated |
| `GET` | `/api/requests/my` | List current user's blood requests | Authenticated |
| `GET` | `/api/requests/stats` | Blood request counts by status | Authenticated |
| `POST` | `/api/requests` | Submit hospital blood request | Hospital |
| `PATCH`| `/api/requests/:id/approve` | Approve request & match compatible stock | Admin |
| `PATCH`| `/api/requests/:id/reject` | Reject request with recorded justification | Admin |
| `PATCH`| `/api/requests/:id/fulfill` | Fulfill approved blood request | Admin |
| `GET` | `/api/camps` | List blood donation camps | Authenticated |
| `GET` | `/api/camps/my` | List camps current donor has signed up for | Authenticated |
| `POST` | `/api/camps` | Create new donation camp | Admin |
| `POST` | `/api/camps/:id/register` | Register donor for camp | Donor |
| `POST` | `/api/camps/:id/unregister`| Cancel donor camp registration | Donor |
| `PATCH`| `/api/camps/:id/complete` | Complete camp and record collected units | Admin |
| `POST` | `/api/camps/reminders` | Send camp reminders for drives tomorrow | Scheduler / Admin |
| `GET` | `/api/notifications` | Fetch user notifications | Authenticated |
| `GET` | `/api/notifications/unread-count`| Get unread notification badge count | Authenticated |
| `PATCH`| `/api/notifications/:id/read` | Mark individual notification as read | Authenticated |
| `PUT` | `/api/notifications/read-all` | Mark all user notifications as read | Authenticated |

---

## 📄 Documentation

- [System Architecture Diagram](docs/architecture-diagram.md)
- [Comprehensive Project Capstone Report](docs/project-report.md)

---

## 📜 License

This project is developed as part of a Cloud Computing Course Capstone Project.
