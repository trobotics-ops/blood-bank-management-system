"""Seed script to populate Firestore database with realistic Indian demo data."""

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

INDIAN_LOCATIONS = [
    ("Bhubaneswar", "Odisha", "Plot 42, Saheed Nagar"),
    ("Bhubaneswar", "Odisha", "Near Infocity, Patia"),
    ("Cuttack", "Odisha", "Badambadi Colony"),
    ("Mumbai", "Maharashtra", "Bandra Kurla Complex, Bandra East"),
    ("Mumbai", "Maharashtra", "Andheri West, Link Road"),
    ("Pune", "Maharashtra", "FC Road, Shivajinagar"),
    ("New Delhi", "Delhi", "Connaught Place, Inner Circle"),
    ("New Delhi", "Delhi", "Sector 14, Dwarka"),
    ("Bengaluru", "Karnataka", "12th Main, Indiranagar"),
    ("Bengaluru", "Karnataka", "5th Block, Koramangala"),
    ("Hyderabad", "Telangana", "HITEC City, Madhapur"),
    ("Kolkata", "West Bengal", "Salt Lake Sector V"),
    ("Chennai", "Tamil Nadu", "Anna Nagar West"),
    ("Ahmedabad", "Gujarat", "SG Highway, Bodakdev"),
]

INDIAN_HOSPITALS = [
    ("AIIMS Hospital Bhubaneswar", "Dr. Subhasish Dash", "+91-674-247-6789"),
    ("Apollo Hospitals Mumbai", "Dr. Priya Patel", "+91-22-6280-6280"),
    ("Fortis Escorts Heart Institute Delhi", "Dr. Rajesh Verma", "+91-11-4713-5000"),
    ("KIMS Super Speciality Hospital Bhubaneswar", "Dr. Ananya Mishra", "+91-674-272-5111"),
    ("Manipal Hospital Bengaluru", "Dr. Vikram Rao", "+91-80-2502-4444"),
    ("SCB Medical College & Hospital Cuttack", "Dr. Debasis Mohapatra", "+91-671-241-4080"),
    ("Tata Memorial Hospital Mumbai", "Dr. Sneha Kulkarni", "+91-22-2417-7000"),
    ("Christian Medical College (CMC) Vellore", "Dr. Suresh Nair", "+91-416-228-1000"),
]

FIRST_NAMES = [
    "Aarav", "Priya", "Rahul", "Sneha", "Rohan", "Ananya", "Aditya", "Tanvi", 
    "Vikram", "Neha", "Arjun", "Divya", "Ayush", "Pooja", "Siddharth", "Meera", 
    "Kunal", "Riya", "Alok", "Shreya", "Rajesh", "Kavita", "Sanjay", "Deepika"
]
LAST_NAMES = [
    "Sharma", "Patel", "Verma", "Reddy", "Nair", "Gupta", "Das", "Behera", 
    "Mishra", "Singh", "Chatterjee", "Joshi", "Kulkarni", "Sen", "Rao", "Mehta",
    "Mohanty", "Pradhan", "Tripathy", "Nayak"
]

now = datetime.now(timezone.utc)

def clear_collection(col_name):
    print(f"Clearing collection '{col_name}'...")
    docs = db.collection(col_name).limit(500).stream()
    count = 0
    for doc in docs:
        doc.reference.delete()
        count += 1
    print(f"   Deleted {count} documents from '{col_name}'.")

print("--- Starting Clean & Seed with Indian Data ---")

for col in ["users", "donors", "inventory", "bloodInventory", "requests", "bloodRequests", "camps", "notifications"]:
    clear_collection(col)

