import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, AIMessage, AIMessageChunk
from dental_agent.utils import repair_chat_history
from typing import Optional
import pandas as pd
import json
import bcrypt
from jose import jwt, JWTError
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from reminders import check_reminders

# Load .env
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)

from dental_agent.agent import get_dental_graph

_dental_graph = None


def _get_dental_graph():
    global _dental_graph
    if _dental_graph is None:
        _dental_graph = get_dental_graph()
    return _dental_graph


app = FastAPI()

# Scheduler
scheduler = BackgroundScheduler()

@app.on_event("startup")
def start_scheduler():
    scheduler.add_job(check_reminders, 'interval', hours=1)
    scheduler.start()
    print("Scheduler started")

@app.on_event("shutdown")
def shutdown_scheduler():
    scheduler.shutdown()

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Session memory
sessions: dict[str, list] = {}

CSV_PATH = os.path.join(os.path.dirname(__file__), "doctor_availability.csv")
USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")

# Security settings
SECRET_KEY = "my_super_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    patient_id: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

@app.post("/api/auth/register")
def register(user: UserCreate):
    try:
        with open(USERS_FILE, "r") as f:
            users = json.load(f)
    except:
        users = {}
        
    if user.email in users:
        raise HTTPException(status_code=400, detail="Email already registered")

    patient_id = user.patient_id or f"PAT-{len(users)+1000}"
    
    users[user.email] = {
        "name": user.name,
        "email": user.email,
        "password": get_password_hash(user.password),
        "patient_id": patient_id
    }
    
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=4)
        
    token = create_access_token({"sub": user.email, "patient_id": patient_id})
    return {"access_token": token, "token_type": "bearer", "user": {"name": user.name, "email": user.email, "patient_id": patient_id}}

@app.post("/api/auth/login")
def login(user: UserLogin):
    try:
        with open(USERS_FILE, "r") as f:
            users = json.load(f)
    except:
        users = {}
        
    db_user = users.get(user.email)
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    token = create_access_token({"sub": user.email, "patient_id": db_user["patient_id"]})
    return {"access_token": token, "token_type": "bearer", "user": {"name": db_user["name"], "email": db_user["email"], "patient_id": db_user["patient_id"]}}

class ChatRequest(BaseModel):
    message: str
    session_id: str

class AppointmentCreate(BaseModel):
    patient_id: str
    doctor_id: int
    date: str
    time: str

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        session_id = request.session_id
        if session_id not in sessions:
            sessions[session_id] = []
        
        history = repair_chat_history(sessions[session_id])
        history.append(HumanMessage(content=request.message))
        
        response_text = ""
        final_state = None
        
        # Stream from LangGraph supervisor workflow
        for event in _get_dental_graph().stream(
            {"messages": history},
            stream_mode=["messages", "values"],
            config={"recursion_limit": 25},
        ):
            event_type = event[0]
            event_data = event[1]
            
            if event_type == "messages":
                chunk, meta = event_data[0], (event_data[1] if len(event_data) > 1 else {})
                node = (meta or {}).get("langgraph_node", "")
                if node == "supervisor":
                    continue
                is_ai = isinstance(chunk, (AIMessage, AIMessageChunk)) or getattr(chunk, "type", "") == "ai"
                if is_ai and getattr(chunk, "content", None) and not getattr(chunk, "tool_calls", None):
                    if isinstance(chunk.content, str):
                        response_text += chunk.content
                    
            elif event_type == "values":
                final_state = event_data
                sessions[session_id] = repair_chat_history(event_data.get("messages", []))

        if not response_text.strip() and final_state:
            if final_state.get("final_response"):
                response_text = final_state["final_response"]
            else:
                for msg in reversed(final_state.get("messages", [])):
                    if isinstance(msg, AIMessage) and msg.content and not msg.tool_calls:
                        response_text = msg.content if isinstance(msg.content, str) else str(msg.content)
                        break
        
        return {"response": response_text or "I processed your request. How else can I help?", "session_id": session_id}
    except Exception as e:
        if request.session_id in sessions and sessions[request.session_id]:
            sessions[request.session_id] = repair_chat_history(sessions[request.session_id])
        
        err_str = str(e)
        if "failed_generation" in err_str:
            friendly_msg = "I'm sorry, I didn't quite catch all the details needed for that action. Could you please provide more information (like doctor name, date, or patient ID)?"
            return {"response": friendly_msg, "session_id": request.session_id}
            
        return {"response": f"Sorry, an error occurred: {err_str}", "session_id": request.session_id}

