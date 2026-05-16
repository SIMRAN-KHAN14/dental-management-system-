import React, { useState } from "react";
import { Calendar, Clock, User, XCircle, Trash2 } from "lucide-react";
import axios from "axios";

const AppointmentCard = ({ appointment, onCancel }) => {
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    
    try {
      setLoading(true);
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/appointments/${appointment.id}`);
      if (onCancel) onCancel(appointment.id);
    } catch (err) {
      console.error("Failed to cancel appointment:", err);
      alert("Failed to cancel appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-5 hover:border-rose-500/30 transition-all duration-300 flex flex-col h-full shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="bg-primary/10 p-2 rounded-lg text-primary">
          <Calendar size={20} />
        </div>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="text-slate-500 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
          title="Cancel Appointment"
        >
          {loading ? <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={18} />}
        </button>
      </div>

      <div className="space-y-3 flex-1">
        <div>
          <h3 className="text-white font-semibold flex items-center gap-2">
            <User size={16} className="text-slate-400" />
            {appointment.doctor_name}
          </h3>
          <p className="text-xs text-primary font-medium ml-6">{appointment.specialization}</p>
        </div>

        <div className="flex items-center gap-2 text-slate-300 text-sm bg-slate-900/50 p-2 rounded-lg border border-border/50">
          <Clock size={14} className="text-slate-500" />
          <span className="font-mono">{appointment.date_slot}</span>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider font-bold text-teal-500 bg-teal-500/10 px-2 py-0.5 rounded">
          Confirmed
        </span>
        <span className="text-[10px] text-slate-500 font-mono">
          ID: #{appointment.id}
        </span>
      </div>
    </div>
  );
};

export default AppointmentCard;
