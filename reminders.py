import os
import json
import pandas as pd
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

CSV_PATH = os.path.join(os.path.dirname(__file__), "doctor_availability.csv")
USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")

# Configure SMTP details here for real emails
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.example.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")

def send_email(to_email, subject, body):
    if not SMTP_USER or not SMTP_PASS:
        # Mock sending email if no credentials are provided
        print(f"\n[MOCK EMAIL] To: {to_email}")
        print(f"Subject: {subject}")
        print(f"Body:\n{body}\n")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)
        server.quit()
        print(f"Sent reminder email to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")

def check_reminders():
    print(f"[{datetime.now()}] Checking for appointments 24 hours away...")
    try:
        if not os.path.exists(CSV_PATH) or not os.path.exists(USERS_FILE):
            return
            
        df = pd.read_csv(CSV_PATH)
        # Filter booked slots
        booked = df[df['is_available'].astype(str).str.upper() == 'FALSE']
        
        with open(USERS_FILE, "r") as f:
            users = json.load(f)
            
        # Map patient_id to email and name
        patient_map = {}
        for user_data in users.values():
            if "patient_id" in user_data:
                patient_map[user_data["patient_id"]] = {
                    "email": user_data["email"],
                    "name": user_data["name"]
                }
                
        now = datetime.now()
        target_time = now + timedelta(hours=24)
        
        for _, row in booked.iterrows():
            patient_id = row['patient_to_attend']
            if pd.isna(patient_id) or not patient_id:
                continue
                
            # e.g., "2026-05-16 14:00"
            date_str = str(row['date_slot']).strip()
            try:
                # Our CSV might have different formats, try to parse
                apt_time = datetime.strptime(date_str, "%Y-%m-%d %H:%M")
            except ValueError:
                # If format is different, skip
                continue
                
            # Check if appointment is exactly between 23.5 and 24.5 hours from now
            diff = apt_time - now
            if timedelta(hours=23, minutes=30) <= diff <= timedelta(hours=24, minutes=30):
                if patient_id in patient_map:
                    patient = patient_map[patient_id]
                    subject = "Reminder: Upcoming Dental Appointment"
                    body = f"Dear {patient['name']},\n\nThis is a reminder that you have an appointment with {row['doctor_name']} tomorrow at {apt_time.strftime('%I:%M %p')}.\n\nThank you,\nDental Clinic Team"
                    send_email(patient["email"], subject, body)
                    
    except Exception as e:
        print(f"Error in check_reminders: {e}")
