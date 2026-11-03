# Capstone Project Implementation Plan
## Project #12: Cloud-Based Blood Bank Management System

---

### 1. Project Overview & Cloud Stack
* **Objective:** Build and deploy a cloud-native web application to manage blood donor registration, real-time blood group inventory, automated expiry alerts, emergency hospital blood requests, and blood donation camp schedules.
* **Team Size:** 3 Members (Equal distribution across Development, Report Writing, and Video Presentation)
* **Total Cost:** $0.00 (Uses 100% Free-Tier Cloud Offerings)
* **Cloud Provider:** Google Cloud Platform (GCP) / Firebase
* **Cloud Services Used:**
  1. **Google Cloud Firestore:** NoSQL document database for real-time storage of `inventory`, `requests`, and `camps` collections.
  2. **Google Cloud IAM (Identity & Access Management):** Service account authentication and least-privilege access control.
  3. **Google Cloud Build & Artifact Registry:** Automated Docker container packaging in the cloud.
  4. **Google Cloud Run:** Serverless container compute service to host the web application on a public HTTPS URL.

---

### 2. Project File Structure
All three team members will collaborate in a single project folder / GitHub repository with the following file ownership:

```text
cloud-blood-bank/
├── cloud_db.py             # Owned by Member 1 (Cloud Database & IAM Connector)
├── serviceAccountKey.json  # Owned by Member 1 (GCP IAM Private Key)
├── blood_bank_logic.py     # Owned by Member 2 (Core Business Logic & Expiry Engine)
├── app.py                  # Owned by Member 3 (Streamlit UI & Plotly Charts)
├── requirements.txt        # Owned by Member 3 (Python Dependencies)
├── Dockerfile              # Owned by Member 3 (Cloud Container Configuration)
└── README.md               # Owned by Member 3 (Execution & Deployment Guide)
```

---

### 3. Member-Wise Detailed Implementation Plan

#### 👤 Member 1: Cloud Infrastructure, Database & Security Lead
**Primary Focus:** Setting up the Google Cloud Platform environment, configuring the NoSQL database, managing IAM security credentials, and writing the cloud data access layer.

