const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

// ------------------- Doctors -------------------
app.get("/api/doctors", (req, res) => {
  console.log("➡️ Doctors endpoint hit");
  const results = [];
  fs.createReadStream("data/doctors.csv")
    .on("error", (err) => {
      console.error("❌ Error reading doctors.csv:", err.message);
      return res.status(500).json({ error: "Failed to read doctors.csv" });
    })
    .pipe(csv())
    .on("data", (row) => results.push(row))
    .on("end", () => {
      console.log("✅ Doctors loaded:", results.length);
      res.json(results);
    });
});

// ------------------- Doctor Availability -------------------
app.get("/api/availability", (req, res) => {
  const doctorId = req.query.doctor_id;
  console.log("➡️ Availability endpoint hit for doctor_id:", doctorId);
  const results = [];
  fs.createReadStream("data/appointments.csv")
    .on("error", (err) => {
      console.error("❌ Error reading appointments.csv:", err.message);
      return res.status(500).json({ error: "Failed to read appointments.csv" });
    })
    .pipe(csv())
    .on("data", (row) => {
      if (row.doctor_id === doctorId && row.is_available === "TRUE") {
        results.push({ date: row.date, time: row.time });
      }
    })
    .on("end", () => {
      console.log("✅ Availability checked:", results.length);
      res.json(results.length ? results : { message: "No available slots" });
    });
});

// ------------------- Appointments -------------------
app.get("/api/appointments", (req, res) => {
  const patientId = req.query.patient_id;
  console.log("➡️ Appointments endpoint hit for patient_id:", patientId);
  const results = [];
  fs.createReadStream("data/appointments.csv")
    .on("error", (err) => {
      console.error("❌ Error reading appointments.csv:", err.message);
      return res.status(500).json({ error: "Failed to read appointments.csv" });
    })
    .pipe(csv())
    .on("data", (row) => {
      if (row.patient_id === patientId) results.push(row);
    })
    .on("end", () => {
      console.log("✅ Appointments found:", results.length);
      res.json(results.length ? results : { message: "No appointments found" });
    });
});

// ------------------- Slots -------------------
app.get("/api/slots", (req, res) => {
  console.log("➡️ Slots endpoint hit");
  const slots = ["09:00", "10:00", "11:30", "14:00", "16:00"];
  res.json(slots);
});

// ------------------- Book Appointment -------------------
app.post("/api/appointments", (req, res) => {
  console.log("➡️ Book appointment request:", req.body);
  const { patient_id, doctor_id, date, time } = req.body;
  res.json({
    message: "Appointment booked successfully",
    appointment: { patient_id, doctor_id, date, time }
  });
});

// ------------------- Cancel Appointment -------------------
app.delete("/api/appointments/:id", (req, res) => {
  console.log("➡️ Cancel appointment request for ID:", req.params.id);
  const appointmentId = req.params.id;
  res.json({ message: `Appointment ${appointmentId} cancelled successfully` });
});

// ------------------- Reschedule Appointment -------------------
app.put("/api/appointments/:id", (req, res) => {
  console.log("➡️ Reschedule appointment request for ID:", req.params.id, "with body:", req.body);
  const appointmentId = req.params.id;
  const { new_date, new_time } = req.body;
  res.json({
    message: `Appointment ${appointmentId} rescheduled successfully`,
    new_date,
    new_time
  });
});

// ------------------- Start Server -------------------
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
