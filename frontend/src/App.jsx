import React, { useState } from 'react';
import { SentinelProvider, useSentinel } from './context/SentinelContext';
import { Navbar } from './components/Navbar';
import { DigitalTwinMap } from './components/DigitalTwinMap';
import { CameraMatrix } from './components/CameraMatrix';
import { AgenticReasoningTerminal } from './components/AgenticReasoningTerminal';
import { SimulationSandbox } from './components/SimulationSandbox';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { IncidentManager } from './components/IncidentManager';
import { StudentPWA } from './components/StudentPWA';
import { 
  ShieldAlert, 
  Users, 
  Flame, 
  TrendingUp, 
  Truck, 
  Clock, 
  Activity, 
  Radio, 
  Layers,
  Route,
  Bot,
  CheckCircle2,
  X,
  Zap
} from 'lucide-react';

const DashboardView = () => {
  const { telemetry } = useSentinel();

  const totalPop = telemetry?.crowd?.total_population || 1200;
  const maxRisk = telemetry?.max_risk_score || 0;
  const reroutedCount = telemetry?.routes?.rerouted_zones?.length || 0;
  const trappedCount = telemetry?.routes?.trapped_zones_count || 0;
  const clearanceTime = telemetry?.simulation?.estimated_full_clearance_minutes || (maxRisk > 60 ? 9.8 : maxRisk > 30 ? 6.5 : 3.2);

  const isCriticalEta = parseFloat(clearanceTime) >= 8.5;
  const isElevatedEta = parseFloat(clearanceTime) >= 5.0 && parseFloat(clearanceTime) < 8.5;

  return (
    <div className="space-y-4 font-mono">
      {/* Tactical KPI Stat Bar - Rich Vivid Operations Colors */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* KPI 1: CAMPUS DENSITY (Cyan / Blue) */}
        <div className="tactical-card p-3 rounded-xl border border-cyan-500/40 bg-gradient-to-b from-[#081938] to-[#040e20] flex flex-col justify-between shadow-[0_4px_16px_rgba(6,182,212,0.15)] hover:border-cyan-400/80 transition-all">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-cyan-300 uppercase font-mono font-semibold">Campus Density</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-xl font-black text-white font-mono">{totalPop}</span>
            <span className="text-[10px] text-cyan-300/70 font-mono">/ 850 nominal</span>
          </div>
          <div className="w-full h-1.5 bg-slate-900/90 rounded-full overflow-hidden border border-cyan-900/60">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 rounded-full shadow-[0_0_8px_#06b6d4]" 
              style={{ width: `${Math.min(100, (totalPop / 850) * 100)}%` }} 
            />
          </div>
        </div>

        {/* KPI 2: PEAK ZONE RISK (Emerald / Amber / Red) */}
        <div className={`tactical-card p-3 rounded-xl border flex flex-col justify-between transition-all ${
          maxRisk > 60 
            ? 'border-red-500/70 bg-gradient-to-b from-[#2a0914] to-[#120308] shadow-[0_4px_20px_rgba(239,68,68,0.3)]' 
            : maxRisk > 30 
              ? 'border-amber-500/60 bg-gradient-to-b from-[#2a1b08] to-[#120b03] shadow-[0_4px_16px_rgba(245,158,11,0.2)]'
              : 'border-emerald-500/50 bg-gradient-to-b from-[#082218] to-[#030e0a] shadow-[0_4px_16px_rgba(16,185,129,0.15)]'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-mono font-semibold text-slate-300">Peak Zone Risk</span>
            <Flame className={`w-4 h-4 ${maxRisk > 60 ? 'text-red-400 animate-bounce' : maxRisk > 30 ? 'text-amber-400' : 'text-emerald-400'}`} />
          </div>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className={`text-xl font-black font-mono ${maxRisk > 60 ? 'text-red-300' : maxRisk > 30 ? 'text-amber-300' : 'text-emerald-300'}`}>
              {maxRisk}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">/ 100 Max</span>
          </div>
          <div className="w-full h-1.5 bg-slate-900/90 rounded-full overflow-hidden border border-slate-800">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                maxRisk > 60 
                  ? 'bg-gradient-to-r from-red-600 to-rose-400 shadow-[0_0_10px_#ef4444]' 
                  : maxRisk > 30 
                    ? 'bg-gradient-to-r from-amber-600 to-yellow-400 shadow-[0_0_10px_#f59e0b]' 
                    : 'bg-gradient-to-r from-emerald-600 to-teal-400 shadow-[0_0_10px_#10b981]'
              }`} 
              style={{ width: `${Math.max(8, maxRisk)}%` }} 
            />
          </div>
        </div>

        {/* KPI 3: DYNAMIC REROUTES (Vivid Amber / Violet) */}
        <div className="tactical-card p-3 rounded-xl border border-amber-500/40 bg-gradient-to-b from-[#241708] to-[#100b04] flex flex-col justify-between shadow-[0_4px_16px_rgba(245,158,11,0.15)] hover:border-amber-400/80 transition-all">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-amber-300 uppercase font-mono font-semibold">A* Reroutes</span>
            <Activity className={`w-4 h-4 ${reroutedCount > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
          </div>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-xl font-black text-amber-300 font-mono">{reroutedCount}</span>
            <span className="text-[10px] text-amber-400/70 font-mono">Corridors Active</span>
          </div>
          <div className="w-full h-1.5 bg-slate-900/90 rounded-full overflow-hidden border border-amber-900/60">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500 rounded-full shadow-[0_0_8px_#f59e0b]" 
              style={{ width: `${reroutedCount > 0 ? Math.min(100, reroutedCount * 33) : 0}%` }} 
            />
          </div>
        </div>

        {/* KPI 4: CLEARANCE ETA (Dynamic Vivid Color Reaction!) */}
        <div className={`tactical-card p-3 rounded-xl border flex flex-col justify-between transition-all ${
          isCriticalEta 
            ? 'border-red-500/80 bg-gradient-to-b from-[#2e0b16] to-[#140409] shadow-[0_4px_22px_rgba(239,68,68,0.35)] animate-pulse-slow' 
            : isElevatedEta 
              ? 'border-amber-500/70 bg-gradient-to-b from-[#2b1908] to-[#120b03] shadow-[0_4px_18px_rgba(245,158,11,0.25)]'
              : 'border-emerald-500/50 bg-gradient-to-b from-[#082218] to-[#040e0b] shadow-[0_4px_16px_rgba(16,185,129,0.15)]'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-200">Clearance ETA</span>
            <Clock className={`w-4 h-4 ${isCriticalEta ? 'text-red-400 animate-spin-slow' : isElevatedEta ? 'text-amber-400' : 'text-emerald-400'}`} />
          </div>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className={`text-xl font-black font-mono tracking-tight ${isCriticalEta ? 'text-red-300' : isElevatedEta ? 'text-amber-300' : 'text-emerald-300'}`}>
              {clearanceTime}
            </span>
            <span className="text-[10px] text-slate-300 font-mono">minutes</span>
          </div>
          <div className="w-full h-1.5 bg-slate-900/90 rounded-full overflow-hidden border border-slate-800">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                isCriticalEta 
                  ? 'bg-gradient-to-r from-red-600 to-rose-400 shadow-[0_0_10px_#ef4444]' 
                  : isElevatedEta 
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_10px_#f59e0b]' 
                    : 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_#10b981]'
              }`} 
              style={{ width: `${Math.min(100, (parseFloat(clearanceTime) / 15) * 100)}%` }} 
            />
          </div>
        </div>

        {/* KPI 5: TRAPPED ALERTS (Crimson / Emerald) */}
        <div className={`tactical-card p-3 rounded-xl border flex flex-col justify-between col-span-2 sm:col-span-1 transition-all ${
          trappedCount > 0 
            ? 'border-red-600 bg-gradient-to-b from-[#340810] to-[#160307] shadow-[0_4px_22px_rgba(239,68,68,0.4)] animate-pulse' 
            : 'border-emerald-500/40 bg-gradient-to-b from-[#082218] to-[#040e0b] shadow-[0_4px_16px_rgba(16,185,129,0.15)]'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-300 uppercase font-mono font-semibold">Trapped Alerts</span>
            <ShieldAlert className={`w-4 h-4 ${trappedCount > 0 ? 'text-red-400' : 'text-emerald-400'}`} />
          </div>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className={`text-xl font-black font-mono ${trappedCount > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
              {trappedCount}
            </span>
            <span className="text-[10px] font-mono text-slate-400">{trappedCount > 0 ? 'ZONES AT RISK' : 'All Zones Safe'}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-900/90 rounded-full overflow-hidden border border-slate-800">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${trappedCount > 0 ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-emerald-500'}`} 
              style={{ width: `${trappedCount > 0 ? 100 : 100}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Main Split Layout: Digital Twin on Left (7 cols), Camera Matrix on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 7 Columns: Interactive 2.5D Campus Twin Canvas */}
        <div className="lg:col-span-7 space-y-4">
          <DigitalTwinMap />
        </div>

        {/* Right 5 Columns: CCTV AI Surveillance Matrix */}
        <div className="lg:col-span-5 space-y-4">
          <CameraMatrix />
        </div>
      </div>

      {/* Bottom Full-Width: Emergency Response & Reasoning Terminal */}
      <div>
        <AgenticReasoningTerminal />
      </div>
    </div>
  );
};

const MainContent = () => {
  const { 
    activeTab,
    setActiveTab,
    toastNotification, 
    setToastNotification,
    isAlertModalOpen,
    setIsAlertModalOpen,
    confirmPushEmergencyAlert,
    telemetry,
    selectedZone
  } = useSentinel();

  const nodes = telemetry?.digital_twin?.nodes || [];
  const activeHazard = nodes.find(n => (n.fire_intensity || 0) > 15 || (n.smoke_density || 0) > 20 || n.is_blocked || (n.risk_score || 0) >= 50) || nodes.find(n => n.id === selectedZone) || { name: 'U Block Science Labs' };
  const threatLevel = telemetry?.threat_level || 'GREEN_NORMAL';
  const isCritical = threatLevel === 'RED_CRITICAL';

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Realistic Campus Emergency Alert Dispatch Modal */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#08122c] border border-red-500/80 max-w-lg w-full rounded-2xl shadow-2xl p-5 font-mono text-xs text-slate-200 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
                <span className="font-bold text-sm text-white tracking-wider">CAMPUS EMERGENCY ALERT DISPATCH</span>
              </div>
              <button 
                onClick={() => setIsAlertModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 space-y-3">
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-600/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 uppercase text-[10px]">Emergency Classification:</span>
                  <strong className="text-red-400 text-xs uppercase">{isCritical ? 'CRITICAL THERMAL / HAZARD' : 'CAMPUS SAFETY ADVISORY'}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 uppercase text-[10px]">Location:</span>
                  <strong className="text-amber-300 text-xs">{activeHazard.name}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 uppercase text-[10px]">Threat Severity:</span>
                  <strong className="text-red-300 text-xs">{isCritical ? 'LEVEL-3 CRITICAL (Rerouting Active)' : 'LEVEL-1 NORMAL'}</strong>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Public Broadcast Instructions:</div>
                <p className="text-slate-200 leading-relaxed text-[11px]">
                  "Attention all students and faculty. Evacuate immediately through the illuminated green A* exits. Avoid {activeHazard.name} and compromised east corridors. Proceed calmly to perimeter gates."
                </p>
              </div>

              <div className="text-[10px] text-slate-400 italic">
                * Simulated alert transmission dispatches to connected mobile PWAs and appends to the live incident stream.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsAlertModalOpen(false)}
                className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmPushEmergencyAlert();
                  setActiveTab('pwa');
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold shadow-[0_0_20px_rgba(239,68,68,0.5)] transition cursor-pointer active:scale-95 flex items-center gap-2"
              >
                <Zap className="w-4 h-4 text-amber-200 animate-pulse" />
                <span>Send Alert & Open Student PWA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Push Emergency Alert Toast Notification */}
      {toastNotification && (
        <div className="fixed top-16 right-5 z-50 bg-[#08122c] border border-emerald-500/80 px-4 py-3 rounded-lg shadow-2xl font-mono flex items-start gap-3 backdrop-blur-md animate-fade-in max-w-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-xs font-bold text-white">{toastNotification.title}</div>
            <div className="text-[11px] text-slate-300 mt-0.5 leading-snug">{toastNotification.message}</div>
          </div>
          <button 
            onClick={() => setToastNotification(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'simulation' && <SimulationSandbox />}
        {activeTab === 'pwa' && <StudentPWA />}
        {activeTab === 'analytics' && <AnalyticsPanel />}
        {activeTab === 'incidents' && <IncidentManager />}
      </main>

      <footer className="border-t border-slate-800/80 bg-[#050811]/90 backdrop-blur-md py-3 text-center text-xs font-mono text-slate-500">
        <span className="text-cyan-400 font-bold">CAMPUS SENTINEL</span> • VIGNAN CAMPUS SAFETY NETWORK © 2026 • Emergency Operations &amp; Autonomous Evacuation Digital Twin
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <SentinelProvider>
      <MainContent />
    </SentinelProvider>
  );
}
