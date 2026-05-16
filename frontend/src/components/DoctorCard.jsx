import React, { useState } from "react";
import { Star, Clock, User, MessageCircle } from "lucide-react";
import SlotPicker from "./SlotPicker";

const colors = [
  "bg-blue-500", "bg-teal-500", "bg-indigo-500",
  "bg-purple-500", "bg-pink-500", "bg-rose-500", "bg-orange-500"
];

const getInitials = (name) =>
  name ? name.split(" ").map(n => n[0]).join("").toUpperCase() : "?";

const formatSpecialization = (spec) =>
  spec ? spec.split("_").map(w => w[0].toUpperCase() + w.slice(1)).join(" ") : "";

const formatDoctorName = (nameOrId) => {
  if (!nameOrId) return "";
  if (!isNaN(nameOrId)) return `Doctor ID ${nameOrId}`;
  return nameOrId.startsWith("Dr.") ? nameOrId : "Dr. " + nameOrId.split(" ").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
};

const DoctorCard = ({ doctor }) => {
  const [showSlots, setShowSlots] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const colorIndex = doctor.doctor_name?.length % colors.length || 0;
  const avatarColor = colors[colorIndex];

  const handleSlotSelect = (time) => {
    const patientId = localStorage.getItem("patientId") || "2022-310-217";
    const msg = `Book patient ${patientId} with ${doctor.doctor_name || doctor.doctor_id} on ${selectedDate} ${time}`;
    localStorage.setItem("prefillMessage", msg);
    window.location.href = "/chat";
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-5 hover:border-primary/50 transition-colors duration-200 flex flex-col h-full shadow-sm hover:shadow-lg">
      <div className="flex items-start gap-4 mb-3">
        {doctor.photo_url ? (
          <img src={doctor.photo_url} alt={doctor.doctor_name} className="w-14 h-14 rounded-full object-cover border-2 border-primary/20" />
        ) : (
          <div className={`w-14 h-14 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
            {getInitials(doctor.doctor_name || doctor.doctor_id)}
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold text-white leading-tight">
              {formatDoctorName(doctor.doctor_name || doctor.doctor_id)}
            </h3>
            {doctor.rating && (
              <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded text-xs font-bold">
                <Star size={12} className="fill-current" /> {doctor.rating}
              </div>
            )}
          </div>
          <p className="text-sm text-primary font-medium mt-0.5">{formatSpecialization(doctor.specialization)}</p>
          
          {doctor.experience_years && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Clock size={12} /> {doctor.experience_years} Years Exp.
            </p>
          )}
        </div>
      </div>

      {doctor.bio && (
        <p className="text-sm text-slate-300 line-clamp-2 mb-4 flex-1">
          {doctor.bio}
        </p>
      )}

      {doctor.languages && doctor.languages.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {doctor.languages.map((lang, idx) => (
            <span key={idx} className="text-[10px] px-2 py-1 rounded-full bg-slate-800 text-slate-300 border border-border">
              {lang}
            </span>
          ))}
        </div>
      )}

      <button
        onClick={() => setShowSlots(!showSlots)}
        className="w-full mt-auto py-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg transition-colors text-sm font-semibold border border-primary/20 flex justify-center items-center gap-2"
      >
        <User size={16} />
        {showSlots ? "Hide Slots" : "Book Now"}
      </button>

      {showSlots && (
        <div className="mt-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="block text-xs text-slate-400 mb-2">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-slate-900 border border-border rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-primary mb-3 shadow-inner"
          />
          <SlotPicker
            doctorName={doctor.doctor_name}
            doctorId={doctor.doctor_id}
            date={selectedDate}
            onSlotSelect={handleSlotSelect}
          />
        </div>
      )}
    </div>
  );
};

export default DoctorCard;
