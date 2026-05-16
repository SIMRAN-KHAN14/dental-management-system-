import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, Clock, Filter, Activity, Calendar, User, Search, Loader2 } from 'lucide-react';
import api from '../utils/api';
import DoctorGrid from '../components/DoctorGrid';
import AppointmentCard from '../components/AppointmentCard';

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClass}`}>
      <Icon size={24} />
    </div>
    <div>
      <div className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">{title}</div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
    </div>
  </div>
);

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const statsRes = await api.get('/api/stats');
        setStats(statsRes.data);

        const storedPatientId = localStorage.getItem('patientId');
        if (storedPatientId) {
          setPatientId(storedPatientId);
          const aptsRes = await api.get('/api/appointments', {
            params: { patient_id: storedPatientId }
          });
          setAppointments(aptsRes.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePatientSearch = async (e) => {
    e.preventDefault();
    if (!patientId.trim()) return;
    localStorage.setItem('patientId', patientId);
    
    try {
      const aptsRes = await api.get('/api/appointments', {
        params: { patient_id: patientId }
      });
      setAppointments(aptsRes.data || []);
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400">Overview of the dental clinic and your schedule.</p>
      </header>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard 
            title="Total Doctors" 
            value={stats.doctors_count} 
            icon={User} 
            colorClass="bg-blue-500/20 text-blue-400" 
          />
          <StatCard 
            title="Available Slots" 
            value={stats.available_slots} 
            icon={CheckCircle} 
            colorClass="bg-primary/20 text-primary" 
          />
          <StatCard 
            title="Booked Slots" 
            value={stats.booked_slots} 
            icon={Clock} 
            colorClass="bg-rose-500/20 text-rose-400" 
          />
          <StatCard 
            title="Total Slots" 
            value={stats.total_slots} 
            icon={Activity} 
            colorClass="bg-purple-500/20 text-purple-400" 
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel: Appointments */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-primary" />
              Your Appointments
            </h2>
            
            <form onSubmit={handlePatientSearch} className="mb-6 flex gap-2">
              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="Enter Patient ID"
                className="w-full bg-slate-100 dark:bg-slate-900 border border-border rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary font-mono"
              />
              <button 
                type="submit"
                className="bg-primary hover:bg-primary/90 text-white px-3 py-2 rounded-lg text-sm transition-colors"
              >
                <Search size={16} />
              </button>
            </form>

            <div className="space-y-4">
              {appointments.length > 0 ? (
                appointments.map((apt, idx) => (
                  <AppointmentCard key={idx} appointment={apt} />
                ))
              ) : (
                <div className="text-center p-6 text-slate-500 dark:text-slate-400 border border-dashed border-border rounded-lg bg-slate-100 dark:bg-slate-900/50">
                  <Calendar size={24} className="mx-auto mb-2 text-slate-400 dark:text-slate-500" />
                  <p className="text-sm">No upcoming appointments found.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Doctors */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Users size={20} className="text-blue-400" />
              Available Doctors
            </h2>
            <DoctorGrid />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