# 1. Seed Users
print("\n1. Seeding Users...")
users_data = [
    {"uid": "demo-admin-uid", "email": "admin@bloodbank.org.in", "displayName": "Indian Red Cross Society Admin", "role": "admin", "phone": "+91-11-2371-6441", "organizationName": "Indian Red Cross Society (IRCS)"},
    {"uid": "demo-hospital-uid", "email": "aiims.bbsr@healthcare.gov.in", "displayName": "AIIMS Bhubaneswar Staff", "role": "hospital", "phone": "+91-674-247-6789", "organizationName": "AIIMS Hospital Bhubaneswar"},
    {"uid": "demo-donor-uid", "email": "aarav.sharma@example.com", "displayName": "Aarav Sharma", "role": "donor", "phone": "+91-98765-43210", "organizationName": ""},
    {"uid": "user-hosp-apollo", "email": "bloodbank@apollohospitals.com", "displayName": "Apollo Mumbai Blood Bank", "role": "hospital", "phone": "+91-22-6280-6280", "organizationName": "Apollo Hospitals Mumbai"},
    {"uid": "user-hosp-kims", "email": "kims.bloodbank@kims.ac.in", "displayName": "KIMS Transfusion Medicine", "role": "hospital", "phone": "+91-674-272-5111", "organizationName": "KIMS Super Speciality Hospital Bhubaneswar"},
    {"uid": "user-hosp-fortis", "email": "delhi.bloodbank@fortishealthcare.com", "displayName": "Fortis Delhi Emergency Blood Bank", "role": "hospital", "phone": "+91-11-4713-5000", "organizationName": "Fortis Escorts Heart Institute Delhi"},
]

for u in users_data:
    uid = u.pop("uid")
    u["createdAt"] = now
    u["updatedAt"] = now
    db.collection("users").document(uid).set(u)
print(f"   Created {len(users_data)} Indian users.")

# 2. Seed Donors
print("2. Seeding Donors...")
donors_ids = []
for i in range(24):
    fname = random.choice(FIRST_NAMES)
    lname = random.choice(LAST_NAMES)
    name = f"{fname} {lname}"
    blood_type = BLOOD_TYPES[i % len(BLOOD_TYPES)]
    city, state, addr_street = random.choice(INDIAN_LOCATIONS)
    last_don = (now - timedelta(days=random.randint(20, 180))).strftime("%Y-%m-%d")
    is_eligible = random.choice([True, True, True, False])
    phone_prefix = random.choice(["98", "97", "94", "89", "70", "91"])
    
    donor_doc = {
        "name": name,
        "email": f"{fname.lower()}.{lname.lower()}{random.randint(10,99)}@gmail.com",
        "phone": f"+91-{phone_prefix}{random.randint(10,99)}-{random.randint(10000, 99999)}",
        "bloodType": blood_type,
        "dateOfBirth": f"{random.randint(1980, 2004)}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}",
        "gender": random.choice(["male", "female"]),
        "address": f"{addr_street}, Near Landmark, Pincode {random.randint(751001, 751024)}",
        "city": city,
        "state": state,
        "medicalHistory": "Fit for whole blood donation. Cleared hemoglobin check (14.2 g/dL)." if is_eligible else "Mild hemoglobin deferral (< 12.5 g/dL). Advised iron-rich diet.",
        "lastDonationDate": last_don,
        "isEligible": is_eligible,
        "totalDonations": random.randint(1, 14),
        "createdAt": now - timedelta(days=random.randint(30, 365)),
        "updatedAt": now,
    }
    doc_ref = db.collection("donors").add(donor_doc)[1]
    donors_ids.append((doc_ref.id, blood_type))
print(f"   Created {len(donors_ids)} Indian donors.")