@app.get("/api/appointments")
def get_appointments(patient_id: str):
    try:
        df = pd.read_csv(CSV_PATH)
        df_filtered = df[(df['is_available'].astype(str).str.upper() == 'FALSE') & (df['patient_to_attend'] == patient_id)]
        
        appointments = []
        for _, row in df_filtered.iterrows():
            date_slot = pd.to_datetime(row['date_slot']).strftime("%Y-%m-%d %H:%M")
            appointments.append({
                "id": int(row['id']),
                "date_slot": date_slot,
                "doctor_name": row['doctor_name'],
                "specialization": row['specialization']
            })
        return appointments
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/doctors")
def get_doctors():
    try:
        df = pd.read_csv(CSV_PATH)
        doctors_df = df[['doctor_id', 'doctor_name', 'specialization']].drop_duplicates()
        return doctors_df.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/doctors/profiles")
def get_doctor_profiles():
    try:
        from datetime import datetime
        today_str = datetime.now().strftime("%Y-%m-%d")
        
        # Load CSV doctors
        df = pd.read_csv(CSV_PATH)
        
        # Compute available_today
        today_avail = df[(df['date_slot'].str.startswith(today_str)) & (df['is_available'].astype(str).str.upper() == 'TRUE')]
        available_doctors = set(today_avail['doctor_name'].unique())

        csv_doctors = df[['doctor_id', 'doctor_name', 'specialization']].drop_duplicates().to_dict(orient="records")
        
        # Load JSON profiles
        profiles_path = os.path.join(os.path.dirname(__file__), "doctor_profiles.json")
        if os.path.exists(profiles_path):
            with open(profiles_path, "r") as f:
                profiles = json.load(f)
        else:
            profiles = []
            
        # Merge them
        profiles_map = {p["doctor_name"]: p for p in profiles}
        merged = []
        for doc in csv_doctors:
            name = doc["doctor_name"]
            profile_data = profiles_map.get(name, {})
            merged.append({
                **doc, 
                **profile_data,
                "available_today": name in available_doctors
            })
            
        return merged
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/slots")
def get_slots(doctor_name: str, date: str):
    try:
        df = pd.read_csv(CSV_PATH)
        df_filtered = df[(df['doctor_name'].str.lower() == doctor_name.lower()) & 
                         (df['date_slot'].str.startswith(date)) & 
                         (df['is_available'].astype(str).str.upper() == 'TRUE')]
        
        slots = []
        for _, row in df_filtered.iterrows():
            time_slot = pd.to_datetime(row['date_slot']).strftime("%H:%M")
            slots.append(time_slot)
        return slots
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/availability")
def get_availability(doctor_id: int, date: str):
    try:
        df = pd.read_csv(CSV_PATH)
        mask = (df['doctor_id'] == doctor_id) & (df['date_slot'].str.startswith(date)) & (df['is_available'].astype(str).str.upper() == 'TRUE')
        df_filtered = df[mask]
        
        slots = []
        for _, row in df_filtered.iterrows():
            dt = pd.to_datetime(row['date_slot'])
            slots.append({
                "date": dt.strftime("%Y-%m-%d"),
                "time": dt.strftime("%H:%M")
            })
        return slots
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/appointments")
def create_appointment(appt: AppointmentCreate):
    try:
        df = pd.read_csv(CSV_PATH)
        # Match by doctor_id, date, and time
        date_slot = f"{appt.date} {appt.time}"
        mask = (df['doctor_id'] == appt.doctor_id) & (df['date_slot'] == date_slot)
        
        if not df[mask].any().any():
            raise HTTPException(status_code=404, detail="Slot not found")
            
        if str(df.loc[mask, 'is_available'].iloc[0]).upper() == 'FALSE':
            raise HTTPException(status_code=400, detail="Slot already booked")
            
        df.loc[mask, 'is_available'] = 'FALSE'
        df.loc[mask, 'patient_to_attend'] = appt.patient_id
        df.to_csv(CSV_PATH, index=False)
        
        return {"message": "Appointment booked successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/appointments/{appointment_id}")
def delete_appointment(appointment_id: int):
    try:
        df = pd.read_csv(CSV_PATH)
        mask = df['id'] == appointment_id
        
        if not df[mask].any().any():
            raise HTTPException(status_code=404, detail="Appointment not found")
            
        df.loc[mask, 'is_available'] = 'TRUE'
        df.loc[mask, 'patient_to_attend'] = ''
        df.to_csv(CSV_PATH, index=False)
        
        return {"message": "Appointment cancelled successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/stats")
