import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
  Legend
} from 'recharts';
import { Activity, Users, Calendar, TrendingDown, Loader2 } from 'lucide-react';
import api from '../utils/api';

const COLORS = ['#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444'];

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass }) => (
  <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-lg ${colorClass}`}>
        <Icon size={24} />
      </div>
    </div>
    <div>
      <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{value}</div>
      <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</div>
      {subtitle && <div className="text-xs text-slate-400 mt-1">{subtitle}</div>}
    </div>
  </div>
);

const AdminPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/api/admin/analytics');
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
        setError("Failed to load analytics dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-7xl mx-auto w-full">
        <div className="bg-rose-500/10 text-rose-500 p-4 rounded-lg">{error || "No data available."}</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Analytics Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400">Clinic performance and appointment insights.</p>
      </header>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Bookings (30 Days)" 
          value={data.trend.reduce((acc, curr) => acc + curr.bookings, 0)} 
          icon={Calendar} 
          colorClass="bg-blue-500/20 text-blue-500" 
        />
        <StatCard 
          title="Cancellation Rate" 
          value={`${data.cancellation_rate}%`} 
          subtitle="Compared to last month"
          icon={TrendingDown} 
          colorClass="bg-rose-500/20 text-rose-500" 
        />
        <StatCard 
          title="Active Doctors" 
          value={data.top_doctors.length} 
          icon={Users} 
          colorClass="bg-primary/20 text-primary" 
        />
        <StatCard 
          title="Total Specializations" 
          value={data.specializations.length} 
          icon={Activity} 
          colorClass="bg-purple-500/20 text-purple-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Bookings Trend */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Bookings Trend (Last 30 Days)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#fff' }}
                  itemStyle={{ color: '#14B8A6' }}
                />
                <Line type="monotone" dataKey="bookings" stroke="#14B8A6" strokeWidth={3} dot={{ r: 4, fill: '#14B8A6' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Peak Appointment Hours</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.peak_hours} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(51, 65, 85, 0.4)' }}
                  contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#fff' }}
                />
                <Bar dataKey="appointments" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Specialization Breakdown */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm lg:col-span-1">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Appointments by Specialization</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.specializations}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.specializations.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Doctors Table */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Top Performing Doctors</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800 border-b border-border">
                <tr>
                  <th className="px-6 py-3 rounded-tl-lg">Doctor Name</th>
                  <th className="px-6 py-3 text-right rounded-tr-lg">Appointments Booked</th>
                </tr>
              </thead>
              <tbody>
                {data.top_doctors.map((doc, idx) => (
                  <tr key={idx} className="border-b border-border last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {doc.name.replace("Dr. ", "").charAt(0)}
                      </div>
                      {doc.name}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {doc.appointments}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.top_doctors.length === 0 && (
              <div className="text-center py-6 text-slate-500">No doctors data available.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
