import React, { useEffect, useState, useMemo } from "react";
import { Loader2, Calendar, Users, Clock } from "lucide-react";
import axios from "axios";
import Modal from "./Modal";

const RescheduleAppointmentModal = ({ open, patientId, onClose, onPrefill }) => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedIdx, setSelectedIdx] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [slot, setSlot] = useState("");

  // Load appointments + doctors
  useEffect(() => {
    if (!open || !patientId?.trim()) return;
    setError(null);
    setSelectedIdx(""); setDoctorId(""); setSlot(""); setSlots([]);
    setDate(new Date().toISOString().split("T")[0]);

    const fetchData = async () => {
      try {
        setLoading(true);
        const [aptRes, docRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/appointments`, { params: { patient_id: patientId } }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/doctors`)
        ]);
        setAppointments(aptRes.data || []);
        setDoctors(docRes.data || []);
      } catch {
        setError("Failed to load data.");
      } finally { setLoading(false); }
    };
    fetchData();
  }, [open, patientId]);

  // Load slots
  const canFetchSlots = useMemo(() => doctorId && date, [doctorId, date]);
  useEffect(() => {
    if (!open || !canFetchSlots) return;
    const fetchSlots = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/availability`, { params: { doctor_id: doctorId, date } });
        setSlots(res.data || []);
      } catch { setError("Failed to fetch slots."); }
      finally { setLoading(false); }
    };
    fetchSlots();
  }, [open, canFetchSlots, doctorId, date]);

  // Confirm reschedule
  const handleConfirm = async () => {
    const apt = appointments[Number(selectedIdx)];
    if (!patientId?.trim() || !apt || !doctorId || !date || !slot) return;
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/appointments/${apt.id}`, { new_date: date, new_time: slot });
      onPrefill?.(`Rescheduled appointment for patient ${patientId.trim()} from doctor ${apt.doctor_id} on ${apt.date} ${apt.time} → doctor ${doctorId} on ${date} ${slot}.`);
    } catch { setError("Failed to reschedule."); return; }
    onClose?.();
  };

  return (
    <Modal open={open} onClose={onClose} title="Reschedule Appointment"
      footer={
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">Patient: <span className="font-mono text-primary">{patientId || "N/A"}</span></span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-slate-200 rounded-lg">Cancel</button>
            <button onClick={handleConfirm} disabled={!patientId || !doctorId || !slot} className="px-4 py-2 bg-primary text-white rounded-lg">Confirm</button>
          </div>
        </div>
      }>
      {error && <div className="text-rose-400 text-sm">{error}</div>}
      {loading ? <Loader2 className="animate-spin text-primary" /> : (
        <>
          {/* Current appointment list */}
          {appointments.length > 0 ? (
            <div className="mb-4">
              <label className="text-xs text-slate-400">Select current appointment</label>
              {appointments.map((apt, idx) => (
                <button key={apt.id} onClick={() => setSelectedIdx(String(idx))}
                  className={`block w-full px-3 py-2 rounded ${selectedIdx==idx?"bg-primary/10 text-primary":"bg-slate-900 text-slate-200"}`}>
                  Doctor {apt.doctor_id} — {apt.date} {apt.time}
                </button>
              ))}
            </div>
          ) : <p className="text-slate-400">No appointments found.</p>}

          {/* New doctor + date + slot */}
          <select value={doctorId} onChange={(e)=>setDoctorId(e.target.value)} className="w-full mb-3 bg-slate-900 text-white rounded-lg p-2">
            <option value="">Select doctor</option>
            {doctors.map(d => <option key={d.doctor_id} value={d.doctor_id}>{d.doctor_name}</option>)}
          </select>
          <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="w-full mb-3 bg-slate-900 text-white rounded-lg p-2"/>
          <select value={slot} onChange={(e)=>setSlot(e.target.value)} className="w-full bg-slate-900 text-white rounded-lg p-2">
            <option value="">Select slot</option>
            {slots.map((s, i) => <option key={i} value={s.time}>{s.date} {s.time}</option>)}
          </select>
        </>
      )}
    </Modal>
  );
};

export default RescheduleAppointmentModal;
