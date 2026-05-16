import React, { useState, useEffect } from "react";
import axios from "axios";
import DoctorCard from "./DoctorCard";

const DoctorGrid = ({ doctors: propDoctors }) => {
  const [fetchedDoctors, setFetchedDoctors] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!propDoctors) {
      axios.get(`${import.meta.env.VITE_API_URL}/api/doctors/profiles`)
        .then(res => setFetchedDoctors(res.data))
        .catch(err => {
          console.error("Failed to load doctors:", err);
          setError("Failed to load doctors.");
        });
    }
  }, [propDoctors]);

  const displayDoctors = propDoctors || fetchedDoctors;

  if (error) return <p className="text-red-500">{error}</p>;

  if (displayDoctors.length === 0) return <p className="text-slate-400">No doctors found.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {displayDoctors.map((doc, idx) => (
        <DoctorCard key={idx} doctor={doc} />
      ))}
    </div>
  );
};

export default DoctorGrid;
