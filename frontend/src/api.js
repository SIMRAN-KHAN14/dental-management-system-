import axios from "axios";

// Base URL from .env
const API_URL = import.meta.env.VITE_API_URL;
// -------------------- Doctor Availability --------------------
export const getDoctorAvailability = async (doctorId) => {
  try {
    const res = await axios.get(`${API_URL}/api/availability`, {
      params: { doctor_id: doctorId },
    });
    return res.data;
  } catch (err) {
    console.error("Failed to load doctor availability:", err);
    throw err;
  }
};
// -------------------- Doctors --------------------
export const getDoctors = async () => {
  try {
    const res = await axios.get(`${API_URL}/api/doctors`);
    return res.data;
  } catch (err) {
    console.error("Failed to load doctors:", err);
    throw err;
  }
};

// -------------------- Appointments --------------------
export const getAppointments = async (patientId) => {
  try {
    const res = await axios.get(`${API_URL}/api/appointments`, {
      params: { patient_id: patientId },
    });
    return res.data;
  } catch (err) {
    console.error("Failed to load appointments:", err);
    throw err;
  }
};

// -------------------- Book Appointment --------------------
export const bookAppointment = async (patientId, doctorId, date, time) => {
  try {
    const res = await axios.post(`${API_URL}/api/appointments`, {
      patient_id: patientId,
      doctor_id: doctorId,
      date,
      time,
    });
    return res.data;
  } catch (err) {
    console.error("Failed to book appointment:", err);
    throw err;
  }
};

// -------------------- Cancel Appointment --------------------
export const cancelAppointment = async (appointmentId) => {
  try {
    const res = await axios.delete(`${API_URL}/api/appointments/${appointmentId}`);
    return res.data;
  } catch (err) {
    console.error("Failed to cancel appointment:", err);
    throw err;
  }
};
