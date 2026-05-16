import React, { useState } from "react";
import axios from "axios";
import AppointmentCard from "./AppointmentCard";

const Appointments = () => {
  const [patientId, setPatientId] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState("");

  const fetchAppointments = async () => {
    try {
      setError("");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/appointments`, {
        params: { patient_id: patientId },
      });
      setAppointments(res.data || []);
    } catch (err) {
      console.error("Failed to load appointments:", err);
      setError("Failed to load appointments. Please try again later.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <input
          type="text"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          placeholder="Enter Patient ID"
          className="flex-1 bg-slate-900 border border-border rounded-lg px-3 py-2 text-white"
        />
        <button
          onClick={fetchAppointments}
          className="px-4 py-2 bg-primary text-white rounded-lg"
        >
          Look Up
        </button>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {appointments.length === 0 && !error && (
        <p className="text-slate-400">No appointments found.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {appointments.map((apt) => (
          <AppointmentCard key={apt.id} appointment={apt} />
        ))}
      </div>
    </div>
  );
};

export default Appointments;