# 3. Seed Inventory
print("3. Seeding Blood Inventory...")
inventory_count = 0
for bt in BLOOD_TYPES:
    # Generate 3 to 5 batches per blood group across all Indian states
    for comp in random.sample(COMPONENTS, k=random.randint(3, 4)):
        days_offset = random.randint(-4, 35)
        collection_dt = now - timedelta(days=random.randint(4, 28))
        expiry_dt = collection_dt + timedelta(days=35 + days_offset)
        
        status = "available"
        if expiry_dt < now:
            status = "expired"
        elif random.random() < 0.2:
            status = "reserved"

        inv_doc = {
            "bloodType": bt,
            "units": random.randint(4, 20),
            "component": comp,
            "collectionDate": collection_dt.strftime("%Y-%m-%d"),
            "expiryDate": expiry_dt.strftime("%Y-%m-%d"),
            "donorId": random.choice(donors_ids)[0] if donors_ids else None,
            "status": status,
            "notes": f"Batch #IN-BB-{random.randint(1000, 9999)} tested negative for HIV, Hepatitis B/C, VDRL, and Malaria as per NACO guidelines.",
            "addedBy": "demo-admin-uid",
            "createdAt": collection_dt,
            "updatedAt": now,
        }
        db.collection("bloodInventory").add(inv_doc)
        db.collection("inventory").add(inv_doc)
        inventory_count += 1
print(f"   Created {inventory_count} Indian blood inventory batches.")

# 4. Seed Requests
print("4. Seeding Blood Requests...")
requests_count = 0
statuses = ["pending", "approved", "fulfilled", "rejected"]
urgencies = ["normal", "urgent", "critical"]

for i in range(15):
    hosp, contact, phone = random.choice(INDIAN_HOSPITALS)
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
        "unitsNeeded": random.randint(1, 5),
        "urgencyLevel": urgency,
        "patientName": patient,
        "patientAge": random.randint(12, 78),
        "reason": random.choice([
            "Emergency highway road accident trauma care",
            "Complex open-heart coronary artery bypass (CABG)",
            "Thalassemia major blood transfusion protocol",
            "Severe dengue with acute thrombocytopenia (platelet requirement)",
            "Oncology chemotherapy induced pancytopenia",
            "Emergency caesarean section with PPH management",
        ]),
        "status": stat,
        "rejectionReason": "Insufficient compatible units available in state buffer stock" if stat == "rejected" else None,
        "approvedBy": "demo-admin-uid" if stat in ["approved", "fulfilled"] else None,
        "fulfilledAt": (now - timedelta(hours=random.randint(2, 48))) if stat == "fulfilled" else None,
        "createdAt": now - timedelta(days=random.randint(0, 10)),
        "updatedAt": now,
    }
    db.collection("bloodRequests").add(req_doc)
    db.collection("requests").add(req_doc)
    requests_count += 1
print(f"   Created {requests_count} Indian blood requests.")

# 5. Seed Camps
print("5. Seeding Donation Camps...")
camp_templates = [
    ("IIIT Bhubaneswar Annual Blood Donation Camp", "Student Activity Center (SAC), Gothapatna", "IDCO Plot #1, Malipada", "Bhubaneswar", 5, "09:30", "16:30", "NSS & Youth Red Cross IIIT-BH", 150, "Annual campus voluntary blood donation drive organized by NSS volunteers and Youth Red Cross for students, staff, and faculty."),
    ("KIIT & KIMS Mega Voluntary Blood Drive", "Campus 6 Auditorium, Patia", "KIIT University Campus", "Bhubaneswar", 12, "09:00", "17:00", "KIIT NSS Bureau & Red Cross", 200, "State-level mega blood collection drive in collaboration with KIMS Blood Center."),
    ("Indian Red Cross Society Odisha Blood Fair", "Red Cross Bhawan, Unit-IX", "Sachivalaya Marg", "Bhubaneswar", -2, "08:30", "15:00", "IRCS Odisha State Branch", 180, "State foundation day voluntary blood donation festival."),
    ("Rotary Club Corporate LifeSavers Drive", "BKC Convention Hall, Bandra East", "G-Block, BKC", "Mumbai", 18, "10:00", "16:00", "Rotary Club of Bombay Midtown", 100, "Corporate park blood drive with pre-donation health checkups and donor recognition cards."),
    ("Lions Club Youth Voluntary Donation Camp", "Town Hall, Shivajinagar", "Near Pune Central Station", "Pune", 25, "09:00", "14:30", "Lions Club International Pune", 80, "Community youth donor mobilization camp to support regional thalassemia patients."),
    ("BloodConnect Delhi University Camp", "North Campus Sports Complex", "University Road", "New Delhi", -10, "09:00", "16:00", "BloodConnect Foundation Delhi", 120, "Completed university donation drive with high youth turn-out."),
    ("Bengaluru Tech Corridor Blood Donation Drive", "Whitefield Amphitheatre", "ITPL Main Road", "Bengaluru", 30, "10:00", "17:00", "Bangalore Raktadaan Samiti", 110, "Weekend tech corridor voluntary blood collection camp."),
    ("SCB Medical College Voluntary Blood Rally", "New Academic Block Lawn, Mangalabag", "Medical Road", "Cuttack", -20, "08:00", "14:00", "SCB Medical College Transfusion Wing", 90, "Completed camp replenishing eastern Odisha regional blood bank."),
]

