import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Flame, 
  Users, 
  AlertTriangle, 
  Eye, 
  Video, 
  Minimize2, 
  Wind,
  Zap,
  Activity,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useSentinel } from '../context/SentinelContext';

export const CameraMatrix = () => {
  const { telemetry, setSelectedZone, activeScenario } = useSentinel();
  const [selectedCam, setSelectedCam] = useState(null);
  const [frameTick, setFrameTick] = useState(0);
  const [nightVisionMode, setNightVisionMode] = useState(false);
  const [blastFlashKey, setBlastFlashKey] = useState(0);

  // Auto refresh frame snapshots every 2 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setFrameTick(t => t + 1);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Trigger brief blast flash whenever blast scenario is activated
  useEffect(() => {
    if (activeScenario === 'blast_explosion') {
      setBlastFlashKey(k => k + 1);
    }
  }, [activeScenario]);

  const rawCameras = telemetry?.vision || {};
  const digitalTwinNodes = telemetry?.digital_twin?.nodes || [];
  const nodeRiskMap = {};
  digitalTwinNodes.forEach(n => {
    nodeRiskMap[n.id] = n;
  });

  // Nominal baseline camera definitions
  const defaultCameras = {
    "CAM_01": { id: "CAM_01", code: "CAM 01", name: "CAM 01 — Quadrangle", zone_id: "QUADRANGLE", person_count: 28 },
    "CAM_02": { id: "CAM_02", code: "CAM 02", name: "CAM 02 — Central Library", zone_id: "LIBRARY", person_count: 18 },
    "CAM_03": { id: "CAM_03", code: "CAM 03", name: "CAM 03 — Science Block", zone_id: "BLOCK_B_L1", person_count: 14 },
    "CAM_04": { id: "CAM_04", code: "CAM 04", name: "CAM 04 — Student Cafeteria", zone_id: "CAFETERIA", person_count: 35 },
    "CAM_05": { id: "CAM_05", code: "CAM 05", name: "CAM 05 — Academic Block A", zone_id: "STAIR_A", person_count: 6 },
    "CAM_06": { id: "CAM_06", code: "CAM 06", name: "CAM 06 — East Perimeter Gate", zone_id: "EXIT_EAST_GATE", person_count: 2 }
  };

  // Merge with backend telemetry and scenario-specific visual states
  const cameraList = Object.keys(defaultCameras).map((k, idx) => {
    const def = defaultCameras[k];
    const liveVision = rawCameras[k] || Object.values(rawCameras).find(c => c.zone_id === def.zone_id);
    const liveNode = nodeRiskMap[def.zone_id];

    // Determine exact scenario mode for this specific camera feed
    let visualMode = 'NORMAL';

    if (activeScenario === 'blast_explosion' && (def.zone_id === 'BLOCK_B_L1' || def.id === 'CAM_03')) {
      visualMode = 'BLAST';
    } else if ((activeScenario === 'fire_science_block' || activeScenario === 'fire_emergency') && (def.zone_id === 'BLOCK_B_L1' || def.id === 'CAM_03')) {
      visualMode = 'FIRE';
    } else if ((activeScenario === 'library_smoke_blockage' || activeScenario === 'smoke_detected') && (def.zone_id === 'LIBRARY' || def.id === 'CAM_02')) {
      visualMode = 'SMOKE';
    } else if ((activeScenario === 'gate_north_blocked' || activeScenario === 'blocked_exit') && (def.zone_id === 'EXIT_EAST_GATE' || def.id === 'CAM_06')) {
      visualMode = 'BLOCKED';
    } else if ((activeScenario === 'auditorium_surge_fire' || activeScenario === 'crowd_surge') && (def.zone_id === 'CAFETERIA' || def.id === 'CAM_04')) {
      visualMode = 'CROWD_SURGE';
    } else if (activeScenario === 'medical_emergency' && (def.zone_id === 'CAFETERIA' || def.id === 'CAM_04')) {
      visualMode = 'MEDICAL';
    } else if (activeScenario === 'building_evacuation' && (def.zone_id === 'STAIR_A' || def.id === 'CAM_05')) {
      visualMode = 'EVACUATION';
    } else if (activeScenario === 'multi_point_disaster') {
      if (def.id === 'CAM_03') visualMode = 'FIRE';
      else if (def.id === 'CAM_02') visualMode = 'SMOKE';
      else if (def.id === 'CAM_05') visualMode = 'EVACUATION';
      else if (def.id === 'CAM_06') visualMode = 'BLOCKED';
    } else if (!activeScenario && liveNode) {
      // Dynamic fallback based on manual node hazard injection
      if (liveNode.fire_intensity > 15) visualMode = 'FIRE';
      else if (liveNode.smoke_density > 20) visualMode = 'SMOKE';
      else if (liveNode.is_blocked) visualMode = 'BLOCKED';
      else if (liveNode.current_occupancy >= 350) visualMode = 'CROWD_SURGE';
    }

    const hasFire = visualMode === 'FIRE';
    const hasSmoke = visualMode === 'SMOKE';
    const isBlocked = visualMode === 'BLOCKED';
    const isBlast = visualMode === 'BLAST';
    const isCrowd = visualMode === 'CROWD_SURGE';
    const isMedical = visualMode === 'MEDICAL';
    const isEvac = visualMode === 'EVACUATION';

    // Natural occupancy fluctuation for normal cameras
    const naturalFluctuation = (frameTick % 2 === 0 ? 1 : -1) * ((idx % 3 === 0) ? 1 : 0);
    let displayCount = Math.max(1, def.person_count + naturalFluctuation);
    if (isCrowd) displayCount = 450;
    else if (isEvac) displayCount = 300;
    else if (isMedical) displayCount = 12;
    else if (hasFire || isBlast) displayCount = 6;
    else if (liveNode?.current_occupancy) displayCount = Math.max(1, liveNode.current_occupancy + naturalFluctuation);

    return {
      ...def,
      visualMode,
      person_count: displayCount,
      has_fire: hasFire,
      has_smoke: hasSmoke,
      is_blocked: isBlocked,
      is_blast: isBlast,
      is_crowd: isCrowd,
      is_medical: isMedical,
      is_evacuation: isEvac,
      risk_score: liveNode?.risk_score || 0
    };
  });

  return (
    <div className="tactical-card rounded-xl p-3.5 border border-sentinel-border bg-[#0a0f1d]/90 flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-cyan-950/80 border border-cyan-700/50 text-cyan-400">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
              LIVE CCTV SURVEILLANCE MATRIX
            </h3>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800 text-[10px] font-semibold">
            6 Camera Feeds Active
          </span>
          <button
            onClick={() => setNightVisionMode(!nightVisionMode)}
            className={`px-2 py-0.5 rounded border transition flex items-center gap-1 text-[10px] cursor-pointer ${
              nightVisionMode 
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-semibold' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Eye className="w-3 h-3" />
            {nightVisionMode ? "Night Mode" : "Normal CCTV"}
          </button>
        </div>
      </div>

      {/* Camera Grid (3 Columns x 2 Rows) */}
      <div className="grid grid-cols-3 gap-2 flex-1 overflow-y-auto">
        {cameraList.map((cam) => {
          const mode = cam.visualMode;
          const isEmergency = mode !== 'NORMAL';

          const cardBorderClass = 
            mode === 'FIRE' ? 'border-red-500/90 shadow-[0_0_20px_rgba(239,68,68,0.5)] bg-red-950/30' :
            mode === 'BLAST' ? 'border-amber-500 shadow-[0_0_22px_rgba(245,158,11,0.6)] bg-stone-950/50' :
            mode === 'SMOKE' ? 'border-slate-500/90 shadow-[0_0_15px_rgba(100,116,139,0.4)] bg-slate-900/40' :
            mode === 'BLOCKED' ? 'border-amber-500/80 bg-amber-950/20' :
            mode === 'CROWD_SURGE' ? 'border-purple-500/90 shadow-[0_0_15px_rgba(168,85,247,0.4)] bg-purple-950/25' :
            mode === 'MEDICAL' ? 'border-blue-500/90 shadow-[0_0_15px_rgba(59,130,246,0.3)] bg-blue-950/20' :
            mode === 'EVACUATION' ? 'border-emerald-500/90 shadow-[0_0_15px_rgba(16,185,129,0.3)] bg-emerald-950/20' :
            'border-slate-800 hover:border-cyan-500/50';

          const titleColorClass =
            mode === 'FIRE' || mode === 'BLAST' ? 'text-red-400 font-bold' :
            mode === 'SMOKE' || mode === 'BLOCKED' ? 'text-amber-400 font-bold' :
            mode === 'CROWD_SURGE' ? 'text-purple-300 font-bold' :
            mode === 'MEDICAL' ? 'text-blue-300 font-bold' :
            mode === 'EVACUATION' ? 'text-emerald-300 font-bold' :
            'text-cyan-300';

          return (
            <div
              key={cam.id}
              onClick={() => {
                setSelectedZone(cam.zone_id);
                setSelectedCam(cam);
              }}
              className={`group relative rounded-lg overflow-hidden border transition-all duration-200 cursor-pointer flex flex-col justify-between p-2 bg-[#070d18] ${cardBorderClass}`}
            >
              {/* Top Camera Status Bar */}
              <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                <span className={`truncate max-w-[95px] ${titleColorClass}`}>
                  {cam.name}
                </span>
                <span className="text-slate-500 text-[9px]">30 FPS</span>
              </div>

              {/* CCTV Feed Viewport */}
              <div className={`relative h-24 my-1 rounded border overflow-hidden flex flex-col items-center justify-center ${
                mode === 'FIRE' ? 'border-red-600/80 bg-gradient-to-t from-red-950 via-orange-950/70 to-slate-950' :
                mode === 'BLAST' ? 'border-amber-600/80 bg-gradient-to-t from-stone-900 via-amber-950/50 to-slate-950' :
                mode === 'SMOKE' ? 'border-slate-600 bg-gradient-to-t from-slate-900 via-slate-800 to-slate-950' :
                mode === 'BLOCKED' ? 'border-amber-600/70 bg-gradient-to-t from-amber-950/40 via-slate-900 to-slate-950' :
                mode === 'CROWD_SURGE' ? 'border-purple-600/80 bg-gradient-to-t from-purple-950/60 via-slate-900 to-slate-950' :
                mode === 'MEDICAL' ? 'border-blue-600/70 bg-gradient-to-t from-blue-950/50 via-slate-900 to-slate-950' :
                mode === 'EVACUATION' ? 'border-emerald-600/70 bg-gradient-to-t from-emerald-950/50 via-slate-900 to-slate-950' :
                nightVisionMode ? 'border-emerald-900 bg-[#041a0d]' : 'border-slate-800/80 bg-[#0e0c08]'
              }`}>
                
                {/* 3D Perspective Hallway Background Vector */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 65" preserveAspectRatio="none">
                  {/* Perspective Walls, Floor and Ceiling */}
                  <polygon 
                    points="0,0 35,18 35,48 0,65" 
                    fill={mode === 'FIRE' ? '#4a1111' : mode === 'BLAST' ? '#331c12' : mode === 'SMOKE' ? '#1f2937' : nightVisionMode ? '#0a2e16' : '#1c1610'} 
                    opacity="0.85" 
                  />
                  <polygon 
                    points="100,0 65,18 65,48 100,65" 
                    fill={mode === 'FIRE' ? '#4a1111' : mode === 'BLAST' ? '#331c12' : mode === 'SMOKE' ? '#1f2937' : nightVisionMode ? '#0a2e16' : '#1c1610'} 
                    opacity="0.85" 
                  />
                  <polygon 
                    points="0,0 100,0 65,18 35,18" 
                    fill={mode === 'FIRE' ? '#2e0a0a' : mode === 'BLAST' ? '#221008' : nightVisionMode ? '#061a0d' : '#16110c'} 
                    opacity="0.9" 
                  />
                  <polygon 
                    points="35,18 65,18 65,48 35,48" 
                    fill={mode === 'FIRE' ? '#200808' : mode === 'BLAST' ? '#1c0f08' : nightVisionMode ? '#04140a' : '#0d0a07'} 
                    opacity="0.95" 
                  />
                  <polygon 
                    points="0,65 35,48 65,48 100,65" 
                    fill={mode === 'FIRE' ? '#380e0e' : mode === 'BLAST' ? '#2e180d' : mode === 'EVACUATION' ? '#0d2818' : nightVisionMode ? '#0a3319' : '#221b13'} 
                    opacity="0.9" 
                  />
                  
                  {/* Perspective Floor Grid */}
                  <line x1="15" y1="65" x2="42" y2="48" stroke={mode === 'FIRE' ? '#dc2626' : mode === 'EVACUATION' ? '#10b981' : nightVisionMode ? '#22c55e' : '#33271c'} strokeWidth="0.6" opacity="0.6" />
                  <line x1="50" y1="65" x2="50" y2="48" stroke={mode === 'FIRE' ? '#dc2626' : mode === 'EVACUATION' ? '#10b981' : nightVisionMode ? '#22c55e' : '#33271c'} strokeWidth="0.6" opacity="0.6" />
                  <line x1="85" y1="65" x2="58" y2="48" stroke={mode === 'FIRE' ? '#dc2626' : mode === 'EVACUATION' ? '#10b981' : nightVisionMode ? '#22c55e' : '#33271c'} strokeWidth="0.6" opacity="0.6" />

                  {/* Gradient Definitions */}
                  <defs>
                    <linearGradient id="fireOuterGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.95" />
                      <stop offset="60%" stopColor="#f97316" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="fireMidGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#f97316" stopOpacity="0.95" />
                      <stop offset="70%" stopColor="#fbbf24" stopOpacity="0.95" />
                      <stop offset="100%" stopColor="#fef08a" stopOpacity="0.8" />
                    </linearGradient>
                    <pattern id="hazardStripe" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                      <rect width="4" height="8" fill="#eab308" />
                      <rect x="4" width="4" height="8" fill="#0f172a" />
                    </pattern>
                  </defs>

                  {/* SCENARIO 1: FIRE EMERGENCY FLAMES & EMBERS */}
                  {mode === 'FIRE' && (
                    <g>
                      <g className="animate-flame-flicker">
                        <path d="M20,65 Q30,36 42,44 Q50,18 58,43 Q70,33 80,65 Z" fill="url(#fireOuterGrad)" opacity="0.95" />
                        <path d="M28,65 Q36,42 46,48 Q52,28 58,48 Q66,40 74,65 Z" fill="url(#fireMidGrad)" opacity="0.95" />
                        <path d="M38,65 Q45,50 50,38 Q55,50 62,65 Z" fill="#fef08a" opacity="0.95" />
                      </g>
                      <circle cx="45" cy="38" r="1.2" fill="#fef08a" className="animate-ember-1" />
                      <circle cx="56" cy="40" r="1.5" fill="#f97316" className="animate-ember-2" />
                      <circle cx="35" cy="46" r="1.0" fill="#fbbf24" className="animate-ember-1" />
                    </g>
                  )}

                  {/* SCENARIO 2: SMOKE ONLY (NO FLAME) BILLOWING PARTICULATES & REDUCED VISIBILITY */}
                  {mode === 'SMOKE' && (
                    <g className="animate-smoke-billow">
                      <rect x="0" y="0" width="100" height="65" fill="#334155" opacity="0.45" />
                      <circle cx="50" cy="32" r="22" fill="#475569" opacity="0.75" />
                      <circle cx="34" cy="38" r="18" fill="#334155" opacity="0.8" />
                      <circle cx="68" cy="36" r="20" fill="#1e293b" opacity="0.85" />
                      <circle cx="52" cy="46" r="16" fill="#64748b" opacity="0.7" />
                    </g>
                  )}

                  {/* SCENARIO 3: BLOCKED EXIT / ROUTE OBSTRUCTION BARRICADE */}
                  {mode === 'BLOCKED' && (
                    <g>
                      {/* Hazard Ground Barrier */}
                      <polygon points="25,54 75,54 78,61 22,61" fill="url(#hazardStripe)" stroke="#eab308" strokeWidth="0.8" />
                      {/* Barrier Stand Posts */}
                      <rect x="24" y="44" width="4" height="17" fill="#cbd5e1" />
                      <rect x="72" y="44" width="4" height="17" fill="#cbd5e1" />
                      {/* Cross Bar */}
                      <rect x="20" y="46" width="60" height="6" fill="url(#hazardStripe)" stroke="#eab308" strokeWidth="0.6" />
                      {/* Flashing Warning Beacon */}
                      <circle cx="26" cy="42" r="2.5" fill="#ef4444" className="animate-barrier-strobe" />
                      <circle cx="74" cy="42" r="2.5" fill="#ef4444" className="animate-barrier-strobe" />
                    </g>
                  )}

                  {/* SCENARIO 5: MEDICAL EMERGENCY (NO FIRE / NO SMOKE) */}
                  {mode === 'MEDICAL' && (
                    <g>
                      {/* Gentle Perimeter Circle on Floor */}
                      <ellipse cx="50" cy="50" rx="20" ry="8" fill="none" stroke="#3b82f6" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.8" />
                      {/* Patient on Ground */}
                      <rect x="42" y="48" width="16" height="5" rx="1.5" fill="#93c5fd" opacity="0.9" />
                      <circle cx="39" cy="49" r="2.5" fill="#cbd5e1" />
                      {/* Medical Cross Pulsing Beacon */}
                      <g transform="translate(50, 38)" className="animate-medical-beacon">
                        <circle r="6" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1" />
                        <rect x="-1" y="-4" width="2" height="8" fill="#ef4444" />
                        <rect x="-4" y="-1" width="8" height="2" fill="#ef4444" />
                      </g>
                    </g>
                  )}

                  {/* SCENARIO 6: BLAST / EXPLOSION AFTERMATH (DUST, SCORCH & DEBRIS) */}
                  {mode === 'BLAST' && (
                    <g>
                      {/* Scorched blast epicenter mark on floor */}
                      <ellipse cx="50" cy="52" rx="26" ry="9" fill="#1c1917" stroke="#ea580c" strokeWidth="1.2" opacity="0.9" />
                      {/* Shattered Debris polygons */}
                      <polygon points="32,54 36,51 38,55" fill="#78716c" />
                      <polygon points="62,50 67,52 64,56" fill="#78716c" />
                      <polygon points="46,58 50,56 48,60" fill="#a8a29e" />
                      {/* Lingering blast dust/smoke plume */}
                      <g className="animate-blast-dust">
                        <circle cx="50" cy="38" r="16" fill="#57534e" opacity="0.65" />
                        <circle cx="40" cy="42" r="13" fill="#44403c" opacity="0.7" />
                        <circle cx="62" cy="40" r="14" fill="#292524" opacity="0.75" />
                      </g>
                    </g>
                  )}

                  {/* SCENARIO 7: BUILDING EVACUATION DIRECTIONAL ARROWS */}
                  {mode === 'EVACUATION' && (
                    <g>
                      {/* Illuminated Green Egress Floor Path */}
                      <line x1="20" y1="58" x2="80" y2="58" stroke="#10b981" strokeWidth="2.5" className="animate-evac-arrows" />
                      <polygon points="82,58 76,55 76,61" fill="#34d399" />
                      {/* Green Exit Sign Doorway */}
                      <rect x="75" y="24" width="18" height="30" fill="#064e3b" stroke="#10b981" strokeWidth="1" opacity="0.9" />
                      <rect x="77" y="20" width="14" height="4" fill="#10b981" />
                      <text x="84" y="23.5" fontSize="2.8" fill="#ffffff" fontWeight="bold" textAnchor="middle">EXIT</text>
                    </g>
                  )}
                </svg>

                {/* Initial Blast Flash Shockwave Overlay (Only on Blast trigger) */}
                {mode === 'BLAST' && (
                  <div key={blastFlashKey} className="absolute inset-0 pointer-events-none animate-blast-flash z-20" />
                )}

                {/* CCTV Scanline */}
                <div className="animate-cctv-scanline" />

                {/* SCENARIO-SPECIFIC PEOPLE & YOLO OVERLAYS */}
                {mode === 'FIRE' ? (
                  // FIRE: People visibly running away from flames
                  <div className="relative z-10 w-full h-full flex flex-col justify-between p-1">
                    <svg className="w-full h-14 pointer-events-none" viewBox="0 0 100 55">
                      {/* Fleeing Person Left */}
                      <g className="animate-flee-left" stroke="#ef4444" fill="rgba(239, 68, 68, 0.15)">
                        <rect x="8" y="22" width="10" height="26" rx="1" strokeWidth="1" />
                        <circle cx="13" cy="18" r="2.5" strokeWidth="0.9" />
                      </g>
                      {/* Fleeing Person Far Left */}
                      <g className="animate-flee-left" stroke="#f97316" fill="rgba(249, 115, 22, 0.15)">
                        <rect x="22" y="16" width="11" height="32" rx="1" strokeWidth="1" />
                        <circle cx="27.5" cy="12" r="2.8" strokeWidth="0.9" />
                      </g>
                      {/* Fleeing Person Right */}
                      <g className="animate-flee-right" stroke="#ef4444" fill="rgba(239, 68, 68, 0.15)">
                        <rect x="78" y="20" width="10" height="28" rx="1" strokeWidth="1" />
                        <circle cx="83" cy="16" r="2.5" strokeWidth="0.9" />
                      </g>
                    </svg>
                    <div className="bg-red-900/95 border border-red-500 text-white font-bold text-[7.5px] py-0.5 px-1 rounded flex items-center justify-between shadow">
                      <span className="flex items-center gap-1"><Flame className="w-2.5 h-2.5 text-red-300 animate-bounce" /> FIRE DETECTED</span>
                      <span className="text-yellow-300">EVACUATING</span>
                    </div>
                  </div>
                ) : mode === 'SMOKE' ? (
                  // SMOKE: People moving through smoke toward exit
                  <div className="relative z-10 w-full h-full flex flex-col justify-between p-1">
                    <svg className="w-full h-14 pointer-events-none" viewBox="0 0 100 55">
                      <g className="animate-person-1" stroke="#f59e0b" fill="rgba(245, 158, 11, 0.15)">
                        <rect x="18" y="20" width="10" height="28" rx="1" strokeWidth="1" />
                        <circle cx="23" cy="16" r="2.5" strokeWidth="0.9" />
                      </g>
                      <g className="animate-person-3" stroke="#f59e0b" fill="rgba(245, 158, 11, 0.15)">
                        <rect x="68" y="18" width="11" height="30" rx="1" strokeWidth="1" />
                        <circle cx="73.5" cy="14" r="2.8" strokeWidth="0.9" />
                      </g>
                    </svg>
                    <div className="bg-slate-900/95 border border-amber-500 text-amber-300 font-bold text-[7.5px] py-0.5 px-1 rounded flex items-center justify-between shadow">
                      <span className="flex items-center gap-1"><Wind className="w-2.5 h-2.5 text-amber-400" /> DENSE SMOKE</span>
                      <span className="text-slate-300">VISIBILITY 35%</span>
                    </div>
                  </div>
                ) : mode === 'BLOCKED' ? (
                  // BLOCKED: People stopped and redirecting
                  <div className="relative z-10 w-full h-full flex flex-col justify-between p-1">
                    <svg className="w-full h-14 pointer-events-none" viewBox="0 0 100 55">
                      <g className="animate-person-1" stroke="#f59e0b" fill="rgba(245, 158, 11, 0.15)">
                        <rect x="14" y="22" width="10" height="28" rx="1" strokeWidth="1" />
                        <circle cx="19" cy="18" r="2.5" strokeWidth="0.9" />
                      </g>
                      {/* Turnaround Arrow */}
                      <path d="M 38 32 Q 46 22 54 32" fill="none" stroke="#ef4444" strokeWidth="1.5" markerEnd="url(#evac-arrow)" />
                    </svg>
                    <div className="bg-amber-950/95 border border-amber-500 text-white font-bold text-[7.5px] py-0.5 px-1 rounded flex items-center justify-between shadow">
                      <span className="flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5 text-amber-300" /> PASSAGE BLOCKED</span>
                      <span className="text-amber-300">DIVERTING</span>
                    </div>
                  </div>
                ) : mode === 'CROWD_SURGE' ? (
                  // CROWD SURGE: 8-10 packed people figures in bottleneck
                  <div className="relative z-10 w-full h-full flex flex-col justify-between p-1">
                    <svg className="w-full h-14 pointer-events-none animate-crowd-surge" viewBox="0 0 100 55">
                      <g stroke="#c084fc" fill="rgba(192, 132, 252, 0.2)">
                        <rect x="10" y="22" width="8" height="24" rx="1" strokeWidth="0.8" />
                        <rect x="20" y="16" width="9" height="30" rx="1" strokeWidth="0.8" />
                        <rect x="31" y="20" width="8" height="26" rx="1" strokeWidth="0.8" />
                        <rect x="41" y="14" width="10" height="32" rx="1" strokeWidth="0.8" />
                        <rect x="53" y="18" width="9" height="28" rx="1" strokeWidth="0.8" />
                        <rect x="64" y="15" width="8" height="31" rx="1" strokeWidth="0.8" />
                        <rect x="74" y="22" width="9" height="24" rx="1" strokeWidth="0.8" />
                        <rect x="85" y="18" width="8" height="28" rx="1" strokeWidth="0.8" />
                      </g>
                    </svg>
                    <div className="bg-purple-950/95 border border-purple-500 text-purple-200 font-bold text-[7.5px] py-0.5 px-1 rounded flex items-center justify-between shadow">
                      <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5 text-purple-300" /> CROWD SURGE</span>
                      <span className="text-purple-300">DENSITY 92%</span>
                    </div>
                  </div>
                ) : mode === 'MEDICAL' ? (
                  // MEDICAL: Person on ground + helpers assisting (No fire/smoke)
                  <div className="relative z-10 w-full h-full flex flex-col justify-between p-1">
                    <svg className="w-full h-14 pointer-events-none" viewBox="0 0 100 55">
                      {/* Helper kneeling */}
                      <g stroke="#60a5fa" fill="rgba(96, 165, 250, 0.15)">
                        <rect x="28" y="28" width="10" height="18" rx="1" strokeWidth="0.9" />
                        <circle cx="33" cy="24" r="2.5" strokeWidth="0.9" />
                      </g>
                      {/* Standing observer */}
                      <g stroke="#94a3b8" fill="rgba(148, 163, 184, 0.1)">
                        <rect x="72" y="18" width="10" height="30" rx="1" strokeWidth="0.9" />
                        <circle cx="77" cy="14" r="2.5" strokeWidth="0.9" />
                      </g>
                    </svg>
                    <div className="bg-blue-950/95 border border-blue-500 text-blue-200 font-bold text-[7.5px] py-0.5 px-1 rounded flex items-center justify-between shadow">
                      <span className="flex items-center gap-1"><Activity className="w-2.5 h-2.5 text-blue-300" /> MEDICAL DISTRESS</span>
                      <span className="text-emerald-300">AID DISPATCHED</span>
                    </div>
                  </div>
                ) : mode === 'BLAST' ? (
                  // BLAST: Scorched area + fleeing sprint
                  <div className="relative z-10 w-full h-full flex flex-col justify-between p-1">
                    <svg className="w-full h-14 pointer-events-none" viewBox="0 0 100 55">
                      <g className="animate-flee-left" stroke="#ef4444" fill="rgba(239, 68, 68, 0.2)">
                        <rect x="12" y="18" width="10" height="28" rx="1" strokeWidth="1" />
                        <circle cx="17" cy="14" r="2.5" strokeWidth="0.9" />
                      </g>
                      <g className="animate-flee-right" stroke="#ef4444" fill="rgba(239, 68, 68, 0.2)">
                        <rect x="76" y="18" width="10" height="28" rx="1" strokeWidth="1" />
                        <circle cx="81" cy="14" r="2.5" strokeWidth="0.9" />
                      </g>
                    </svg>
                    <div className="bg-red-950/95 border border-amber-500 text-white font-bold text-[7.5px] py-0.5 px-1 rounded flex items-center justify-between shadow">
                      <span className="flex items-center gap-1"><Zap className="w-2.5 h-2.5 text-yellow-300" /> BLAST INCIDENT</span>
                      <span className="text-red-300">EVACUATING</span>
                    </div>
                  </div>
                ) : mode === 'EVACUATION' ? (
                  // EVACUATION: Orderly egress stream toward exit
                  <div className="relative z-10 w-full h-full flex flex-col justify-between p-1">
                    <svg className="w-full h-14 pointer-events-none" viewBox="0 0 100 55">
                      <g stroke="#34d399" fill="rgba(52, 211, 153, 0.15)">
                        <rect x="18" y="20" width="9" height="28" rx="1" strokeWidth="0.9" />
                        <rect x="34" y="18" width="9" height="30" rx="1" strokeWidth="0.9" />
                        <rect x="50" y="16" width="9" height="32" rx="1" strokeWidth="0.9" />
                      </g>
                    </svg>
                    <div className="bg-emerald-950/95 border border-emerald-500 text-emerald-200 font-bold text-[7.5px] py-0.5 px-1 rounded flex items-center justify-between shadow">
                      <span className="flex items-center gap-1"><ArrowRight className="w-2.5 h-2.5 text-emerald-300" /> PHASED EVACUATION</span>
                      <span className="text-emerald-300">WEST GATE</span>
                    </div>
                  </div>
                ) : (
                  // NORMAL BASELINE: Moving green YOLO bounding boxes with walking sway
                  <div className="relative z-10 w-full h-full flex flex-col justify-between p-1">
                    <svg className="w-full h-16 pointer-events-none" viewBox="0 0 100 60">
                      <g className="animate-person-1" stroke="#22c55e" fill="rgba(34, 197, 94, 0.08)">
                        <rect x="14" y="24" width="11" height="28" rx="1" strokeWidth="0.9" />
                        <circle cx="19.5" cy="20" r="2.5" strokeWidth="0.8" />
                      </g>
                      <g className="animate-person-2" stroke="#22c55e" fill="rgba(34, 197, 94, 0.08)">
                        <rect x="34" y="16" width="13" height="38" rx="1" strokeWidth="0.9" />
                        <circle cx="40.5" cy="12" r="2.8" strokeWidth="0.8" />
                      </g>
                      <g className="animate-person-3" stroke="#22c55e" fill="rgba(34, 197, 94, 0.08)">
                        <rect x="56" y="20" width="12" height="32" rx="1" strokeWidth="0.9" />
                        <circle cx="62" cy="16" r="2.5" strokeWidth="0.8" />
                      </g>
                      <g className="animate-person-4" stroke="#22c55e" fill="rgba(34, 197, 94, 0.08)">
                        <rect x="76" y="22" width="11" height="30" rx="1" strokeWidth="0.9" />
                        <circle cx="81.5" cy="18" r="2.5" strokeWidth="0.8" />
                      </g>
                    </svg>
                    <div className="text-[7.5px] font-mono text-emerald-400/90 text-center tracking-tight bg-slate-950/80 py-0.2 rounded border border-emerald-950/60">
                      OCCUPANCY: {cam.person_count} PERS [SECURE]
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Camera Name & Tracked Count */}
              <div className="flex items-center justify-between text-[9.5px] font-mono text-cyan-400 mt-1">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-cyan-400" />
                  {cam.person_count} tracked
                </span>
                <span className="text-slate-400 truncate max-w-[65px]">
                  zone: {cam.zone_id.replace('BLOCK_', '').replace('EXIT_', '')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Camera Modal */}
      {selectedCam && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="tactical-card max-w-2xl w-full rounded-xl p-4 border border-cyan-500/50 bg-[#0a0f1d] relative flex flex-col gap-3 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-cyan-400" />
                <h4 className="font-bold text-white text-sm font-mono">{selectedCam.name}</h4>
              </div>
              <button
                onClick={() => setSelectedCam(null)}
                className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>

            <div className="relative aspect-video rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-cyber-grid opacity-30" />
              <div className="text-center font-mono text-xs text-slate-300">
                <p className="text-cyan-400 font-bold text-sm mb-1">High-Definition Optical Feed • Real-Time Stream</p>
                <p>Zone: {selectedCam.zone_id} • Status: {
                  selectedCam.visualMode === 'FIRE' ? 'CRITICAL FIRE HAZARD' :
                  selectedCam.visualMode === 'BLAST' ? 'BLAST / SHOCKWAVE INCIDENT' :
                  selectedCam.visualMode === 'SMOKE' ? 'DENSE SMOKE PLUME' :
                  selectedCam.visualMode === 'BLOCKED' ? 'OBSTRUCTED CORRIDOR' :
                  selectedCam.visualMode === 'CROWD_SURGE' ? 'CROWD BOTTLENECK SURGE' :
                  selectedCam.visualMode === 'MEDICAL' ? 'MEDICAL DISTRESS' :
                  selectedCam.visualMode === 'EVACUATION' ? 'PHASED BUILDING EVACUATION' :
                  'SECURE & NOMINAL'
                }</p>
                <p className="text-slate-400 mt-1">Optical Channel Active • Occupancy: {selectedCam.person_count} persons</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

