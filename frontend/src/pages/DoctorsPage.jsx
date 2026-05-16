import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, Clock, Filter, Loader2, Search } from 'lucide-react';
import api from '../utils/api';
import DoctorGrid from '../components/DoctorGrid';

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClass}`}>
      <Icon size={24} />
    </div>
    <div>
      <div className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">{title}</div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
    </div>
  </div>
);

const DoctorsPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [filterSpec, setFilterSpec] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableToday, setAvailableToday] = useState(false);
  const [sortBy, setSortBy] = useState('rating');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docsRes, statsRes] = await Promise.all([
          api.get('/api/doctors/profiles'),
          api.get('/api/stats')
        ]);
        setDoctors(docsRes.data);
        setStats(statsRes.data);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatSpecialization = (spec) => {
    if (!spec) return "";
    return spec.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const filteredDoctors = doctors
    .filter(d => filterSpec === 'all' || d.specialization === filterSpec)
    .filter(d => d.doctor_name && d.doctor_name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(d => !availableToday || d.available_today)
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'experience') return (b.experience_years || 0) - (a.experience_years || 0);
      if (sortBy === 'name') return (a.doctor_name || "").localeCompare(b.doctor_name || "");
      return 0;
    });

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
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Our Doctors</h1>
        <p className="text-slate-500 dark:text-slate-400">View doctor profiles, search, filter, and find available appointment slots.</p>
      </header>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard 
            title="Total Doctors" 
            value={stats.doctors_count} 
            icon={Users} 
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
            title="Specialties" 
            value={stats.specializations.length} 
            icon={Filter} 
            colorClass="bg-purple-500/20 text-purple-400" 
          />
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-surface border border-border p-5 rounded-xl mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        <div className="relative w-full md:w-1/3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search doctors by name..."
            className="w-full bg-slate-100 dark:bg-slate-900 border border-border rounded-lg pl-10 pr-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-colors text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={availableToday}
              onChange={(e) => setAvailableToday(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-primary focus:ring-primary h-4 w-4"
            />
            Available Today
          </label>

          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-100 dark:bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
          >
            <option value="rating">Sort by Rating</option>
            <option value="experience">Sort by Experience</option>
            <option value="name">Sort by Name</option>
          </select>

          {stats && (
            <select 
              value={filterSpec}
              onChange={(e) => setFilterSpec(e.target.value)}
              className="bg-slate-100 dark:bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
            >
              <option value="all">All Specialties</option>
              {stats.specializations.map(spec => (
                <option key={spec} value={spec}>{formatSpecialization(spec)}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Grid */}
      {filteredDoctors.length > 0 ? (
        <DoctorGrid doctors={filteredDoctors} />
      ) : (
        <div className="text-center p-12 text-slate-400 bg-surface/30 rounded-xl border border-dashed border-border">
          <Search size={32} className="mx-auto mb-4 text-slate-500" />
          <p>No doctors found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default DoctorsPage;
