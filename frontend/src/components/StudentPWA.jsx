import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Compass, 
  CheckCircle2, 
  AlertTriangle, 
  PhoneCall, 
  WifiOff, 
  MapPin, 
  ArrowRight, 
  ShieldCheck, 
  Radio, 
  Flame, 
  BookOpen,
  Volume2,
  Building2,
  HelpCircle,
  Clock,
  ExternalLink,
  Info
} from 'lucide-react';
import { useSentinel } from '../context/SentinelContext';

export const StudentPWA = () => {
  const { 
    telemetry, 
    submitSafetyCheckin, 
    playAudioSiren 
  } = useSentinel();

  const [isPwaOffline, setIsPwaOffline] = useState(!navigator.onLine);
  const [offlineToast, setOfflineToast] = useState(null);
  const [currentZone, setCurrentZone] = useState('BLOCK_B_L1');
  const [userName, setUserName] = useState('Alex Rivera (ID: 2026-CS-419)');
  const [checkinSuccess, setCheckinSuccess] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState('route'); // 'route' | 'status' | 'instructions' | 'contacts'
  const [activeInstructionScenario, setActiveInstructionScenario] = useState('FIRE');

  // Monitor network online/offline state specifically for Student PWA
  useEffect(() => {
    const handleOnline = () => {
      setIsPwaOffline(false);
      setOfflineToast("CONNECTION RESTORED • Live Telemetry Reconnected");
      setTimeout(() => setOfflineToast(null), 4000);
    };
    const handleOffline = () => {
      setIsPwaOffline(true);
      setOfflineToast("OFFLINE — Using Cached Campus Safety Guidance");
      setTimeout(() => setOfflineToast(null), 4000);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const digitalTwin = telemetry?.digital_twin || { nodes: [] };
  const nodes = digitalTwin.nodes || [];
  const routesByZone = telemetry?.routes?.routes_by_zone || {};
  const currentRoute = routesByZone[currentZone] || {
    exit_name: "Main Gate (North)",
    estimated_time_seconds: 45,
    path: [currentZone, "CORRIDOR_NORTH", "EXIT_NORTH_GATE"],
    steps: ["Follow designated green corridor north", "Exit via Main Gate (North)"],
    status: "OPTIMAL"
  };
  const currentRisk = telemetry?.risks?.zone_risk_matrix?.[currentZone] || { risk_score: 0 };
  const threatLevel = telemetry?.threat_level || 'GREEN_NORMAL';
  const isEmergencyActive = threatLevel === 'RED_CRITICAL' || threatLevel === 'ORANGE_HIGH_ALERT' || (currentRisk.risk_score || 0) >= 40;

  const handleSafeCheckin = async () => {
    await submitSafetyCheckin(userName, currentZone, "SAFE", "Checked in safe via Sentinel Student PWA client.");
    setCheckinSuccess(true);
    setTimeout(() => setCheckinSuccess(false), 4000);
  };

  const handleSosBeacon = async () => {
    playAudioSiren();
    await submitSafetyCheckin(userName, currentZone, "SOS_NEED_HELP", "URGENT: Trapped or requiring medical assistance!");
    setSosSent(true);
    setTimeout(() => setSosSent(false), 5000);
  };

  const isTrapped = currentRoute?.status === 'TRAPPED_NO_PATH';
  const hasFireNearby = (currentRisk.risk_score || 0) >= 50;

  // Emergency safety instructions repository
  const emergencyInstructions = {
    FIRE: [
      "Stay low to the floor beneath smoke plumes.",
      "Feel door surfaces and handles before opening.",
      "Follow green floor arrows to the nearest verified open exit.",
      "Do NOT use elevators. Use designated stairwells.",
      "Muster at North/East perimeter gates."
    ],
    BLAST: [
      "Drop to the ground and protect your head and neck immediately.",
      "Stay clear of external glass façades and light fixtures.",
      "Check surroundings for structural hazards before moving.",
      "Evacuate outward toward open perimeter gates."
    ],
    SMOKE: [
      "Cover nose and mouth with cloth or clothing.",
      "Crawl along illuminated corridor paths where air is cleanest.",
      "Avoid closed stairwells where dense smoke accumulates.",
      "Proceed directly to exterior exit muster gates."
    ],
    CROWD: [
      "Move with the general flow rather than fighting against it.",
      "Keep elbows bent and hands near your chest for breathing room.",
      "Stay clear of narrow bottlenecks and locked exit gates.",
      "Divert to designated secondary evacuation corridors."
    ],
    MEDICAL: [
      "Keep the patient calm and still. Do NOT move unless in direct danger.",
      "Press the red SOS Beacon below to dispatch campus ambulance.",
      "Clear a 3-meter perimeter for incoming medical responders.",
      "Direct arriving responders via East/North corridor."
    ]
  };

  return (
    <div className="max-w-md mx-auto space-y-3 font-mono">
      {/* Offline Status Toast */}
      {offlineToast && (
        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs flex items-center justify-between shadow-lg animate-fade-in">
          <span>{offlineToast}</span>
          <button onClick={() => setOfflineToast(null)} className="text-slate-400 hover:text-white font-bold ml-2">✕</button>
        </div>
      )}

      {/* Mobile Device Frame with Vibrant Emerald & Cyan Accents */}
      <div className="tactical-card rounded-2xl p-4 border border-emerald-500/50 bg-gradient-to-b from-[#07172e] to-[#040e1e] shadow-[0_10px_35px_rgba(16,185,129,0.2)] space-y-3 relative overflow-hidden">
        {/* Top Status & PWA Offline Mode Toggle */}
        <div className="flex items-center justify-between border-b border-emerald-900/60 pb-2.5">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isPwaOffline ? 'bg-amber-400' : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'}`} />
            <div>
              <span className="text-xs font-extrabold tracking-wider text-white flex items-center gap-1.5">
                CAMPUS SENTINEL
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-semibold">PWA</span>
              </span>
              <span className="text-[9px] text-emerald-300/80 block font-normal">Student Mobile Safety Network</span>
            </div>
          </div>

          {/* Student PWA Online/Offline Switch */}
          <button
            onClick={() => setIsPwaOffline(!isPwaOffline)}
            className={`px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1 font-bold border transition cursor-pointer active:scale-95 ${
              isPwaOffline 
                ? 'bg-amber-950 border-amber-500 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]' 
                : 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
            }`}
            title="Toggle PWA Simulated Network Connection"
          >
            {isPwaOffline ? <WifiOff className="w-3 h-3 text-amber-400" /> : <Radio className="w-3 h-3 text-emerald-400" />}
            <span>{isPwaOffline ? "OFFLINE" : "LIVE SYNC"}</span>
          </button>
        </div>

        {/* Offline Evacuation Mode Banner */}
        {isPwaOffline && (
          <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-500/80 text-amber-200 text-xs flex items-start gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold text-[11px] text-white">OFFLINE — LAST KNOWN CAMPUS STATUS</div>
              <div className="text-[10px] text-amber-300/90 leading-tight">
                Operating in offline resilience mode with cached evacuation paths and local emergency contacts.
              </div>
            </div>
          </div>
        )}

        {/* Emergency Alert Banner (when incident active) */}
        {isEmergencyActive && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-red-950 via-rose-950 to-red-900 border border-red-500 text-white space-y-2 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse-slow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
                <span className="font-extrabold text-xs text-red-200 tracking-wide">ACTIVE CAMPUS EMERGENCY</span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded bg-red-600 text-white font-bold tracking-wider shadow">EVACUATE</span>
            </div>
            <p className="text-[11px] text-slate-100 leading-snug">
              Hazard detected in campus sector. Follow illuminated green corridors to designated exit immediately.
            </p>
            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-red-800/80 text-slate-200">
              <span>Exit: <strong className="text-emerald-300 font-extrabold">{currentRoute?.exit_name || 'Main North Gate'}</strong></span>
              <span>ETA: <strong className="text-white font-extrabold">{currentRoute?.estimated_time_seconds || 45}s</strong></span>
            </div>
          </div>
        )}

        {/* Location Selector */}
        <div className="bg-[#051124] p-2.5 rounded-xl border border-blue-900/60">
          <label className="text-[10px] text-blue-300 uppercase font-semibold block mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-400" />
              Your Current Location:
            </span>
            <span className="text-slate-400 font-mono text-[9px]">{userName}</span>
          </label>
          <select
            value={currentZone}
            onChange={(e) => setCurrentZone(e.target.value)}
            className="w-full bg-[#081730] border border-blue-700/60 rounded-lg p-2 text-xs text-white font-bold font-mono focus:border-cyan-400 outline-none cursor-pointer"
          >
            {nodes.filter(n => !n.is_exit).map(n => (
              <option key={n.id} value={n.id}>
                {n.name} — Floor {n.floor} (Risk: {n.risk_score || 0}/100)
              </option>
            ))}
          </select>
        </div>

        {/* Sub-Navigation Tabs: Route | Building Status | Emergency Instructions | Contacts */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-[#051124] rounded-lg border border-blue-900/60 text-[10px] text-center font-bold">
          <button
            onClick={() => setActiveGuideTab('route')}
            className={`py-1.5 rounded transition cursor-pointer ${
              activeGuideTab === 'route' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow' : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            Live Route
          </button>
          <button
            onClick={() => setActiveGuideTab('status')}
            className={`py-1.5 rounded transition cursor-pointer ${
              activeGuideTab === 'status' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow' : 'text-slate-400 hover:text-blue-300'
            }`}
          >
            Buildings
          </button>
          <button
            onClick={() => setActiveGuideTab('instructions')}
            className={`py-1.5 rounded transition cursor-pointer ${
              activeGuideTab === 'instructions' ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow' : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            Safety Steps
          </button>
          <button
            onClick={() => setActiveGuideTab('contacts')}
            className={`py-1.5 rounded transition cursor-pointer ${
              activeGuideTab === 'contacts' ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow' : 'text-slate-400 hover:text-red-300'
            }`}
          >
            Hotlines
          </button>
        </div>

        {/* Tab 1: Live Evacuation Route */}
        {activeGuideTab === 'route' && (
          <div className={`p-3.5 rounded-xl border transition-all ${
            isTrapped 
              ? 'bg-red-950/70 border-red-600'
              : hasFireNearby
              ? 'bg-amber-950/70 border-amber-600'
              : 'bg-[#0b182b] border-slate-700'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-blue-400" />
                OPTIMAL EVACUATION ROUTE
              </span>
              <span className={`text-[9.5px] px-2 py-0.5 rounded font-bold ${
                isTrapped ? 'bg-red-900 text-white' : 'bg-emerald-900/80 text-emerald-300 border border-emerald-700'
              }`}>
                {isTrapped ? 'BLOCKED' : 'ROUTE VERIFIED'}
              </span>
            </div>

            {currentRoute && currentRoute.status === 'OPTIMAL' ? (
              <div className="space-y-2.5">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Designated Exit Gate:</div>
                  <div className="text-sm font-extrabold text-white flex items-center gap-1.5 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {currentRoute.exit_name}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs py-1">
                  <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                    <div className="text-[9px] text-slate-400 uppercase">Est. Escape Time</div>
                    <div className="text-emerald-400 font-bold text-sm">{currentRoute.estimated_time_seconds}s</div>
                  </div>
                  <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                    <div className="text-[9px] text-slate-400 uppercase">Distance to Exit</div>
                    <div className="text-blue-400 font-bold text-sm">{currentRoute.distance_meters || 180}m</div>
                  </div>
                </div>

                {/* Step-by-Step Waypoint Guidance */}
                <div className="space-y-1 pt-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Waypoint Guidance:</div>
                  <div className="space-y-1 text-xs">
                    {currentRoute.steps?.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-slate-900/90 p-2 rounded border border-slate-800 text-slate-200">
                        <span className="w-4 h-4 rounded bg-slate-800 text-blue-400 border border-slate-700 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-[11px] leading-snug">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-2">
                <AlertTriangle className="w-7 h-7 text-red-400 mx-auto" />
                <div className="text-xs font-bold text-red-300 uppercase">Direct Egress Corridor Blocked</div>
                <p className="text-[11px] text-slate-300">
                  Immediate corridor is compromised. Shelter in place, close doors, and activate the SOS Distress Beacon below.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Building Status Matrix */}
        {activeGuideTab === 'status' && (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
              <span>Campus Sector Status:</span>
              <span className="text-blue-400">Live Telemetry</span>
            </div>

            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {nodes.filter(n => !n.is_exit).slice(0, 6).map((node) => {
                const isHazard = (node.fire_intensity || 0) > 15 || (node.risk_score || 0) >= 50 || node.is_blocked;
                const isWarn = (node.smoke_density || 0) > 20 || (node.risk_score || 0) >= 20;

                const statusLabel = isHazard ? 'EVACUATE' : isWarn ? 'WARNING' : 'SAFE / CLEAR';
                const statusColor = isHazard 
                  ? 'bg-red-950 text-red-300 border-red-700' 
                  : isWarn 
                  ? 'bg-amber-950 text-amber-300 border-amber-700' 
                  : 'bg-emerald-950 text-emerald-300 border-emerald-700';

                return (
                  <div key={node.id} className="p-2 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-[11px]">{node.name}</div>
                      <div className="text-[9px] text-slate-400">Occ: {node.current_occupancy} • Risk: {node.risk_score || 0}/100</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Actionable Safety Instructions */}
        {activeGuideTab === 'instructions' && (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Emergency Protocol Guidance:</span>
              <select
                value={activeInstructionScenario}
                onChange={(e) => setActiveInstructionScenario(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-[10px] text-white font-bold outline-none cursor-pointer"
              >
                <option value="FIRE">Fire Protocol</option>
                <option value="BLAST">Blast Protocol</option>
                <option value="SMOKE">Smoke Protocol</option>
                <option value="CROWD">Crowd Surge Protocol</option>
                <option value="MEDICAL">Medical Protocol</option>
              </select>
            </div>

            <div className="space-y-1.5 text-[11px]">
              {emergencyInstructions[activeInstructionScenario]?.map((instr, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-slate-900 p-2 rounded border border-slate-800 text-slate-200">
                  <span className="w-4 h-4 rounded bg-slate-800 text-amber-400 border border-slate-700 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{instr}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Emergency Contacts */}
        {activeGuideTab === 'contacts' && (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
              <span>Campus Emergency Dispatch:</span>
              <span className="text-emerald-400">24/7 Monitored</span>
            </div>

            <div className="grid grid-cols-1 gap-1.5 text-[11px]">
              <a href="tel:5555" className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-200 hover:border-slate-700 flex items-center justify-between">
                <span>Campus Security &amp; Operations:</span>
                <strong className="text-blue-400">Ext 5555</strong>
              </a>
              <a href="tel:5556" className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-200 hover:border-slate-700 flex items-center justify-between">
                <span>University Medical Bay:</span>
                <strong className="text-emerald-400">Ext 5556</strong>
              </a>
              <a href="tel:5557" className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-200 hover:border-slate-700 flex items-center justify-between">
                <span>Emergency Incident Commander:</span>
                <strong className="text-amber-400">Ext 5557</strong>
              </a>
              <a href="tel:101" className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-200 hover:border-slate-700 flex items-center justify-between">
                <span>City Fire &amp; Rescue Service:</span>
                <strong className="text-red-400">Ext 101</strong>
              </a>
            </div>
          </div>
        )}

        {/* Action Buttons: "I Am Safe" & "SOS Beacon" */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleSafeCheckin}
            className="py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs transition flex flex-col items-center justify-center gap-1 shadow cursor-pointer active:scale-95"
          >
            <ShieldCheck className="w-4 h-4 text-slate-950" />
            {checkinSuccess ? "STATUS CONFIRMED! ✅" : "I AM SAFE"}
          </button>

          <button
            onClick={handleSosBeacon}
            className="py-2.5 px-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs transition flex flex-col items-center justify-center gap-1 shadow cursor-pointer active:scale-95"
          >
            <Volume2 className="w-4 h-4" />
            {sosSent ? "SOS BEACON ACTIVE 🚨" : "SOS DISTRESS BEACON"}
          </button>
        </div>
      </div>
    </div>
  );
};

