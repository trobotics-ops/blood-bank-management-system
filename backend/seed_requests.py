"""Seed script to add realistic hospital blood requests into Firestore."""

import random
from datetime import datetime, timedelta, timezone
import google.oauth2.credentials
from google.cloud import firestore
import subprocess

def get_token():
    cmd = [r'C:\Users\REYANCE\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd', 'auth', 'print-access-token']
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.stdout.strip()

token = get_token()
creds = google.oauth2.credentials.Credentials(token)
db = firestore.Client(project="project-ad83f799-f8d2-4553-9e0", credentials=creds)

now = datetime.now(timezone.utc)

BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

HOSPITAL_REQUESTS = [
    {
        "hospitalName": "AIIMS Hospital Bhubaneswar",
        "contactPerson": "Dr. Subhasish Dash",
        "contactPhone": "+91-674-247-6789",
        "bloodType": "O+",
        "unitsNeeded": 4,
        "urgencyLevel": "critical",
        "patientName": "Rajesh Mohanty",
        "patientAge": 42,
        "reason": "Emergency highway road accident — multiple fractures with internal hemorrhaging requiring immediate transfusion",
        "status": "pending",
    },
    {
        "hospitalName": "KIMS Super Speciality Hospital Bhubaneswar",
        "contactPerson": "Dr. Ananya Mishra",
        "contactPhone": "+91-674-272-5111",
        "bloodType": "B+",
        "unitsNeeded": 2,
        "urgencyLevel": "urgent",
        "patientName": "Sneha Pradhan",
        "patientAge": 28,
        "reason": "Emergency caesarean section with postpartum hemorrhage (PPH) management",
        "status": "pending",
    },
    {
        "hospitalName": "SCB Medical College & Hospital Cuttack",
        "contactPerson": "Dr. Debasis Mohapatra",
        "contactPhone": "+91-671-241-4080",
        "bloodType": "A-",
        "unitsNeeded": 3,
        "urgencyLevel": "critical",
        "patientName": "Alok Tripathy",
        "patientAge": 56,
        "reason": "Complex open-heart coronary artery bypass graft (CABG) surgery scheduled tomorrow morning",
        "status": "pending",
    },
    {
        "hospitalName": "Apollo Hospitals Mumbai",
        "contactPerson": "Dr. Priya Patel",
        "contactPhone": "+91-22-6280-6280",
        "bloodType": "AB+",
        "unitsNeeded": 2,
        "urgencyLevel": "normal",
        "patientName": "Vikram Mehta",
        "patientAge": 35,
        "reason": "Scheduled kidney transplant — pre-operative blood reserve requirement",
        "status": "approved",
        "approvedBy": "demo-admin-uid",
    },
    {
        "hospitalName": "AIIMS Hospital Bhubaneswar",
        "contactPerson": "Dr. Subhasish Dash",
        "contactPhone": "+91-674-247-6789",
        "bloodType": "O-",
        "unitsNeeded": 5,
        "urgencyLevel": "critical",
        "patientName": "Meera Behera",
        "patientAge": 8,
        "reason": "Thalassemia major — monthly blood transfusion protocol (pediatric hematology ward)",
        "status": "fulfilled",
        "approvedBy": "demo-admin-uid",
        "fulfilledAt": now - timedelta(hours=6),
    },
    {
        "hospitalName": "Fortis Escorts Heart Institute Delhi",
        "contactPerson": "Dr. Rajesh Verma",
        "contactPhone": "+91-11-4713-5000",
        "bloodType": "B-",
        "unitsNeeded": 3,
        "urgencyLevel": "urgent",
        "patientName": "Sanjay Gupta",
        "patientAge": 61,
        "reason": "Severe dengue with acute thrombocytopenia — platelet and whole blood requirement",
        "status": "pending",
    },
    {
        "hospitalName": "Manipal Hospital Bengaluru",
        "contactPerson": "Dr. Vikram Rao",
        "contactPhone": "+91-80-2502-4444",
        "bloodType": "A+",
        "unitsNeeded": 2,
        "urgencyLevel": "normal",
        "patientName": "Divya Nair",
        "patientAge": 45,
        "reason": "Oncology chemotherapy-induced pancytopenia — packed RBC transfusion needed",
        "status": "approved",
        "approvedBy": "demo-admin-uid",
    },
    {
        "hospitalName": "Tata Memorial Hospital Mumbai",
        "contactPerson": "Dr. Sneha Kulkarni",
        "contactPhone": "+91-22-2417-7000",
        "bloodType": "O+",
        "unitsNeeded": 1,
        "urgencyLevel": "normal",
        "patientName": "Pooja Sharma",
        "patientAge": 38,
        "reason": "Pre-surgical blood reserve for elective liver resection (hepatocellular carcinoma staging)",
        "status": "fulfilled",
        "approvedBy": "demo-admin-uid",
        "fulfilledAt": now - timedelta(days=1),
    },
    {
        "hospitalName": "KIMS Super Speciality Hospital Bhubaneswar",
        "contactPerson": "Dr. Ananya Mishra",
        "contactPhone": "+91-674-272-5111",
        "bloodType": "AB-",
        "unitsNeeded": 2,
        "urgencyLevel": "urgent",
        "patientName": "Arjun Das",
        "patientAge": 22,
        "reason": "Severe anemia following motorcycle accident with femur fracture — orthopedic emergency",
        "status": "pending",
    },
    {
        "hospitalName": "Christian Medical College (CMC) Vellore",
        "contactPerson": "Dr. Suresh Nair",
        "contactPhone": "+91-416-228-1000",
        "bloodType": "B+",
        "unitsNeeded": 4,
        "urgencyLevel": "critical",
        "patientName": "Kavita Reddy",
        "patientAge": 50,
        "reason": "Massive upper GI bleed (variceal) — ICU emergency requiring immediate packed RBC and FFP",
        "status": "pending",
    },
    {
        "hospitalName": "SCB Medical College & Hospital Cuttack",
        "contactPerson": "Dr. Debasis Mohapatra",
        "contactPhone": "+91-671-241-4080",
        "bloodType": "O+",
        "unitsNeeded": 3,
        "urgencyLevel": "urgent",
        "patientName": "Tanvi Nayak",
        "patientAge": 19,
        "reason": "Complicated obstetric delivery with antepartum hemorrhage — emergency blood preparation",
        "status": "approved",
        "approvedBy": "demo-admin-uid",
    },
    {
        "hospitalName": "AIIMS Hospital Bhubaneswar",
        "contactPerson": "Dr. Subhasish Dash",
        "contactPhone": "+91-674-247-6789",
        "bloodType": "A+",
        "unitsNeeded": 2,
        "urgencyLevel": "normal",
        "patientName": "Kunal Joshi",
        "patientAge": 30,
        "reason": "Elective splenectomy for hereditary spherocytosis — pre-surgical reserve",
        "status": "rejected",
        "rejectionReason": "Insufficient A+ stock currently available. Please resubmit after 48 hours or consider O+ compatible units.",
    },
]

