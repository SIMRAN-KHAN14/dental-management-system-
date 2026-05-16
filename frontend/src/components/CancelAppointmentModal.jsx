import React, { useEffect, useState } from "react";
import { Loader2, Calendar, XCircle } from "lucide-react";
import axios from "axios";
import Modal from "./Modal";

const CancelAppointmentModal = ({ open, patientId, onClose, onPrefill }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState("");

  useEffect(() => {
    if (!open) return;

    const fetchAppointments = async () => {
      try {
        setError(null);
        setSelectedIdx("");
        setAppointments([]);
        if (!patientId?.trim()) return;

        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/appointments`, {
          params: { patient_id: patientId },
        });
        setAppointments(res.data || []);
      } catch {
        setError("Failed to load appointments.");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [open, patientId]);

  const handleConfirm = async () => {
    if (!patientId?.trim()) return;
    if (selectedIdx === "" && selectedIdx !== 0) return;

    const apt = appointments[Number(selectedIdx)];
    if (!apt) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/appointments/${apt.id}`);
      const msg = `Cancelled appointment for patient ${patientId.trim()} with doctor ID ${apt.doctor_id} on ${apt.date} at ${apt.time}.`;
      onPrefill?.(msg);
      console.log("✅ Appointment cancelled:", apt.id);
    } catch (err) {
      console.error("❌ Failed to cancel appointment:", err);
      setError("Failed to cancel appointment.");
      return;
    }

    onClose?.();
  };

  const footer = (
    <div className="flex items-center justify-between gap-3">
      <div className="text-xs text-slate-400">
        {patientId?.trim() ? (
          <span>
            Patient:{" "}
            <span className="font-mono text-primary">{patientId.trim()}</span>
          </span>
        ) : (
          <span className="text-rose-400">
            Enter a Patient ID in the left panel.
          </span>
        )}
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
          disabled={!patientId?.trim() || selectedIdx === ""}
          className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Confirm Cancellation
        </button>
      </div>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title="Cancel an Appointment" footer={footer}>
      <div className="grid grid-cols-1 gap-4">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-4 text-primary">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-slate-900 border border-border rounded-xl p-4 text-slate-300">
            <div className="flex items-center gap-2 mb-2">
              <XCircle size={18} className="text-rose-400" />
              <span className="font-medium">No appointments found</span>
            </div>
            <div className="text-sm text-slate-400">
              {patientId?.trim()
                ? `No booked appointments for patient ${patientId.trim()}.`
                : "Enter a Patient ID to look up appointments."}
            </div>
          </div>
        ) : (
          <>
            <label className="block text-xs text-slate-400 mb-2 flex items-center gap-2">
              <Calendar size={14} className="text-slate-500" /> Select appointment to cancel
            </label>
            <div className="bg-slate-900 border border-border rounded-xl overflow-hidden">
              {appointments.map((apt, idx) => (
                <button
                  key={`${apt.id}-${idx}`}
                  type="button"
                  onClick={() => setSelectedIdx(String(idx))}
                  className={`w-full px-4 py-3 text-left border-b last:border-b-0 transition-colors ${
                    String(selectedIdx) === String(idx)
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-transparent text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  <div className="font-medium">Doctor ID {apt.doctor_id}</div>
                  <div className="text-xs text-slate-400 font-mono">
                    {apt.date} at {apt.time}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default CancelAppointmentModal;