def get_stats():
    try:
        df = pd.read_csv(CSV_PATH)
        total_slots = len(df)
        available_slots = len(df[df['is_available'].astype(str).str.upper() == 'TRUE'])
        booked_slots = total_slots - available_slots
        doctors_count = df['doctor_name'].nunique()
        specializations = df['specialization'].unique().tolist()
        
        return {
            "total_slots": total_slots,
            "booked_slots": booked_slots,
            "available_slots": available_slots,
            "doctors_count": doctors_count,
            "specializations": specializations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/analytics")
def get_analytics():
    try:
        df = pd.read_csv(CSV_PATH)
        
        # Mock some analytics since we only have a few rows of data
        # Real logic:
        # daily bookings
        df['date'] = pd.to_datetime(df['date_slot']).dt.date
        daily_bookings = df[df['is_available'].astype(str).str.upper() == 'FALSE'].groupby('date').size().reset_index(name='bookings')
        trend = [{"date": str(row['date']), "bookings": row['bookings']} for _, row in daily_bookings.iterrows()]
        
        # Ensure we have some mock trend data if csv is sparse
        if len(trend) < 5:
            base = datetime.now() - timedelta(days=5)
            trend = [{"date": (base + timedelta(days=i)).strftime("%Y-%m-%d"), "bookings": (i * 2 + 3) % 8} for i in range(5)] + trend
        
        # cancellation rate (mocked)
        cancellation_rate = 12.5 
        
        # top doctors
        top_doctors_series = df[df['is_available'].astype(str).str.upper() == 'FALSE'].groupby('doctor_name').size().nlargest(5)
        top_doctors = [{"name": k, "appointments": v} for k, v in top_doctors_series.items()]
        
        # specialization breakdown
        spec_series = df.groupby('specialization').size()
        specializations = [{"name": k, "value": v} for k, v in spec_series.items()]
        
        # peak hours
        df['hour'] = pd.to_datetime(df['date_slot']).dt.hour
        peak_series = df[df['is_available'].astype(str).str.upper() == 'FALSE'].groupby('hour').size()
        peak_hours = [{"hour": f"{k:02d}:00", "appointments": v} for k, v in peak_series.items()]
        if len(peak_hours) == 0:
            peak_hours = [{"hour": "09:00", "appointments": 5}, {"hour": "10:00", "appointments": 8}, {"hour": "14:00", "appointments": 4}]

        return {
            "trend": trend,
            "cancellation_rate": cancellation_rate,
            "top_doctors": top_doctors,
            "specializations": specializations,
            "peak_hours": peak_hours
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/appointments/{appointment_id}")
def reschedule_appointment(appointment_id: int, new_data: dict):
    try:
        df = pd.read_csv(CSV_PATH)
        # Find old appointment
        old_mask = df['id'] == appointment_id
        if not df[old_mask].any().any():
            raise HTTPException(status_code=404, detail="Old appointment not found")
            
        patient_id = df.loc[old_mask, 'patient_to_attend'].iloc[0]
        
        # Find new slot
        new_date = new_data.get("new_date")
        new_time = new_data.get("new_time")
        date_slot = f"{new_date} {new_time}"
        
        # We assume the same doctor for reschedule in this simple implementation, 
        # but the frontend might allow changing doctors. Let's handle both.
        new_mask = (df['date_slot'] == date_slot)
        # If doctor_id is provided in new_data, use it
        if "new_doctor_id" in new_data:
            new_mask &= (df['doctor_id'] == int(new_data["new_doctor_id"]))
        else:
            # Otherwise use the same doctor as before
            new_doctor_id = df.loc[old_mask, 'doctor_id'].iloc[0]
            new_mask &= (df['doctor_id'] == new_doctor_id)

        if not df[new_mask].any().any():
            raise HTTPException(status_code=404, detail="New slot not found")
            
        if str(df.loc[new_mask, 'is_available'].iloc[0]).upper() == 'FALSE':
            raise HTTPException(status_code=400, detail="New slot already booked")
            
        # Atomic update
        df.loc[old_mask, 'is_available'] = 'TRUE'
        df.loc[old_mask, 'patient_to_attend'] = ''
        
        df.loc[new_mask, 'is_available'] = 'FALSE'
        df.loc[new_mask, 'patient_to_attend'] = patient_id
        
        df.to_csv(CSV_PATH, index=False)
        
        return {"message": "Appointment rescheduled successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
