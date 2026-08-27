import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  Flame,
  AlertTriangle,
  Zap,
  Sliders,
  Compass,
  Building2,
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useSentinel } from '../context/SentinelContext';

export const SimulationSandbox = () => {
  const {
    telemetry,
    activeScenario,
    triggerScenario,
    injectHazard,
    resetHazards,
    isLoading
  } = useSentinel();

  const [selectedZone, setSelectedZone] = useState('BLOCK_B_L1');
  const [fireIntensity, setFireIntensity] = useState(80);
  const [smokeDensity, setSmokeDensity] = useState(70);
  const [isBlocked, setIsBlocked] = useState(true);

  const digitalTwin = telemetry?.digital_twin || { nodes: [] };
  const nodes = digitalTwin.nodes || [];

  const scenarios = [
    {
      id: "fire_science_block",
      title: "Fire Emergency in U Block",
      icon: "🔥",
      severity: "CRITICAL",
      desc: "Thermal chemical fire in U Block Labs. Corridors compromised. Diverts occupants to North Gate; dispatches ambulance."
    },
    {
      id: "library_smoke_blockage",
      title: "Smoke Detected in Central Library",
      icon: "💨",
      severity: "HIGH",
      desc: "HVAC short-circuit causes dense smoke in Library. Skyway throughput constrained. A* reroutes to North Gate."
    },
    {
      id: "auditorium_surge_fire",
      title: "Crowd Surge in MHP Cafeteria",
      icon: "👥",
      severity: "CRITICAL",
      desc: "Mass congestion of 450+ occupants facing bottleneck risk. Rapid A* evacuation rerouted to East and South exits."
    },
    {
      id: "gate_north_blocked",
      title: "Blocked Exit at Main Gate North",
      icon: "🚧",
      severity: "MODERATE",
      desc: "Perimeter obstruction blocks Main North Gate. Automatic A* load re-balancing to East and South perimeter exits."
    },
    {
      id: "medical_emergency",
      title: "Medical Emergency in Dining Hall",
      icon: "🚑",
      severity: "ELEVATED",
      desc: "Medical distress reported. Clears East Corridor responder priority lane and dispatches ambulance with live GPS tracking."
    },
    {
      id: "blast_explosion",
      title: "Blast / Chemical Explosion in U Block",
      icon: "💥",
      severity: "CRITICAL",
      desc: "High-order chemical blast with structural risk. Isolates blast zone and triggers general perimeter campus evacuation."
    },
    {
      id: "building_evacuation",
      title: "Phased Building Evacuation (Block A)",
      icon: "🏢",
      severity: "HIGH",
      desc: "Precautionary phased evacuation of 300 occupants in Academic Block A through West Corridor to West Perimeter Exit."
    },
    {
      id: "multi_point_disaster",
      title: "Multi-Point Campus Escalation",
      icon: "🚨",
      severity: "EXTREME",
      desc: "Simultaneous compound hazards across U Block, Library, and Stairwells. Stresses global multi-agent graph re-optimization."
    }
  ];

  const handleCustomInject = (e) => {
    e.preventDefault();
    injectHazard(selectedZone, fireIntensity, smokeDensity, isBlocked);
  };

  const reroutedZones = telemetry?.routes?.rerouted_zones || [];
  const trappedZones = telemetry?.routes?.trapped_zones_count || 0;

  return (
    <div className="space-y-4 font-mono">
      {/* Header */}
      <div className="tactical-card rounded-xl p-4 border border-slate-800 bg-[#091122]/95 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            WHAT-IF DISASTER SIMULATION &amp; STRESS-TEST ENGINE
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Simulate emergency scenarios, evaluate automated multi-sensor detection, and verify dynamic A* evacuation paths.
          </p>
        </div>

        <button
          onClick={resetHazards}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
          Reset All Campus Hazards
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Pre-configured Scenarios */}
        <div className="lg:col-span-2 space-y-3">
          <div className="tactical-card rounded-xl p-4 border border-slate-800 bg-[#091122]/95">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Pre-Configured Emergency Scenarios
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {scenarios.map((sc) => {
                const isActive = activeScenario === sc.id;
                return (
                  <div
                    key={sc.id}
                    className={`p-3.5 rounded-lg border transition-all duration-200 flex flex-col justify-between ${isActive
                        ? 'bg-slate-900 border-amber-500 shadow-md'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{sc.icon}</span>
                          <span className="text-xs font-bold text-white">{sc.title}</span>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${sc.severity === 'EXTREME' ? 'bg-red-950 text-red-300 border border-red-800' :
                            sc.severity === 'CRITICAL' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                              'bg-slate-900 text-slate-300 border border-slate-700'
                          }`}>
                          {sc.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-3">{sc.desc}</p>
                    </div>

                    <button
                      onClick={() => triggerScenario(sc.id)}
                      disabled={isLoading}
                      className={`w-full py-2 rounded text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${isActive
                          ? 'bg-amber-600 text-white shadow'
                          : 'bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:border-slate-600'
                        }`}
                    >
                      <Play className="w-3.5 h-3.5" />
                      {isActive ? "Scenario Active • Simulating" : "Execute Scenario"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Replanning Telemetry Feedback Box */}
          <div className="tactical-card rounded-xl p-4 border border-slate-800 bg-[#091122]/95">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Evacuation Replanning Live Telemetry
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Threat Level</div>
                <div className="text-white font-bold text-sm mt-0.5">{telemetry?.threat_level || 'NORMAL'}</div>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Rerouted Zones</div>
                <div className="text-blue-400 font-bold text-sm mt-0.5">{reroutedZones.length} zones</div>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Trapped Zones</div>
                <div className={`font-bold text-sm mt-0.5 ${trappedZones > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {trappedZones} zones
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Custom Hazard Injection Sandbox */}
        <div className="tactical-card rounded-xl p-4 border border-sentinel-border bg-[#0a0f1d]/90 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Custom Hazard Injector
              </h3>
            </div>

            <form onSubmit={handleCustomInject} className="space-y-3.5 text-xs">
              {/* Zone Select */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Target Campus Zone:</label>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono focus:border-cyan-500 outline-none"
                >
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.name} ({n.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Fire Intensity Slider */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Fire Intensity:</span>
                  <span className="text-red-400 font-bold">{fireIntensity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={fireIntensity}
                  onChange={(e) => setFireIntensity(Number(e.target.value))}
                  className="w-full accent-red-500 bg-slate-800 rounded"
                />
              </div>

              {/* Smoke Density Slider */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Smoke Density:</span>
                  <span className="text-slate-400 font-bold">{smokeDensity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={smokeDensity}
                  onChange={(e) => setSmokeDensity(Number(e.target.value))}
                  className="w-full accent-slate-400 bg-slate-800 rounded"
                />
              </div>

              {/* Blocked Checkbox */}
              <div className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800">
                <input
                  type="checkbox"
                  id="blockedCheck"
                  checked={isBlocked}
                  onChange={(e) => setIsBlocked(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <label htmlFor="blockedCheck" className="text-slate-300 cursor-pointer">
                  Impassable / Block Corridor Link
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold transition shadow-[0_0_15px_rgba(239,68,68,0.3)] flex items-center justify-center gap-1.5"
              >
                <Flame className="w-4 h-4" />
                Inject Custom Hazard
              </button>
            </form>
          </div>

          <div className="mt-4 p-2.5 rounded bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 leading-tight">
            💡 <strong>How it works:</strong> Injected hazards immediately recalculate spatial edge weights in the digital twin graph and trigger the optimal evacuation pathfinder within seconds.
          </div>
        </div>
      </div>
    </div>
  );
};
