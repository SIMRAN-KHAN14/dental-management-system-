import React, { useEffect, useMemo, useState } from "react";
import { Loader2, Calendar, Users, Clock } from "lucide-react";
import axios from "axios";
import Modal from "./Modal";

const BookAppointmentModal = ({ open, patientId, onClose, onPrefill }) => {
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [slots, setSlots] = useState([]);
  const [slot, setSlot] = useState("");
  const [error, setError] = useState(null);

  // Fetch doctors when modal opens
  useEffect(() => {
    if (!open) return;
    setError(null);
    setDoctorId("");
    setSlot("");
    setDate(new Date().toISOString().split("T")[0]);
    setSlots([]);

    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/doctors`);
        setDoctors(res.data || []);
      } catch {
        setError("Failed to load doctors.");
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, [open]);

  const canFetchSlots = useMemo(() => Boolean(doctorId && date), [doctorId, date]);

  // Fetch slots when doctor/date changes
  useEffect(() => {
    if (!open || !canFetchSlots) return;

    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        setError(null);
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/availability`, {
          params: { doctor_id: doctorId, date }
        });
        setSlots(res.data || []);
      } catch {
        setError("Failed to fetch slots.");
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    setSlot("");
    fetchSlots();
  }, [open, canFetchSlots, doctorId, date]);

  const handleConfirm = async () => {
    if (!patientId?.trim() || !doctorId || !date || !slot) {
      setError("Please fill in all fields.");
      return;
    }
    
    setLoadingSlots(true); // Re-use loading state for the booking action
    try {
      const selectedDoctor = doctors.find(d => String(d.doctor_id) === String(doctorId));
      
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/appointments`, {
        patient_id: patientId.trim(),
        doctor_id: parseInt(doctorId, 10),
        date,
        time: slot
      });
      
      // Prefill message with doctor name instead of ID
      const msg = `Successfully booked appointment for patient ${patientId.trim()} with ${selectedDoctor?.doctor_name || 'Doctor'} on ${date} at ${slot}.`;
      onPrefill?.(msg);
      console.log("✅ Appointment booked:", res.data);
      onClose?.();
    } catch (err) {
      console.error("❌ Failed to book appointment:", err);
      setError(err.response?.data?.detail || "Failed to book appointment.");
    } finally {
      setLoadingSlots(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Book an Appointment"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Patient:{" "}
            <span className="font-mono text-primary">
              {patientId?.trim() || "2022-310-217"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800/50 text-slate-200 hover:bg-slate-800 transition-colors border border-border"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Booking
            </button>
          </div>
        </div>
      }
    >
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Doctor dropdown */}
      <div>
        <label className="block text-xs text-slate-400 mb-2 flex items-center gap-2">
          <Users size={14} className="text-slate-500" /> Doctor
        </label>
        {loadingDoctors ? (
          <div className="flex items-center justify-center py-3 text-primary">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : (
          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
          >
            <option value="">Select a doctor</option>
            {doctors.map((d, idx) => (
              <option key={idx} value={d.doctor_id}>
                {d.doctor_name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Date + Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-xs text-slate-400 mb-2 flex items-center gap-2">
            <Calendar size={14} className="text-slate-500" /> Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-2 flex items-center gap-2">
            <Clock size={14} className="text-slate-500" /> Time
          </label>
          {loadingSlots ? (
            <div className="flex items-center justify-center py-3 text-primary">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : slots.length === 0 ? (
            <div className="text-slate-400 text-sm bg-slate-900 border border-border rounded-lg px-3 py-2">
              No slots
            </div>
          ) : (
            <select
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
            >
              <option value="">Select a time</option>
              {slots.map((s, idx) => (
                <option key={idx} value={s.time}>
                  {s.date} {s.time}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default BookAppointmentModal;
