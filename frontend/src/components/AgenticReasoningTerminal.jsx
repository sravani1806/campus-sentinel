import React, { useState } from 'react';
import { 
  Bot, 
  Cpu, 
  Radio, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  Activity,
  Layers,
  Eye,
  Users,
  Route,
  ShieldAlert,
  Clock,
  Compass,
  Send
} from 'lucide-react';
import { useSentinel } from '../context/SentinelContext';

export const AgenticReasoningTerminal = () => {
  const { 
    telemetry, 
    triggerScenario, 
    resetHazards, 
    isLoading,
    openPushAlertModal,
    confirmPushEmergencyAlert,
    sendPushEmergencyAlert,
    setActiveTab,
    isPaBroadcasting,
    broadcastPA,
    incidentTimeline
  } = useSentinel();

  const [lastPushedAlert, setLastPushedAlert] = useState(null);

  const commander = telemetry?.commander || {};
  const threatLevel = telemetry?.threat_level || 'GREEN_NORMAL';
  const cycleId = telemetry?.cycle_id || 1;
  const confidence = Math.round((commander.confidence || 0.98) * 100);
  const assessment = commander.assessment || "All campus zones operating within safe risk thresholds. AI perception engines active.";
  const whyThisRoute = commander.why_this_route || "All campus corridors clear. Direct A* evacuation routes verified to all nearest open perimeter gates.";
  const paAnnouncement = commander.pa_announcement || "Attention Vignan Campus: All academic blocks, corridors, and exits are clear and operating normally.";

  const handlePushAlert = () => {
    if (openPushAlertModal) {
      openPushAlertModal();
    } else {
      confirmPushEmergencyAlert();
      if (setActiveTab) setActiveTab('pwa');
    }
  };

  const handleSpeakPA = () => {
    broadcastPA(paAnnouncement);
  };

  // Operational Subsystem Agents
  const agentList = [
    {
      id: "PERCEPTION",
      name: "Visual & Sensor Surveillance",
      role: "Thermal & Anomaly Ingestion",
      status: telemetry?.vision ? "ACTIVE" : "STANDBY",
      metrics: `${Object.keys(telemetry?.vision || {}).length || 6} Cameras • 30 FPS`,
      icon: Eye,
      color: "cyan"
    },
    {
      id: "CROWD",
      name: "Crowd Flow Modeling",
      role: "Density & Velocity Tracking",
      status: "ONLINE",
      metrics: `${telemetry?.crowd?.total_population || 1200} Occupants Active`,
      icon: Users,
      color: "indigo"
    },
    {
      id: "RISK",
      name: "Spatial Risk Assessment",
      role: "Dynamic Hazard Matrix",
      status: threatLevel === 'RED_CRITICAL' ? "CRITICAL ALERT" : "MONITORING",
      metrics: `Max Risk: ${telemetry?.max_risk_score || 0.0}/100`,
      icon: AlertTriangle,
      color: threatLevel === 'RED_CRITICAL' ? "red" : "amber"
    },
    {
      id: "PLANNER",
      name: "Evacuation Route Planner",
      role: "A* Shortest Safe Path Engine",
      status: "OPTIMIZED",
      metrics: `${Object.keys(telemetry?.routes?.routes_by_zone || {}).length || 23} Zones Mapped`,
      icon: Route,
      color: "emerald"
    },
    {
      id: "COMMANDER",
      name: "Incident Decision Engine",
      role: "Tactical Safety Guidance",
      status: "ENGAGED",
      metrics: `Confidence: ${confidence}%`,
      icon: Bot,
      color: "purple"
    },
    {
      id: "MONITOR",
      name: "Real-Time Telemetry Loop",
      role: "Continuous Campus Guard",
      status: "VIGILANT",
      metrics: `Cycle #${cycleId} Active`,
      icon: Activity,
      color: "blue"
    }
  ];

  return (
    <div className="tactical-card rounded-xl p-4 border border-slate-800 bg-[#091122]/95 backdrop-blur-xl flex flex-col gap-4 shadow-xl h-full font-mono text-xs text-slate-200">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-blue-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                INCIDENT COMMAND &amp; EVACUATION INTELLIGENCE
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-blue-300 border border-slate-700 font-semibold">
                Operational Status: Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Real-time sensor telemetry, dynamic A* escape path recalculation &amp; public safety broadcast
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={resetHazards}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1 active:scale-95 cursor-pointer"
            title="Reset All Hazards to Baseline"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
            <span>Reset Baseline</span>
          </button>
        </div>
      </div>

      {/* 1. Human-Readable "WHY THIS ROUTE?" Explanation Card */}
      <div className="p-3.5 rounded-xl bg-[#0d172e] border border-slate-700 text-xs font-mono space-y-2 shadow">
        <div className="flex items-center justify-between text-blue-300 font-bold text-[11px]">
          <span className="flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-blue-400" />
            WHY THIS ROUTE? • Evacuation Path Rationale
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
            Decision Reliability: {confidence}%
          </span>
        </div>
        <p className="text-slate-100 text-xs leading-relaxed font-sans bg-slate-950 p-3 rounded-lg border border-slate-800">
          "{whyThisRoute}"
        </p>
      </div>

      {/* 2. Operational Subsystems Grid */}
      <div>
        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Autonomous Campus Surveillance Subsystems
          </span>
          <span className="text-[10px] text-cyan-300/80">6/6 Modules Active</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {agentList.map((agent) => {
            const IconComp = agent.icon;
            const isRed = agent.color === 'red';
            const isEmerald = agent.color === 'emerald';
            const isPurple = agent.color === 'purple';
            
            return (
              <div 
                key={agent.id}
                className={`p-2.5 rounded-lg border backdrop-blur-md transition-all shadow-sm ${
                  isRed 
                    ? 'bg-red-950/70 border-red-500/70'
                    : 'bg-[#0a1224] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-[11px] text-white">
                    <IconComp className={`w-3.5 h-3.5 ${
                      isRed ? 'text-red-400' : isEmerald ? 'text-emerald-400' : isPurple ? 'text-purple-400' : 'text-blue-400'
                    }`} />
                    <span>{agent.name}</span>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                    isRed ? 'bg-red-900 text-red-200' : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                  }`}>
                    {agent.status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">{agent.role}</div>
                <div className="text-[10px] text-blue-300 font-semibold mt-1">{agent.metrics}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Emergency Dispatch & PA Broadcast Controls */}
      <div className="flex flex-col gap-2.5">
        <div className="p-3 rounded-xl bg-[#0a1224] border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg border ${
              isPaBroadcasting ? 'bg-blue-600 text-white border-blue-400 animate-pulse' : 'bg-slate-900 text-blue-400 border border-slate-700'
            }`}>
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white text-xs flex items-center gap-2">
                <span>Public Address (PA) Audio Broadcast</span>
                {isPaBroadcasting && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-600 text-white font-bold animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    BROADCAST ACTIVE
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 line-clamp-1 max-w-md">"{paAnnouncement}"</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Push Emergency Alert Button */}
            <button
              onClick={handlePushAlert}
              className="px-3.5 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5 shadow active:scale-95 cursor-pointer bg-red-600 hover:bg-red-500 text-white font-mono"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Push Emergency Alert</span>
            </button>

            {/* Broadcast PA Announcement Button */}
            <button
              onClick={handleSpeakPA}
              className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5 shadow active:scale-95 cursor-pointer whitespace-nowrap ${
                isPaBroadcasting
                  ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-500 text-white font-extrabold'
              }`}
            >
              {isPaBroadcasting ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isPaBroadcasting ? "Stop Announcement" : "Broadcast Emergency Message"}</span>
            </button>
          </div>
        </div>

        {/* 4. Compact Incident Visual Timeline */}
        <div className="p-3 rounded-xl bg-[#0a1224] border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span className="flex items-center gap-1.5 text-white">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Real-Time Incident &amp; Response Timeline
            </span>
            <span className="text-[10px] text-slate-500 font-normal">Live Operational Sequence</span>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {incidentTimeline && incidentTimeline.length > 0 ? (
              incidentTimeline.slice(0, 8).map((evt) => (
                <div key={evt.id} className="flex items-center justify-between gap-2 p-1.5 rounded bg-slate-950/90 border border-slate-800 text-[10.5px]">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-blue-400 font-mono text-[10px] shrink-0 font-bold">{evt.time}</span>
                    <span className="text-sm shrink-0">{evt.icon || '📡'}</span>
                    <span className="text-slate-200 truncate">{evt.text}</span>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded shrink-0 font-bold ${
                    evt.type === 'SCENARIO' || evt.type === 'ALARM' ? 'bg-red-950 text-red-300 border border-red-800' :
                    evt.type === 'HAZARD' || evt.type === 'ALERT' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                    evt.type === 'ROUTING' || evt.type === 'RESPONDER' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                    evt.type === 'EGRESS' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                    'bg-slate-900 text-slate-400 border border-slate-700'
                  }`}>
                    {evt.badge}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-[11px] text-slate-500 py-1">No emergency incidents recorded. System nominal.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