print("--- Seeding Hospital Blood Requests ---")
count = 0

for i, req in enumerate(HOSPITAL_REQUESTS):
    doc = {
        "requestedBy": "demo-hospital-uid",
        "hospitalName": req["hospitalName"],
        "contactPerson": req["contactPerson"],
        "contactPhone": req["contactPhone"],
        "bloodType": req["bloodType"],
        "unitsNeeded": req["unitsNeeded"],
        "urgencyLevel": req["urgencyLevel"],
        "patientName": req["patientName"],
        "patientAge": req["patientAge"],
        "reason": req["reason"],
        "status": req["status"],
        "rejectionReason": req.get("rejectionReason"),
        "approvedBy": req.get("approvedBy"),
        "fulfilledAt": req.get("fulfilledAt"),
        "createdAt": now - timedelta(hours=random.randint(1, 72)),
        "updatedAt": now - timedelta(minutes=random.randint(5, 120)),
    }
    db.collection("bloodRequests").add(doc)
    db.collection("requests").add(doc)
    count += 1
    print(f"   [{count}] {req['status'].upper():10s} | {req['bloodType']:4s} x{req['unitsNeeded']} | {req['urgencyLevel']:8s} | {req['patientName']} @ {req['hospitalName']}")

print(f"\n✅ Successfully created {count} hospital blood requests in Firestore.")
