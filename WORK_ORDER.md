# 🩸 Cloud Blood Bank — Remaining Work Order

> **Last Updated:** 2026-11-03  
> **Overall Completion:** ~60% → Target: 100%

Use this file to resume work if a session runs out. Check off items as completed.

---

## Priority 1 — 🔴 CRITICAL: Create 8 Missing Frontend Pages

The app **will not compile** until all 8 pages exist. `App.jsx` imports them.

| # | Task | File to Create | Status |
|---|------|---------------|--------|
| 1.1 | Create Blood Stock Summary Page | `frontend/src/pages/inventory/BloodStockPage.jsx` | ⬜ |
| 1.2 | Create Expiring Units Page | `frontend/src/pages/inventory/ExpiringUnitsPage.jsx` | ⬜ |
| 1.3 | Create Request List Page | `frontend/src/pages/requests/RequestListPage.jsx` | ⬜ |
| 1.4 | Create New Request Page | `frontend/src/pages/requests/NewRequestPage.jsx` | ⬜ |
| 1.5 | Create Camp List Page | `frontend/src/pages/camps/CampListPage.jsx` | ⬜ |
| 1.6 | Create Camp Creation Page | `frontend/src/pages/camps/CreateCampPage.jsx` | ⬜ |
| 1.7 | Create My Camps Page (donor view) | `frontend/src/pages/camps/MyCampsPage.jsx` | ⬜ |
| 1.8 | Create Notifications Page | `frontend/src/pages/notifications/NotificationsPage.jsx` | ⬜ |

**Style Guide:** Match existing pages — use `animate-fade-in`, shadcn/ui components (`Card`, `Badge`, `Button`, `Table`, `Select`, `Input`), lucide-react icons, `react-hot-toast`, common components (`LoadingSpinner`, `EmptyState`, `StatsCard`, `BloodTypeSelector`), and helpers from `lib/utils.js` (`formatDate`, `getStatusColor`, `getUrgencyColor`, `getStockColor`, `BLOOD_TYPES`, `URGENCY_LEVELS`, etc.).

---

## Priority 2 — 🟡 Fix Frontend ↔ Backend Endpoint Mismatches

The frontend service files call endpoints that don't exist or have different paths on the backend.

| # | Task | File(s) to Fix | Details | Status |
|---|------|---------------|---------|--------|
| 2.1 | Fix registration endpoint | `frontend/src/services/authService.js` | Calls `/api/users/register` → backend has `/api/auth/register` | ⬜ |
| 2.2 | Fix donor profile endpoint | `frontend/src/services/donorService.js` | Calls `/api/donors/profile` → backend has `/api/donors/me` | ⬜ |
| 2.3 | Fix donor profile update endpoint | `frontend/src/services/donorService.js` | Calls `PUT /api/donors/profile` → backend has `PUT /api/donors/<id>` | ⬜ |
| 2.4 | Fix inventory stock endpoint | `frontend/src/services/inventoryService.js` | Calls `/api/inventory/stock` → backend has `/api/inventory/summary` | ⬜ |
| 2.5 | Add missing backend routes for donor stats/history | `backend/app/routes/donors.py` | Frontend calls `/api/donors/history`, `/api/donors/stats` — no backend routes | ⬜ |
| 2.6 | Add missing backend routes for request my/stats | `backend/app/routes/requests.py` | Frontend calls `/api/requests/my`, `/api/requests/stats` — no backend routes | ⬜ |
| 2.7 | Add missing backend routes for camps my/registrations | `backend/app/routes/camps.py` | Frontend calls `/api/camps/my`, `/api/camps/<id>/registrations` — no backend routes | ⬜ |
| 2.8 | Add missing backend route for notification read-all | `backend/app/routes/notifications.py` | Frontend calls `PUT /api/notifications/read-all` — no backend route | ⬜ |
| 2.9 | Add missing backend route for inventory stats | `backend/app/routes/inventory.py` | Frontend calls `/api/inventory/stats` — no backend route | ⬜ |
| 2.10 | Fix camp unregister HTTP method | `frontend/src/services/campService.js` | Uses `DELETE /api/camps/<id>/register` → backend has `POST /api/camps/<id>/unregister` | ⬜ |
| 2.11 | Fix notification mark-read HTTP method | `frontend/src/services/notificationService.js` | Uses `PUT` → backend has `PATCH` for mark-read | ⬜ |

---

## Priority 3 — 🟡 Wire Backend Auto-Triggers

| # | Task | File(s) to Modify | Details | Status |
|---|------|-------------------|---------|--------|
| 3.1 | Wire blood compatibility into request approval | `backend/app/services/request_service.py` | Import and use `blood_compatibility.py` when approving requests to auto-match inventory | ⬜ |
| 3.2 | Add a /check-expiry cron-friendly endpoint | `backend/app/routes/inventory.py` | Endpoint that marks expired units and creates notifications for units expiring in ≤7 days | ⬜ |
| 3.3 | Wire low-stock alert generation | `backend/app/services/inventory_service.py` | After stock changes, check if any blood type < 5 units and create admin notification | ⬜ |
| 3.4 | Wire camp reminder notifications | `backend/app/services/camp_service.py` | When camp is 1 day away, create notification for registered donors | ⬜ |
| 3.5 | Add notification on request status change | `backend/app/services/request_service.py` | Notify hospital user when request is approved/rejected/fulfilled | ⬜ |

