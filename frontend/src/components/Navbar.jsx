import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  Cpu, 
  BarChart3, 
  AlertTriangle,
  PlaySquare,
  Clock
} from 'lucide-react';
import { useSentinel } from '../context/SentinelContext';

export const Navbar = ({ activeTab, setActiveTab }) => {
  const { 
    telemetry, 
    isAudioMuted, 
    setIsAudioMuted 
  } = useSentinel();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const threatLevel = telemetry?.threat_level || 'GREEN_NORMAL';

  const getThreatBadge = () => {
    switch (threatLevel) {
      case 'RED_CRITICAL':
        return {
          bg: 'bg-red-950/80 border-red-500 text-red-400 animate-pulse',
          dot: 'bg-red-500 animate-ping',
          text: 'CRITICAL HAZARD - EVACUATE'
        };
      case 'ORANGE_HIGH_ALERT':
        return {
          bg: 'bg-amber-950/80 border-amber-500 text-amber-400',
          dot: 'bg-amber-500',
          text: 'HIGH ALERT - CORRIDOR REPLAN'
        };
      case 'YELLOW_ELEVATED':
        return {
          bg: 'bg-yellow-950/80 border-yellow-500 text-yellow-400',
          dot: 'bg-yellow-500',
          text: 'ELEVATED - SURVEILLANCE'
        };
      default:
        return {
          bg: 'bg-emerald-950/80 border-emerald-500 text-emerald-400',
          dot: 'bg-emerald-500',
          text: 'CAMPUS NOMINAL'
        };
    }
  };

  const badge = getThreatBadge();

  return (
    <header className="sticky top-0 z-50 bg-[#070d19]/95 backdrop-blur-md border-b border-slate-800 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left Branding */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="relative p-2 rounded-lg bg-slate-900 border border-slate-700 text-blue-400">
              <ShieldAlert className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-wider text-white">CAMPUS</span>
                <span className="font-extrabold text-base tracking-wider text-blue-400">SENTINEL</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700 font-bold">Control Center</span>
              </div>
              <p className="text-[10.5px] text-slate-400 font-mono tracking-tight flex items-center gap-2">
                <span>Autonomous Evacuation Twin</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">Emergency Operations</span>
              </p>
            </div>
          </div>

          {/* Mobile Threat Indicator */}
          <div className="md:hidden">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold border ${badge.bg}`}>
              <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
              {threatLevel.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Navigation Tabs with Rich Distinct Colors */}
        <nav className="flex items-center gap-1.5 bg-[#071026] p-1.5 rounded-xl border border-blue-900/60 text-xs font-mono w-full md:w-auto overflow-x-auto shadow-inner">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-extrabold border border-cyan-400/80 shadow-[0_0_14px_rgba(6,182,212,0.4)]'
                : 'text-slate-300 hover:text-white hover:bg-blue-950/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Command Center
          </button>

          <button
            onClick={() => setActiveTab('simulation')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'simulation'
                ? 'bg-gradient-to-r from-amber-600 to-purple-600 text-white font-extrabold border border-amber-400/80 shadow-[0_0_14px_rgba(245,158,11,0.4)]'
                : 'text-slate-300 hover:text-amber-300 hover:bg-amber-950/40'
            }`}
          >
            <PlaySquare className="w-3.5 h-3.5" />
            What-If Sandbox
          </button>

          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'pwa'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold border border-emerald-400/80 shadow-[0_0_14px_rgba(16,185,129,0.4)]'
                : 'text-slate-300 hover:text-emerald-300 hover:bg-emerald-950/40'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Student PWA
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white font-extrabold border border-indigo-400/80 shadow-[0_0_14px_rgba(99,102,241,0.4)]'
                : 'text-slate-300 hover:text-indigo-300 hover:bg-indigo-950/40'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Analytics
          </button>

          <button
            onClick={() => setActiveTab('incidents')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'incidents'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold border border-red-400/80 shadow-[0_0_14px_rgba(239,68,68,0.4)]'
                : 'text-slate-300 hover:text-red-300 hover:bg-red-950/40'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Incident Logs
          </button>
        </nav>

        {/* Right Status & Controls */}
        <div className="hidden md:flex items-center gap-2 font-mono text-xs relative">
          {/* Threat Status Badge */}
          <div className={`flex items-center gap-2 px-2.5 py-1 rounded-md border text-xs font-bold ${badge.bg}`}>
            <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
            <span>{badge.text}</span>
          </div>

          {/* Audio Siren Toggle */}
          <button
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            title={isAudioMuted ? "Unmute Siren" : "Mute Siren"}
            className="p-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
          </button>

          {/* Live Clock */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-white">{timeStr || '00:00:00'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

