import React, { useState, useEffect } from "react";
import axios from "axios";
import { Loader2 } from "lucide-react";

const SlotPicker = ({ doctorId, date, onSlotSelect }) => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!doctorId || !date) return;

    const fetchSlots = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/availability`,
          { params: { doctor_id: doctorId, date: date } }
        );
        setSlots(response.data);
      } catch (err) {
        console.error("Failed to fetch slots:", err);
        setError("Failed to fetch slots.");
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [doctorId, date]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 text-primary">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-rose-400 text-sm p-2 text-center">{error}</div>
    );
  }

  if (!Array.isArray(slots) || slots.length === 0) {
    return (
      <div className="text-slate-400 text-sm p-4 text-center">
        No available slots for this date.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 mt-2">
      {slots.map((slot, idx) => (
        <button
          key={idx}
          onClick={() => onSlotSelect(slot.time)}
          className="py-2 px-3 text-sm font-mono bg-primary/10 text-primary border border-primary/20 rounded-md hover:bg-primary hover:text-white transition-colors duration-200"
        >
          {slot.date} {slot.time}
        </button>
      ))}
    </div>
  );
};

export default SlotPicker;
