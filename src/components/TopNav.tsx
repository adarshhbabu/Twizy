import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  PhoneCall,
  Users,
  Sliders,
  Moon,
  Sun,
  Clock,
  Calendar,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { getIndiaTimeString } from '../utils/demoData';

interface TopNavProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  activeTab: 'chat' | 'timeline';
  onTabChange: (tab: 'chat' | 'timeline') => void;
  onOpenContacts: () => void;
  onOpenPreferences: () => void;
  onSimulateCall: () => void;
  todayEventCount: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  darkMode,
  onToggleDarkMode,
  activeTab,
  onTabChange,
  onOpenContacts,
  onOpenPreferences,
  onSimulateCall,
  todayEventCount,
}) => {
  const [indiaTime, setIndiaTime] = useState(getIndiaTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setIndiaTime(getIndiaTimeString());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="border-b border-neutral-800 bg-neutral-950 px-4 py-3 flex items-center justify-between text-neutral-100 select-none z-20 sticky top-0">
      {/* Left: Branding & Tagline */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 p-0.5 shadow-lg shadow-emerald-950/40 flex items-center justify-center shrink-0">
          <div className="w-full h-full rounded-[14px] bg-neutral-950 flex items-center justify-center">
            <span className="font-extrabold text-base tracking-tighter text-transparent bg-clip-text bg-gradient-to-tr from-emerald-400 to-teal-200">
              TZ
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight text-white font-sans">
              Twizy
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              AI Co-pilot
            </span>
          </div>
          <p className="text-xs text-neutral-400 hidden sm:block">
            "Your calendar remembers. Your buddy reacts."
          </p>
        </div>
      </div>

      {/* Center: Mobile Tabs switch */}
      <div className="flex md:hidden items-center bg-neutral-900 p-1 rounded-2xl border border-neutral-800">
        <button
          onClick={() => onTabChange('chat')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'chat'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat</span>
        </button>
        <button
          onClick={() => onTabChange('timeline')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'timeline'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Timeline ({todayEventCount})</span>
        </button>
      </div>

      {/* Right: Clock & Action controls */}
      <div className="flex items-center gap-2">
        {/* India Time clock */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-300">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>{indiaTime} IST</span>
          <span className="text-[10px] text-neutral-500 font-sans">(Asia/Calcutta)</span>
        </div>

        {/* Demo stage trigger */}
        <button
          onClick={onSimulateCall}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-semibold transition-all cursor-pointer"
          title="Simulate Fake Call wake-up alert"
        >
          <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
          <span>Simulate call</span>
        </button>

        {/* Contacts */}
        <button
          onClick={onOpenContacts}
          className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors cursor-pointer"
          title="Student Contacts Directory"
        >
          <Users className="w-4 h-4" />
        </button>

        {/* Routine Preferences */}
        <button
          onClick={onOpenPreferences}
          className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors cursor-pointer"
          title="Student Routine Preferences"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors cursor-pointer"
          title={darkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