---

## Priority 4 — 🟢 Deployment Configuration

| # | Task | File(s) to Create/Modify | Details | Status |
|---|------|--------------------------|---------|--------|
| 4.1 | Create `firebase.json` | `firebase.json` | Firebase Hosting config for React SPA (rewrites to index.html) | ⬜ |
| 4.2 | Create `.firebaserc` | `.firebaserc` | Firebase project alias | ⬜ |
| 4.3 | Review/update `backend/Dockerfile` | `backend/Dockerfile` | Ensure production-ready with gunicorn | ⬜ |
| 4.4 | Create `cloudbuild.yaml` | `cloudbuild.yaml` | CI/CD for Cloud Build → Cloud Run | ⬜ |
| 4.5 | Create backend `.env` from `.env.example` guidance | Update README | Document env var setup | ⬜ |

---

## Priority 5 — 🟢 Documentation & Project Report

| # | Task | File(s) to Create | Details | Status |
|---|------|-------------------|---------|--------|
| 5.1 | Create project report | `docs/project-report.md` | Full report: problem statement, objectives, architecture, cloud services, implementation, results, conclusion | ⬜ |
| 5.2 | Create architecture diagram | `docs/architecture-diagram.md` | System architecture diagram (Mermaid) | ⬜ |
| 5.3 | Update README with setup instructions | `README.md` | Add complete setup, dev, and deployment instructions | ⬜ |

---

## Quick Reference — Key Backend Endpoints (actual)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Auth | Register user in Firestore |
| GET | `/api/users/me` | Auth | Get current user profile |
| PUT | `/api/users/me` | Auth | Update current user |
| GET | `/api/users` | Admin | List all users |
| GET | `/api/donors/me` | Auth | Get my donor profile |
| POST | `/api/donors` | Donor | Register as donor |
| PUT | `/api/donors/<id>` | Owner/Admin | Update donor |
| GET | `/api/donors` | Admin | List all donors |
| GET | `/api/donors/search` | Admin/Hospital | Search donors |
| GET | `/api/donors/<id>` | Auth | Get donor by ID |
| GET | `/api/inventory` | Auth | List blood units |
| POST | `/api/inventory` | Admin | Add blood unit |
| GET | `/api/inventory/summary` | Auth | Blood stock summary |
| GET | `/api/inventory/expiring` | Admin | Expiring units |
| GET | `/api/inventory/<id>` | Auth | Get blood unit |
| PUT | `/api/inventory/<id>` | Admin | Update blood unit |
| DELETE | `/api/inventory/<id>` | Admin | Delete blood unit |
| GET | `/api/requests` | Auth | List requests (admin=all, hospital=own) |
| POST | `/api/requests` | Hospital | Create blood request |
| GET | `/api/requests/<id>` | Auth | Get request |
| PATCH | `/api/requests/<id>/approve` | Admin | Approve request |
| PATCH | `/api/requests/<id>/reject` | Admin | Reject request |
| PATCH | `/api/requests/<id>/fulfill` | Admin | Fulfill request |
| GET | `/api/camps` | Auth | List camps |
| POST | `/api/camps` | Admin | Create camp |
| GET | `/api/camps/<id>` | Auth | Get camp |
| PUT | `/api/camps/<id>` | Admin | Update camp |
| POST | `/api/camps/<id>/register` | Donor | Register for camp |
| POST | `/api/camps/<id>/unregister` | Donor | Unregister from camp |
| PATCH | `/api/camps/<id>/complete` | Admin | Complete camp |
| GET | `/api/notifications` | Auth | Get notifications |
| GET | `/api/notifications/unread-count` | Auth | Get unread count |
| PATCH | `/api/notifications/<id>/read` | Auth | Mark notification read |

---

## Notes for Continuation

- **Frontend framework:** React + Vite + Tailwind CSS + shadcn/ui + lucide-react icons
- **Backend framework:** Python Flask + Marshmallow + Firebase Admin SDK + Firestore
- **Toast notifications:** `react-hot-toast` (`import toast from 'react-hot-toast'`)
- **Auth context:** `useAuth()` hook returns `{ user, userProfile, loading, login, register, loginWithGoogle, logout }`
- **User role field:** `userProfile.role` — one of `admin`, `hospital`, `donor`
- **API client:** `frontend/src/services/api.js` — exports `apiGet`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete`
- **Date utils:** `date-fns` via `lib/utils.js` — `formatDate`, `formatDateTime`, `formatRelativeTime`, `daysUntil`