for name, venue, addr, city, days_off, st, et, org, cap, desc in camp_templates:
    camp_date = (now + timedelta(days=days_off)).strftime("%Y-%m-%d")
    status = "upcoming"
    units_col = 0
    if days_off < -5:
        status = "completed"
        units_col = random.randint(45, cap)
    elif days_off <= 0:
        status = "ongoing"
        units_col = random.randint(15, 50)
        
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
        "registeredDonors": [d[0] for d in random.sample(donors_ids, k=min(len(donors_ids), random.randint(4, 12)))],
        "status": status,
        "unitsCollected": units_col,
        "createdBy": "demo-admin-uid",
        "createdAt": now - timedelta(days=15),
        "updatedAt": now,
    }
    db.collection("camps").add(camp_doc)
print(f"   Created {len(camp_templates)} Indian donation camps.")

# 6. Seed Notifications
print("6. Seeding Notifications...")
notif_data = [
    ("low_stock", "CRITICAL: O- Negative Supply Low in Bhubaneswar", "Only 3 units of O- whole blood remaining in central bank. Please schedule emergency collection camp in Patia/Infocity.", "demo-admin-uid"),
    ("expiry_alert", "Expiring Blood Units Warning", "6 units of B+ platelets at AIIMS Storage are expiring within 48 hours. Please review allocation to KIMS and SCB.", "demo-admin-uid"),
    ("request_update", "Urgent Request Approved", "Emergency blood request #OD-REQ-8821 for 4 units of A+ blood for AIIMS Hospital Bhubaneswar has been approved.", "demo-hospital-uid"),
    ("request_update", "Blood Request Fulfilled", "Apollo Hospitals Mumbai request for CABG bypass surgery was successfully fulfilled.", "demo-hospital-uid"),
    ("camp_reminder", "Donation Drive Tomorrow at IIIT Bhubaneswar", "Reminder: You are registered for the IIIT Bhubaneswar Annual Blood Donation Camp tomorrow at 9:30 AM in SAC Hall.", "demo-donor-uid"),
    ("general", "Voluntary Donor Certificate Generated", "Dhanyavad! Your recent blood donation at SCB Medical College helped save 3 lives. Download your certificate from the dashboard.", "demo-donor-uid"),
    ("low_stock", "Platelets Restock Needed", "Platelets inventory is approaching lower safety threshold (< 5 units) across Odisha central blood banks.", "demo-admin-uid"),
    ("camp_reminder", "Volunteer Registration Confirmed", "Your registration for KIIT & KIMS Mega Voluntary Blood Drive has been confirmed.", "demo-donor-uid"),
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
        "createdAt": now - timedelta(hours=random.randint(1, 48)),
    }
    db.collection("notifications").add(notif_doc)
print(f"   Created {len(notif_data)} Indian notifications.")

print("\n--- ALL COLLECTIONS SEEDED WITH INDIAN DATA SUCCESSFULLY! ---")
