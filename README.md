# 🩸 Cloud-Based Blood Bank Management System

A comprehensive blood bank management system built with modern cloud technologies, deployed on Google Cloud Platform (GCP) using free-tier services.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js + Vite + Tailwind CSS + shadcn/ui |
| Backend | Python Flask (REST API) |
| Database | Google Cloud Firestore |
| Authentication | Firebase Authentication |
| Frontend Hosting | Firebase Hosting |
| Backend Hosting | Google Cloud Run |
| Notifications | Flask-Mail (Gmail SMTP) |
| Containerization | Docker |

## Features

1. **Donor Registration & Profile Management** — Register donors, track eligibility, donation history
2. **Blood Inventory Management** — Track blood units by type, quantity, collection/expiry dates
3. **Blood Request Management** — Hospitals request blood, admin approves, auto-match inventory
4. **Blood Donation Camp Management** — Schedule camps, manage registrations and collections
5. **Donor Search & Matching** — Search by blood type, location, compatible types
6. **Expiry Alerts & Notifications** — Email alerts for expiring units, request updates, camp reminders

## User Roles

- **Admin** — Full system management (inventory, donors, requests, camps)
- **Hospital/Recipient** — Submit blood requests, search donors
- **Donor** — Register, view camps, manage profile

## Project Structure

```
CC_project/
├── backend/          # Flask REST API
│   ├── app/
│   │   ├── routes/   # API endpoints
│   │   ├── services/ # Business logic
│   │   ├── models/   # Data schemas
│   │   └── utils/    # Helpers
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/         # React Application
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── contexts/
│       └── services/
└── docs/             # Documentation
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- Google Cloud account (free tier)
- Firebase project
- Docker (for deployment)

## Setup Instructions

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (e.g., `blood-bank-mgmt`)
3. Enable **Authentication** → Sign-in providers → Email/Password and Google
4. Create a **Firestore Database** in production mode
5. Go to Project Settings → Service Accounts → Generate new private key
6. Save as `backend/serviceAccountKey.json`
7. Go to Project Settings → General → Your apps → Add web app
8. Copy the Firebase config object for the frontend

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy and fill environment variables
cp .env.example .env
# Edit .env with your Firebase and Gmail credentials

# Run development server
python run.py
```

The API will be available at `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install

# Copy and fill environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase config

# Run development server
npm run dev
```

The app will be available at `http://localhost:5173`

### 4. Deployment to GCP

#### Deploy Backend to Cloud Run

```bash
cd backend

# Build and push Docker image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/blood-bank-api

# Deploy to Cloud Run
gcloud run deploy blood-bank-api \
  --image gcr.io/YOUR_PROJECT_ID/blood-bank-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="FLASK_ENV=production"
```

#### Deploy Frontend to Firebase Hosting

```bash
cd frontend
npm run build

firebase login
firebase init hosting  # Select your project, set build dir to 'dist'
firebase deploy --only hosting
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| GET | `/api/donors` | List all donors | Admin |
| POST | `/api/donors` | Register as donor | Donor |
| GET | `/api/donors/search` | Search donors | Admin, Hospital |
| GET | `/api/inventory` | List blood inventory | Admin |
| POST | `/api/inventory` | Add blood unit | Admin |
| GET | `/api/requests` | List blood requests | Admin, Hospital |
| POST | `/api/requests` | Submit blood request | Hospital |
| PATCH | `/api/requests/:id` | Update request status | Admin |
| GET | `/api/camps` | List camps | All |
| POST | `/api/camps` | Create camp | Admin |
| POST | `/api/camps/:id/register` | Register for camp | Donor |

## License

This project is developed as part of a Cloud Computing course capstone project.
