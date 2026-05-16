import React, { useState, useEffect } from 'react';
import { Calendar, Search, Loader2 } from 'lucide-react';
import api from '../utils/api';
import AppointmentCard from '../components/AppointmentCard';

const AppointmentsPage = () => {
  const [patientId, setPatientId] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('patientId');
    if (stored) {
      setPatientId(stored);
      fetchAppointments(stored);
    }
  }, []);

  const fetchAppointments = async (idToFetch) => {
    if (!idToFetch.trim()) return;
    
    setLoading(true);
    setError(null);
    setHasSearched(true);
    
    try {
      const response = await api.get('/api/appointments', {
        params: { patient_id: idToFetch }
      });
      setAppointments(response.data);
    } catch (err) {
      setError('Failed to load appointments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    localStorage.setItem('patientId', patientId);
    fetchAppointments(patientId);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">My Appointments</h1>
        <p className="text-slate-400">View and manage your upcoming dental visits.</p>
      </header>

      <form onSubmit={handleSearch} className="mb-10 flex gap-4 max-w-xl">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-500" />
          </div>
          <input
            type="text"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            placeholder="Enter Patient ID (e.g. PAT-1234)"
            className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono transition-all shadow-sm"
          />
        </div>
        <button 
          type="submit"
          disabled={!patientId.trim() || loading}
          className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Look Up'}
        </button>
      </form>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-lg mb-8">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface border border-border rounded-xl p-5 h-40 animate-pulse-slow">
              <div className="w-1/2 h-6 bg-slate-800 rounded mb-2"></div>
              <div className="w-1/3 h-4 bg-slate-800 rounded mb-6"></div>
              <div className="w-3/4 h-4 bg-slate-800 rounded mb-2"></div>
              <div className="w-2/3 h-4 bg-slate-800 rounded"></div>
            </div>
          ))}
        </div>
      ) : hasSearched && appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-border rounded-2xl bg-surface/30">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 mb-6">
            <Calendar size={32} />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No upcoming appointments</h3>
          <p className="text-slate-400 max-w-md mb-6">
            We couldn't find any booked appointments for patient ID <span className="font-mono text-primary">{patientId}</span>.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-colors font-medium border border-primary/20"
          >
            Book a new visit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.map((apt, idx) => (
            <AppointmentCard key={idx} appointment={apt} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
