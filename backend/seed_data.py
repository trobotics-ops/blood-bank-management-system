"""Seed script to populate Firestore database with realistic demo data."""

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

BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
COMPONENTS = ["whole_blood", "rbc", "plasma", "platelets"]
CITIES = ["New York", "Chicago", "Houston", "San Francisco", "Seattle", "Boston", "Austin", "Denver"]
HOSPITALS = [
    ("City General Hospital", "Dr. Sarah Jenkins", "+1-212-555-0144"),
    ("St. Jude Medical Center", "Dr. Robert Vance", "+1-312-555-0189"),
    ("Metropolitan Health", "Nurse Karen White", "+1-713-555-0122"),
    ("Valley Presbyterian", "Dr. Marcus Cole", "+1-415-555-0167"),
    ("Memorial Sloan Center", "Dr. Emily Zhang", "+1-617-555-0195"),
]

FIRST_NAMES = ["James", "Emma", "Liam", "Olivia", "Noah", "Ava", "Lucas", "Sophia", "Ethan", "Isabella", "Mason", "Mia", "Oliver", "Amelia", "Elijah", "Harper"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson"]

now = datetime.now(timezone.utc)

print("--- Seeding Database ---")

# 1. Seed Users
print("1. Seeding Users...")
users_data = [
    {"uid": "demo-admin-uid", "email": "admin@bloodbank.org", "displayName": "System Administrator", "role": "admin", "phone": "+1-800-555-0100", "organizationName": "National Red Cross"},
    {"uid": "demo-hospital-uid", "email": "hospital@citygeneral.org", "displayName": "City General Staff", "role": "hospital", "phone": "+1-212-555-0144", "organizationName": "City General Hospital"},
    {"uid": "demo-donor-uid", "email": "donor@example.com", "displayName": "Alex Morgan", "role": "donor", "phone": "+1-555-0199", "organizationName": ""},
    {"uid": "user-hosp-2", "email": "stjude@healthcare.org", "displayName": "Dr. Robert Vance", "role": "hospital", "phone": "+1-312-555-0189", "organizationName": "St. Jude Medical Center"},
    {"uid": "user-hosp-3", "email": "metro@carehospital.org", "displayName": "Nurse Karen White", "role": "hospital", "phone": "+1-713-555-0122", "organizationName": "Metropolitan Health"},
]

for u in users_data:
    uid = u.pop("uid")
    u["createdAt"] = now
    u["updatedAt"] = now
    db.collection("users").document(uid).set(u)
print(f"   Created {len(users_data)} users.")

# 2. Seed Donors
print("2. Seeding Donors...")
donors_ids = []
for i in range(16):
    fname = random.choice(FIRST_NAMES)
    lname = random.choice(LAST_NAMES)
    name = f"{fname} {lname}"
    blood_type = BLOOD_TYPES[i % len(BLOOD_TYPES)]
    city = CITIES[i % len(CITIES)]
    last_don = (now - timedelta(days=random.randint(20, 180))).strftime("%Y-%m-%d")
    is_eligible = random.choice([True, True, True, False])
    
    donor_doc = {
        "name": name,
        "email": f"{fname.lower()}.{lname.lower()}{random.randint(10,99)}@email.com",
        "phone": f"+1-555-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
        "bloodType": blood_type,
        "dateOfBirth": f"{random.randint(1975, 2003)}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}",
        "gender": random.choice(["male", "female"]),
        "address": f"{random.randint(100, 9999)} Maple Avenue, Suite {random.randint(1, 50)}",
        "city": city,
        "state": "NY",
        "medicalHistory": "No chronic conditions. Fit for donation." if is_eligible else "Mild anemia reported. Temporarily deferred.",
        "lastDonationDate": last_don,
        "isEligible": is_eligible,
        "totalDonations": random.randint(1, 12),
        "createdAt": now - timedelta(days=random.randint(30, 365)),
        "updatedAt": now,
    }
    doc_ref = db.collection("donors").add(donor_doc)[1]
    donors_ids.append((doc_ref.id, blood_type))
print(f"   Created {len(donors_ids)} donors.")

# 3. Seed Inventory
print("3. Seeding Inventory...")
inventory_count = 0
for bt in BLOOD_TYPES:
    # 3-4 entries per blood type
    for comp in random.sample(COMPONENTS, k=random.randint(2, 4)):
        days_offset = random.randint(-5, 40) # some expired/expiring soon, some fresh
        collection_dt = now - timedelta(days=random.randint(5, 30))
        expiry_dt = collection_dt + timedelta(days=35 + days_offset)
        
        status = "available"
        if expiry_dt < now:
            status = "expired"
        elif random.random() < 0.2:
            status = "reserved"

        inv_doc = {
            "bloodType": bt,
            "units": random.randint(3, 18),
            "component": comp,
            "collectionDate": collection_dt.strftime("%Y-%m-%d"),
            "expiryDate": expiry_dt.strftime("%Y-%m-%d"),
            "donorId": random.choice(donors_ids)[0] if donors_ids else None,
            "status": status,
            "notes": f"Batch #{random.randint(1000, 9999)} tested negative for all standard screening pathogens.",
            "addedBy": "demo-admin-uid",
            "createdAt": collection_dt,
            "updatedAt": now,
        }
        db.collection("bloodInventory").add(inv_doc)
        db.collection("inventory").add(inv_doc)
        inventory_count += 1
print(f"   Created {inventory_count} inventory unit batches.")

# 4. Seed Requests
print("4. Seeding Blood Requests...")
requests_count = 0
statuses = ["pending", "approved", "fulfilled", "rejected"]
urgencies = ["normal", "urgent", "critical"]

for i in range(12):
    hosp, contact, phone = random.choice(HOSPITALS)
    bt = random.choice(BLOOD_TYPES)
    urgency = random.choice(urgencies)
    stat = random.choice(statuses)
    patient = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
    
    req_doc = {
        "requestedBy": "demo-hospital-uid",
        "hospitalName": hosp,
        "contactPerson": contact,
        "contactPhone": phone,
        "bloodType": bt,
        "unitsNeeded": random.randint(1, 6),
        "urgencyLevel": urgency,
        "patientName": patient,
        "patientAge": random.randint(18, 75),
        "reason": random.choice([
            "Emergency trauma surgery requirement",
            "Cardiovascular bypass procedure",
            "Severe postpartum hemorrhage management",
            "Oncology chemotherapy support",
            "Orthopedic reconstruction surgery",
        ]),
        "status": stat,
        "rejectionReason": "Insufficient compatible units available in inventory" if stat == "rejected" else None,
        "approvedBy": "demo-admin-uid" if stat in ["approved", "fulfilled"] else None,
        "fulfilledAt": (now - timedelta(hours=random.randint(1, 48))) if stat == "fulfilled" else None,
        "createdAt": now - timedelta(days=random.randint(0, 14)),
        "updatedAt": now,
    }
    db.collection("bloodRequests").add(req_doc)
    db.collection("requests").add(req_doc)
    requests_count += 1
print(f"   Created {requests_count} blood requests.")

# 5. Seed Camps
print("5. Seeding Donation Camps...")
camp_templates = [
    ("Metropolitan University Spring Blood Drive", "Campus Center Hall A", "450 University Way", "New York", 7, "10:00", "16:00", "Red Cross Youth Chapter", 120, "Annual campus-wide drive open to students and faculty."),
    ("Tech Park Corporate LifeSavers Camp", "Innovation Auditorium", "100 Silicon Blvd", "San Francisco", 14, "09:00", "15:00", "Bay Area Tech Coalition", 80, "Corporate drive with donor refreshments and health screenings."),
    ("Downtown Community Health & Blood Fair", "Civic Center Plaza", "200 Main Street", "Chicago", -2, "08:30", "14:30", "City Health Department", 150, "Full community health fair and mobile donor unit."),
    ("Memorial Hospital Emergency Donor Rally", "East Wing Conference Room", "75 Hospital Lane", "Boston", 21, "11:00", "17:00", "Memorial Volunteer Guild", 60, "Targeted drive to replenish rare O-negative and B-negative units."),
    ("Suburban Civic Club Blood Drive", "St. Andrews Fellowship Hall", "88 Highland Road", "Seattle", -15, "09:00", "13:00", "Rotary Club of Seattle", 50, "Completed drive with high participation."),
    ("Summer Solstice Community Donation Drive", "Riverside Park Pavilion", "500 Waterfront Ave", "Austin", 30, "10:00", "16:00", "Community Life Care", 100, "Outdoor summer blood collection camp."),
]

for name, venue, addr, city, days_off, st, et, org, cap, desc in camp_templates:
    camp_date = (now + timedelta(days=days_off)).strftime("%Y-%m-%d")
    status = "upcoming"
    units_col = 0
    if days_off < -5:
        status = "completed"
        units_col = random.randint(35, cap)
    elif days_off <= 0:
        status = "ongoing"
        units_col = random.randint(10, 40)
        
    camp_doc = {
        "name": name,
        "venue": venue,
        "address": addr,
        "city": city,
        "date": camp_date,
        "startTime": st,
        "endTime": et,
        "organizer": org,
        "capacity": cap,
        "description": desc,
        "registeredDonors": [d[0] for d in random.sample(donors_ids, k=min(len(donors_ids), random.randint(4, 10)))],
        "status": status,
        "unitsCollected": units_col,
        "createdBy": "demo-admin-uid",
        "createdAt": now - timedelta(days=20),
        "updatedAt": now,
    }
    db.collection("camps").add(camp_doc)
print(f"   Created {len(camp_templates)} donation camps.")

# 6. Seed Notifications
print("6. Seeding Notifications...")
notif_data = [
    ("low_stock", "CRITICAL: O- Negative Supply Low", "Only 2 units of O- whole blood remaining in central bank. Please schedule emergency collection.", "demo-admin-uid"),
    ("expiry_alert", "Expiring Blood Units Warning", "5 units of A+ platelets are expiring within 48 hours. Review distribution to affiliated hospitals.", "demo-admin-uid"),
    ("request_update", "Urgent Request Approved", "Request #BR-4029 for 3 units of B+ blood for St. Jude Medical Center has been approved.", "demo-hospital-uid"),
    ("request_update", "Request Fulfilled", "City General Hospital blood request for trauma surgery was successfully fulfilled.", "demo-hospital-uid"),
    ("camp_reminder", "Donation Drive Tomorrow", "Reminder: You are registered for the Metropolitan University Spring Blood Drive tomorrow at 10:00 AM.", "demo-donor-uid"),
    ("general", "Thank You For Your Donation!", "Your recent donation helped save up to 3 lives. Check your donor dashboard for your latest eligibility date.", "demo-donor-uid"),
    ("low_stock", "Platelets Restock Needed", "Platelets inventory is approaching lower safety threshold (< 5 units).", "demo-admin-uid"),
    ("camp_reminder", "Volunteer Registration Confirmed", "Your registration for Tech Park Corporate LifeSavers Camp is confirmed.", "demo-donor-uid"),
]

for ntype, title, msg, recipient in notif_data:
    notif_doc = {
        "recipientUid": recipient,
        "type": ntype,
        "title": title,
        "message": msg,
        "isRead": random.choice([True, False, False]),
        "relatedEntityType": None,
        "relatedEntityId": None,
        "createdAt": now - timedelta(hours=random.randint(1, 72)),
    }
    db.collection("notifications").add(notif_doc)
print(f"   Created {len(notif_data)} notifications.")

print("\n--- DATABASE SEEDING COMPLETED SUCCESSFULLY! ---")
