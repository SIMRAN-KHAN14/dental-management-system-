import React from 'react';
import { NavLink } from 'react-router-dom';
import { MessageSquare, Calendar, Users, Activity, Sun, Moon, Globe } from 'lucide-react';
import { useTheme } from '../utils/ThemeContext';
import { useAuth } from '../utils/AuthContext';
import { useTranslation } from 'react-i18next';

const Sidebar = () => {
  const { isDark, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const { t, i18n } = useTranslation();

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  const links = [
    { to: "/", icon: <Activity size={20} />, label: t('dashboard') },
    { to: "/chat", icon: <MessageSquare size={20} />, label: t('chat_assistant') },
    { to: "/appointments", icon: <Calendar size={20} />, label: t('appointments') },
    { to: "/doctors", icon: <Users size={20} />, label: t('doctors') },
    { to: "/admin", icon: <Activity size={20} />, label: t('analytics') },
  ];

  return (
    <aside className="w-64 h-full bg-surface border-r border-border flex flex-col transition-colors duration-200">
      <div className="p-6 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
            <Activity size={20} />
          </div>
          <h1 className="font-bold text-lg text-slate-900 dark:text-white tracking-wide">DentalAgent</h1>
        </div>
      </div>
      
      <nav className="flex-1 py-6 px-4 flex flex-col gap-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`
            }
          >
            {link.icon}
            <span className="font-medium">{link.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="px-4 py-2 flex items-center justify-between text-xs border-t border-border mt-auto">
        <div className="flex items-center gap-1 text-slate-500">
          <Globe size={14} />
          <select 
            onChange={changeLanguage} 
            value={i18n.language}
            className="bg-transparent border-none focus:ring-0 text-slate-500 dark:text-slate-400 cursor-pointer outline-none appearance-none"
          >
            <option value="en">EN</option>
            <option value="hi">HI</option>
            <option value="es">ES</option>
          </select>
        </div>
        <div className="text-slate-500">
          {t('powered_by')}
        </div>
      </div>

      <div className="p-4 border-t border-border flex items-center justify-between">
        <button 
          onClick={logout}
          className="text-xs text-rose-500 hover:text-rose-400 font-medium transition-colors"
        >
          {t('log_out')}
        </button>
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