##### A. Step-by-Step Technical Tasks
1. **Create Cloud Project:**
   * Go to the [Firebase / Google Cloud Console](https://console.firebase.google.com/) and create a new project named `cloud-blood-bank-system`.
2. **Provision Cloud Firestore Database:**
   * Navigate to **Build -> Firestore Database -> Create Database**.
   * Select a nearby region (e.g., `asia-south1` Mumbai) and start in **Test Mode** (or configure security rules).
   * Create three root collections: `inventory`, `requests`, and `camps`.
3. **Configure IAM Security & Service Account:**
   * Navigate to **Project Settings -> Service Accounts**.
   * Click **Generate New Private Key** to download the JSON credentials file.
   * Rename the downloaded file to `serviceAccountKey.json` and place it in the project root directory.
4. **Develop `cloud_db.py`:**
   * Implement `fetch_collection(collection_name)` to stream live documents from Firestore.
   * Implement `insert_record(collection_name, record_id, data)` to write new donors, requests, and camps to the cloud.
   * Implement `update_request_status(req_id, new_status)` to update hospital blood request statuses in Firestore.
   * Maintain the local JSON fallback (`mock_cloud_db.json`) so teammates can test offline if needed.

##### B. Assigned Project Report Sections (Approx. 3 Pages)
* **Section 1: Problem Statement & Objectives:** Explain challenges in traditional blood banks (manual tracking, blood unit wastage due to unmonitored expiry dates, delayed emergency communication) and how cloud computing solves them.
* **Section 2: System Architecture:** Create and insert a clean architecture diagram (using Draw.io) illustrating: *User Browser -> Google Cloud Run (Streamlit Container) -> Business Logic Layer -> Google Cloud IAM -> Google Cloud Firestore*.
* **Section 3: Cloud Services Used:** Detail the technical role of GCP Cloud Firestore, Cloud Run, and IAM Service Accounts.

##### C. 10-Minute Video Presentation Script (Minutes 0:00 – 3:20)
* **0:00 – 1:00:** Introduce the team, problem statement, and project objectives.
* **1:00 – 2:15:** Screen-share the System Architecture Diagram and explain how data flows across Google Cloud services.
* **2:15 – 3:20:** Screen-share the live **Google Cloud / Firebase Console**, showing the live Firestore collections (`inventory`, `requests`, `camps`), IAM Service Account permissions, and `cloud_db.py` code.

---

#### 👤 Member 2: Backend Logic, Analytics & Expiry Engine Lead
**Primary Focus:** Developing the core Python backend algorithms for blood group aggregation, automated expiry date calculation, 7-day expiry alert filtering, and data validation.

##### A. Step-by-Step Technical Tasks
1. **Develop Inventory Aggregation (`get_inventory_summary` in `blood_bank_logic.py`):**
   * Fetch raw blood bag records via Member 1's `cloud_db.fetch_collection("inventory")`.
   * Filter out any expired blood bags where `expiry_date < today`.
   * Aggregate total available units across all 8 standard blood groups (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`) and return both a summary dictionary and a Pandas DataFrame.
2. **Build Automated Expiry Alert Engine (`get_expiry_alerts`):**
   * Compare each blood bag's `expiry_date` against the current date and a 7-day warning threshold.
   * Flag bags into two alert categories: `"EXPIRED"` (past expiry date) and `"Expiring in X days"` (within 7 days) so hospital staff can prioritize dispatching older stock first (FIFO - First In, First Out).
3. **Implement Donor Registration & Shelf-Life Calculator (`register_donor_and_bag`):**
   * Generate a unique timestamped ID (`BLD-XXXX`), record the collection date, automatically calculate the expiration date (default 35-day shelf life for packed red blood cells), and push the record to Firestore.
4. **Implement Emergency Request & Camp Workflows (`create_blood_request` & `schedule_camp`):**
   * Format and validate incoming hospital requests (`REQ-XXXX`) and blood donation camp schedules (`CMP-XXXX`) before sending them to `cloud_db.py`.

##### B. Assigned Project Report Sections (Approx. 3 Pages)
* **Section 4: Core System Implementation:** Document the backend module structure, data schemas for each collection (JSON structure of `inventory`, `requests`, and `camps`), and the interaction between `blood_bank_logic.py` and `cloud_db.py`.
* **Section 5: Algorithms & Data Processing:** Explain the automated shelf-life computation algorithm, the 7-day expiry alert filtering pipeline using `pandas` and `datetime`, and how non-expired stock is dynamically calculated.

##### C. 10-Minute Video Presentation Script (Minutes 3:20 – 6:40)
* **3:20 – 4:30:** Screen-share the IDE (`blood_bank_logic.py`) and explain how the backend connects to Member 1's `cloud_db.py` module.
* **4:30 – 5:45:** Walk through the `get_inventory_summary()` and `get_expiry_alerts()` functions, explaining how expired bags are automatically excluded from live counts and flagged for urgent use.
* **5:45 – 6:40:** Explain the data schemas and validation functions for donor registration, hospital blood requests, and camp scheduling.

---

#### 👤 Member 3: Frontend UI, Containerization & Cloud Deployment Lead
**Primary Focus:** Designing the interactive web dashboard, integrating real-time visual charts, containerizing the application with Docker, and deploying it to a public URL on Google Cloud Run.

##### A. Step-by-Step Technical Tasks
1. **Build the Multi-Tab Dashboard (`app.py`):**
   * **Tab 1 (Live Inventory & Expiry Alerts):** Render 8 KPI metric cards showing unit counts and `"Low"` vs `"Optimal"` stock badges, a Plotly bar chart of blood group distribution, and the live 7-day expiry warning table.
   * **Tab 2 (Register Donor & Stock):** Build an interactive form for donor name, blood group dropdown, units donated, and shelf-life slider.
   * **Tab 3 (Hospital Blood Requests):** Build a 2-column layout with an emergency request submission form on the left and expandable approval cards (`Approve & Dispatch` button) on the right.
   * **Tab 4 (Blood Donation Camps):** Build a camp scheduling form and an upcoming camps directory table.
2. **Create Container & Dependency Files:**
   * Write `requirements.txt` (`streamlit`, `pandas`, `plotly`, `firebase-admin`).
   * Write `Dockerfile` using `python:3.11-slim`, exposing port `8080` as required by Google Cloud Run.
   * Write `README.md` with clear setup, local execution, and cloud deployment commands.
3. **Deploy to Google Cloud Run:**
   * Authenticate with Google Cloud CLI (`gcloud auth login` and `gcloud config set project [PROJECT_ID]`).
   * Execute the serverless deployment command:
     ```bash
     gcloud run deploy blood-bank-system --source . --region asia-south1 --allow-unauthenticated
     ```
   * Verify the generated public HTTPS URL works on any desktop or mobile browser.

##### B. Assigned Project Report Sections (Approx. 3 Pages)
* **Section 6: Cloud Deployment & Containerization:** Explain the `Dockerfile` configuration, serverless execution on Google Cloud Run, auto-scaling behavior, and execution instructions.
* **Section 7: Results & UI Screenshots:** Capture and annotate high-resolution screenshots of all four dashboard tabs running on the live `.run.app` cloud URL, plus a screenshot of the Google Cloud Run metrics dashboard.
* **Section 8: Conclusion & Future Scope:** Summarize project achievements and mention future enhancements (e.g., automated SMS alerts via Cloud Functions). Compile and format the final PDF report.

##### C. 10-Minute Video Presentation Script (Minutes 6:40 – 10:00)
* **6:40 – 7:30:** Show the `Dockerfile`, `requirements.txt`, and the Google Cloud Run dashboard (highlighting container logs and the public HTTPS URL).
* **7:30 – 9:30:** Perform a **Live End-to-End Demo** on the public cloud URL:
  1. Show the live inventory metrics, Plotly chart, and expiry alert table.
  2. Register a new blood donor in Tab 2 and show the KPI metric and Firestore database updating immediately.
  3. Submit an emergency hospital request in Tab 3 and click **Approve & Dispatch**.
  4. Schedule a new blood donation camp in Tab 4.
* **9:30 – 10:00:** Summarize key cloud benefits achieved (scalability, high availability, $0 serverless cost) and conclude the presentation.

---

### 4. Step-by-Step 3-Day Execution Schedule

| Timeline | Member 1 (Cloud & DB) | Member 2 (Backend Logic) | Member 3 (UI & Deployment) |
| :--- | :--- | :--- | :--- |
| **Day 1: Setup & Core Coding** | Create GCP project, enable Firestore, generate `serviceAccountKey.json`, and test `cloud_db.py`. | Write and test `blood_bank_logic.py` using the local JSON simulator mode. | Build `app.py`, `Dockerfile`, and `requirements.txt`; test full UI locally via `streamlit run app.py`. |
| **Day 2: Cloud Integration & Deployment** | Push `serviceAccountKey.json` and `cloud_db.py` to team folder; verify live records appear in Firestore console. | Verify all 4 features (inventory, alerts, requests, camps) work seamlessly with live Firestore data. | Deploy the integrated folder to **Google Cloud Run** and share the live `.run.app` URL with the team. |
| **Day 3: Report & 10-Min Video** | Draft Report Sections 1–3, draw architecture diagram, and record Video Part 1 (0:00–3:20). | Draft Report Sections 4–5 and record Video Part 2 (3:20–6:40). | Draft Report Sections 6–8, capture live cloud screenshots, record Video Part 3 (6:40–10:00), and merge final files. |

---

### 5. Pre-Submission Checklist (Per Course Guidelines)
- [ ] **Complete Source Code ZIP:** Contains `app.py`, `blood_bank_logic.py`, `cloud_db.py`, `requirements.txt`, `Dockerfile`, and `README.md`.
- [ ] **Public Cloud Deployment:** Live Google Cloud Run URL included on the cover page of the report and demonstrated in the video.
- [ ] **Detailed Project Report (PDF):** Contains Problem Statement, Objectives, System Architecture Diagram, Cloud Services Used, Implementation, Results Screenshots, and Conclusion.
- [ ] **10-Minute Video Demonstration:** All 3 members speak and present their respective architecture, code implementation, and live functionality segments (~3.3 minutes each).