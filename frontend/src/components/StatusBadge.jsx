import React from 'react';

const StatusBadge = ({ status }) => {
  const isAvailable = status.toLowerCase() === 'available';
  const isBooked = status.toLowerCase() === 'booked';
  
  let bgColor = "bg-slate-500/20";
  let textColor = "text-slate-400";
  let dotColor = "bg-slate-400";

  if (isAvailable) {
    bgColor = "bg-primary/20";
    textColor = "text-primary";
    dotColor = "bg-primary";
  } else if (isBooked) {
    bgColor = "bg-rose-500/20";
    textColor = "text-rose-400";
    dotColor = "bg-rose-400";
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default StatusBadge;
