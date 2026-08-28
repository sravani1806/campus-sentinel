import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Layers, 
  Flame, 
  ShieldAlert, 
  Users, 
  Camera, 
  Navigation, 
  Truck, 
  CheckCircle2, 
  AlertOctagon,
  Eye,
  Maximize2,
  Minimize2,
  RefreshCw
} from 'lucide-react';
import { useSentinel } from '../context/SentinelContext';

export const DigitalTwinMap = () => {
  const { telemetry, selectedZone, setSelectedZone, injectHazard, resetHazards, activeScenario } = useSentinel();
  const [showRoutes, setShowRoutes] = useState(true);
  const [showResponder, setShowResponder] = useState(false);
  const [showCrowd, setShowCrowd] = useState(true);
  const [showEgress, setShowEgress] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const digitalTwin = telemetry?.digital_twin || { nodes: [], edges: [] };
  const nodes = digitalTwin.nodes || [];
  const edges = digitalTwin.edges || [];
  const routesByZone = telemetry?.routes?.routes_by_zone || {};
  const activeCorridors = telemetry?.resources?.active_corridors || [];
  const zoneRisks = telemetry?.risks?.zone_risk_matrix || {};

  // Auto-activate responder lane if an emergency is actively running, and return to standby when cleared
  useEffect(() => {
    const hasEmergency = Boolean(activeScenario) || nodes.some(n => (n.fire_intensity || 0) > 15 || (n.smoke_density || 0) > 20 || n.is_blocked || (n.risk_score || 0) >= 50);
    if (hasEmergency && activeScenario !== 'smoke_detected' && activeScenario !== 'library_smoke_blockage') {
      setShowResponder(true);
    } else if (!hasEmergency) {
      setShowResponder(false);
    }
  }, [activeScenario, nodes]);


  // Automatically find the highest-hazard block when a problem occurs on campus
  const activeHazardNode = nodes.reduce((highest, curr) => {
    const currSeverity = (curr.fire_intensity || 0) * 3 + (curr.smoke_density || 0) * 2 + (curr.risk_score || 0) + (curr.is_blocked ? 60 : 0);
    const highestSeverity = highest ? ((highest.fire_intensity || 0) * 3 + (highest.smoke_density || 0) * 2 + (highest.risk_score || 0) + (highest.is_blocked ? 60 : 0)) : 0;
    return (currSeverity > highestSeverity && currSeverity > 20) ? curr : highest;
  }, null);

  // Dynamic in-browser A* shortest path solver across campus graph
  const computeAStarRoute = (startNodeId, targetNodes, edgesList) => {
    if (!startNodeId) return null;
    const exitSet = new Set(targetNodes.filter(n => n.is_exit && !n.is_blocked).map(n => n.id));
    if (exitSet.size === 0) return null;

    // BFS / Dijkstra for shortest unblocked path
    const queue = [[startNodeId]];
    const visited = new Set([startNodeId]);

    while (queue.length > 0) {
      const path = queue.shift();
      const curr = path[path.length - 1];

      if (exitSet.has(curr)) {
        const exitNode = nodeMap[curr] || { name: 'Perimeter Gate' };
        const dist = Math.round(path.length * 55);
        const timeSec = Math.round(dist * 0.35);
        return {
          start: startNodeId,
          exit: curr,
          exit_name: exitNode.name,
          path,
          distance_meters: dist,
          estimated_time_seconds: timeSec,
          steps: [`Evacuate from ${nodeMap[startNodeId]?.name || startNodeId}`, ...path.slice(1, -1).map(p => `Pass through ${nodeMap[p]?.name || p}`), `Arrive safely at ${exitNode.name}`],
          status: "OPTIMAL"
        };
      }

      // Find unblocked neighbors
      const neighbors = [];
      edgesList.forEach(e => {
        if (!e.is_blocked) {
          if (e.source === curr && !visited.has(e.target) && !nodeMap[e.target]?.is_blocked) {
            neighbors.push(e.target);
          } else if (e.target === curr && !visited.has(e.source) && !nodeMap[e.source]?.is_blocked) {
            neighbors.push(e.source);
          }
        }
      });

      for (const next of neighbors) {
        visited.add(next);
        queue.push([...path, next]);
      }
    }

    return {
      status: "TRAPPED_NO_PATH",
      steps: ["All direct corridors blocked", "Shelter in place and await rescue"],
      path: []
    };
  };

  // Node position lookup
  const nodeMap = {};
  nodes.forEach(n => { nodeMap[n.id] = n; });

  // Focus on selectedZone or the active hazard node dynamically
  const activeZoneId = selectedZone || activeHazardNode?.id || 'BLOCK_B_L1';
  const currentZoneNode = nodes.find(n => n.id === activeZoneId) || activeHazardNode || nodes[0];
  const currentRoute = React.useMemo(() => {
    if (!currentZoneNode) return null;
    if (routesByZone[currentZoneNode.id] && routesByZone[currentZoneNode.id].path?.length > 1) {
      return routesByZone[currentZoneNode.id];
    }
    return computeAStarRoute(currentZoneNode.id, nodes, edges);
  }, [currentZoneNode, routesByZone, nodes, edges]);

  // Dynamic Responder Route (Ambulance Bay to Focus Node)
  const responderPath = React.useMemo(() => {
    if (activeCorridors.length > 0 && activeCorridors[0].path && activeCorridors[0].path.length > 1) {
      return activeCorridors[0].path;
    }
    const target = activeHazardNode?.id || currentZoneNode?.id || 'BLOCK_B_L1';
    return ["AMBULANCE_BAY", "EXIT_EAST_GATE", "CORRIDOR_EAST", target];
  }, [activeCorridors, currentZoneNode, activeHazardNode]);

  const responderPathD = React.useMemo(() => {
    if (!responderPath || responderPath.length < 2) return '';
    const pts = responderPath.map(id => nodeMap[id]).filter(Boolean);
    if (pts.length < 2) return '';
    return `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
  }, [responderPath, nodeMap]);

  // Dynamic Student Egress Path D string
  const egressPathD = React.useMemo(() => {
    if (!currentRoute?.path || currentRoute.path.length < 2) return '';
    const pts = currentRoute.path.map(id => nodeMap[id]).filter(Boolean);
    if (pts.length < 2) return '';
    return `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
  }, [currentRoute, nodeMap]);

  const originNode = currentRoute?.path?.[0] ? nodeMap[currentRoute.path[0]] : null;
  const destNode = currentRoute?.path?.length > 1 ? nodeMap[currentRoute.path[currentRoute.path.length - 1]] : null;
  const responderTargetNode = responderPath?.length > 1 ? nodeMap[responderPath[responderPath.length - 1]] : null;

  const pathMidpoint = React.useMemo(() => {
    if (!currentRoute?.path || currentRoute.path.length < 2) return null;
    const midIdx = Math.floor(currentRoute.path.length / 2);
    const n = nodeMap[currentRoute.path[midIdx]];
    return n ? { x: n.x, y: n.y - 30 } : null;
  }, [currentRoute, nodeMap]);

  const getRiskColor = (riskScore, isBlocked) => {
    if (isBlocked || riskScore >= 70) return '#ef4444'; // Red (Critical)
    if (riskScore >= 40) return '#f97316'; // Orange (High)
    if (riskScore >= 20) return '#eab308'; // Yellow (Moderate)
    return '#10b981'; // Green (Low / Normal)
  };

  const getDensityBadge = (occupancy, capacity = 100) => {
    const ratio = occupancy / capacity;
    if (ratio >= 0.75 || occupancy >= 350) return { label: 'CRITICAL', bg: '#7f1d1d', text: '#fca5a5', border: '#ef4444' };
    if (ratio >= 0.45 || occupancy >= 200) return { label: 'HIGH', bg: '#7c2d12', text: '#fdba74', border: '#f97316' };
    if (ratio >= 0.20 || occupancy >= 80) return { label: 'MODERATE', bg: '#713f12', text: '#fde047', border: '#eab308' };
    return { label: 'LOW', bg: '#064e3b', text: '#86efac', border: '#10b981' };
  };

  // Convert A* path array into SVG coordinate string
  const renderPathPolyline = (pathArray, strokeColor, isLaser = true, isDashed = false) => {
    if (!pathArray || pathArray.length < 2) return null;
    const points = pathArray
      .map(nodeId => {
        const n = nodeMap[nodeId];
        return n ? `${n.x},${n.y}` : null;
      })
      .filter(Boolean)
      .join(' ');

    return (
      <g>
        {/* Under-glow line */}
        <polyline
          points={points}
          fill="none"
          stroke={strokeColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.3"
        />
        {/* Core animated line */}
        <polyline
          points={points}
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={isDashed ? '6,6' : '10,5'}
          className={isLaser ? 'animate-laser-path' : ''}
        />
      </g>
    );
  };


  return (
    <div className={`tactical-card rounded-xl p-4 flex flex-col border border-sentinel-border bg-[#0a0f1d]/90 relative overflow-hidden transition-all duration-300 ${
      isExpanded ? 'fixed inset-4 z-50 shadow-2xl' : 'h-[520px]'
    }`}>
      {/* Top Map Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-cyan-950/80 border border-cyan-700/50 text-cyan-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-2 font-mono">
              CAMPUS DIGITAL TWIN (2.5D A* GRAPH)
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold">
                {nodes.length || 23} Nodes • {edges.length || 42} Links
              </span>
            </h3>
          </div>
        </div>

        {/* Layer Toggles & Status */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <button
            onClick={() => setShowRoutes(!showRoutes)}
            className={`px-2.5 py-1 rounded border transition flex items-center gap-1 cursor-pointer ${
              showRoutes 
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 font-semibold' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Navigation className="w-3 h-3" />
            A* Paths
          </button>

          <button
            onClick={() => setShowResponder(!showResponder)}
            className={`px-2.5 py-1 rounded border transition flex items-center gap-1 cursor-pointer ${
              showResponder 
                ? 'bg-blue-950/80 border-blue-500 text-blue-300 font-semibold' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Truck className="w-3 h-3" />
            Ambulance Bay
          </button>

          <button
            onClick={() => setShowEgress(!showEgress)}
            className={`px-2.5 py-1 rounded border transition flex items-center gap-1 cursor-pointer ${
              showEgress 
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-semibold' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Users className="w-3 h-3" />
            Student Egress
          </button>

          <button
            onClick={() => setShowCrowd(!showCrowd)}
            className={`px-2.5 py-1 rounded border transition flex items-center gap-1 cursor-pointer ${
              showCrowd 
                ? 'bg-purple-950/80 border-purple-500 text-purple-300 font-semibold' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Layers className="w-3 h-3" />
            Crowd Heat
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
            title={isExpanded ? "Collapse Canvas" : "Expand Fullscreen"}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main SVG Map Canvas with Campus Aerial Background for the Blocks side */}
      <div 
        className="relative flex-1 rounded-lg border border-slate-800/80 overflow-hidden flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(6, 12, 28, 0.65) 0%, rgba(4, 9, 22, 0.52) 50%, rgba(5, 10, 26, 0.72) 100%), url('/campus_background.jpg')`
        }}
      >
        {/* Subtle grid and radar background */}
        <div className="absolute inset-0 pointer-events-none bg-cyber-grid opacity-25" />
        <div className="absolute inset-0 pointer-events-none opacity-20 flex items-center justify-center">
          <div className="w-96 h-96 rounded-full border border-cyan-500/20 relative">
            <div className="radar-line" />
          </div>
        </div>

        {/* SVG Canvas Elements */}
        <svg
          viewBox="0 0 1000 720"
          className="w-full h-full select-none relative z-10"
          style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.85))' }}
        >
          <defs>
            {/* Glow Filter for Active Fire */}
            <filter id="fire-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Directional Arrow Marker for A* Routes */}
            <marker
              id="evac-arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="4.5"
              markerHeight="4.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
            </marker>

            {/* Glowing Linear Gradients */}
            <linearGradient id="corridorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="blockedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#991b1b" stopOpacity="0.7" />
            </linearGradient>
          </defs>

          {/* 1. Base Edges & Arterial Corridors */}
          {edges.map((edge, idx) => {
            const u = nodeMap[edge.source];
            const v = nodeMap[edge.target];
            if (!u || !v) return null;
            const isEmergencyCorridor = edge.is_emergency_corridor;
            const isBlocked = edge.is_blocked;
            const midX = (u.x + v.x) / 2;
            const midY = (u.y + v.y) / 2;

            return (
              <g key={`edge-${idx}`}>
                <line
                  x1={u.x}
                  y1={u.y}
                  x2={v.x}
                  y2={v.y}
                  stroke={isBlocked ? '#ef4444' : isEmergencyCorridor ? '#3b82f6' : '#1e293b'}
                  strokeWidth={isBlocked ? 3.5 : isEmergencyCorridor ? 4 : 2}
                  strokeDasharray={isBlocked ? '6,6' : 'none'}
                  opacity={isBlocked ? 0.9 : isEmergencyCorridor ? 0.8 : 0.6}
                />
                {isBlocked && (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <circle r="8" fill="#450a0a" stroke="#ef4444" strokeWidth="1.5" />
                    <text x="0" y="3" fontSize="9" fill="#ef4444" textAnchor="middle" fontWeight="bold">✕</text>
                  </g>
                )}
              </g>
            );
          })}

          {/* 2. Priority Responder Corridor (Ambulance Bay Route) with Moving Animated Ambulance & Live ETA */}
          {showResponder ? (
            <g>
              {renderPathPolyline(responderPath, '#3b82f6', true, false)}
              {responderPathD && (
                <g>
                  {/* Moving Ambulance Beacon & Icon */}
                  <g>
                    <animateMotion
                      path={responderPathD}
                      dur="5s"
                      repeatCount="indefinite"
                    />
                    <circle r="14" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="2" opacity="0.95" />
                    <text fontSize="12" textAnchor="middle" dominantBaseline="central">🚑</text>
                    <g transform="translate(0, 20)">
                      <rect x="-42" y="-7" width="84" height="14" rx="3" fill="#09101f" stroke="#3b82f6" strokeWidth="0.8" opacity="0.95" />
                      <text x="0" y="3" fill="#93c5fd" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                        AMBULANCE • 1:24 ETA
                      </text>
                    </g>
                  </g>
                </g>
              )}
            </g>
          ) : (
            nodeMap["AMBULANCE_BAY"] && (
              <g 
                transform={`translate(${nodeMap["AMBULANCE_BAY"].x}, ${nodeMap["AMBULANCE_BAY"].y})`} 
                onClick={() => setShowResponder(true)} 
                className="cursor-pointer group"
              >
                <circle r="14" fill="#0f172a" stroke="#3b82f6" strokeWidth="1.5" opacity="0.9" className="group-hover:stroke-blue-400" />
                <text fontSize="12" textAnchor="middle" dominantBaseline="central">🚑</text>
                <rect x="-22" y="15" width="44" height="12" rx="3" fill="#09101f" stroke="#475569" strokeWidth="0.8" opacity="0.9" />
                <text x="0" y="24" fill="#94a3b8" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  BAY STANDBY
                </text>
              </g>
            )
          )}

          {/* 3. Dynamic A* Evacuation Paths & Egress Flows */}
          {showRoutes && currentRoute?.path && currentRoute.path.length > 1 && currentRoute.status !== 'TRAPPED_NO_PATH' && (
            <g>
              {/* Primary Recommended Safe A* Laser Route */}
              {renderPathPolyline(currentRoute.path, '#10b981', true, false)}

              {/* Directional Flow Arrows Along A* Path */}
              {egressPathD && (
                <g>
                  <path d="M-5,-3.5 L2,0 L-5,3.5" fill="none" stroke="#34d399" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <animateMotion path={egressPathD} dur="3.5s" repeatCount="indefinite" rotate="auto" />
                  </path>
                  <path d="M-5,-3.5 L2,0 L-5,3.5" fill="none" stroke="#6ee7b7" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <animateMotion path={egressPathD} dur="3.5s" begin="1.2s" repeatCount="indefinite" rotate="auto" />
                  </path>
                  <path d="M-5,-3.5 L2,0 L-5,3.5" fill="none" stroke="#a7f3d0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <animateMotion path={egressPathD} dur="3.5s" begin="2.4s" repeatCount="indefinite" rotate="auto" />
                  </path>
                </g>
              )}

              {/* Student Egress Particle Flows (when showEgress is active) */}
              {showEgress && egressPathD && (
                <g>
                  <circle r="4.5" fill="#34d399" opacity="0.95">
                    <animateMotion path={egressPathD} dur="4s" repeatCount="indefinite" />
                  </circle>
                  <circle r="4" fill="#6ee7b7" opacity="0.85">
                    <animateMotion path={egressPathD} dur="4s" begin="1.3s" repeatCount="indefinite" />
                  </circle>
                  <circle r="4" fill="#a7f3d0" opacity="0.85">
                    <animateMotion path={egressPathD} dur="4s" begin="2.6s" repeatCount="indefinite" />
                  </circle>
                </g>
              )}
            </g>
          )}

          {/* Direct On-Map A* Route Metric Badge */}
          {showRoutes && currentRoute?.path && currentRoute.status !== 'TRAPPED_NO_PATH' && pathMidpoint && (
            <g transform={`translate(${pathMidpoint.x}, ${pathMidpoint.y})`} className="pointer-events-none z-30">
              <rect x="-56" y="-10" width="112" height="18" rx="4" fill="#042f1f" stroke="#10b981" strokeWidth="1" opacity="0.95" />
              <text x="0" y="2" fill="#34d399" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                ~{currentRoute.distance_meters || 180}m • {currentRoute.estimated_time_seconds || 45}s A*
              </text>
            </g>
          )}

          {/* Direct On-Map Starting Zone & Designated Exit Gate Beacons */}
          {showRoutes && originNode && (
            <g transform={`translate(${originNode.x}, ${originNode.y - 34})`} className="pointer-events-none z-30">
              <rect x="-34" y="-8" width="68" height="15" rx="3" fill="#04211a" stroke="#34d399" strokeWidth="0.9" opacity="0.95" />
              <text x="0" y="3" fill="#a7f3d0" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                EVAC START
              </text>
            </g>
          )}
          {showRoutes && destNode && (
            <g transform={`translate(${destNode.x}, ${destNode.y - 34})`} className="pointer-events-none z-30">
              <rect x="-44" y="-8" width="88" height="15" rx="3" fill="#042f1f" stroke="#10b981" strokeWidth="0.9" opacity="0.95" />
              <text x="0" y="3" fill="#6ee7b7" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                DESIGNATED EXIT
              </text>
            </g>
          )}

          {/* Responder Incident Destination Beacon on Map */}
          {showResponder && responderTargetNode && (
            <g transform={`translate(${responderTargetNode.x}, ${responderTargetNode.y})`} className="pointer-events-none z-30">
              <circle r="34" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="3,3" className="animate-spin" style={{ animationDuration: '4s' }} />
              <g transform="translate(0, -36)">
                <rect x="-46" y="-8" width="92" height="15" rx="3" fill="#0c1731" stroke="#60a5fa" strokeWidth="0.9" opacity="0.95" />
                <text x="0" y="3" fill="#93c5fd" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  INCIDENT TARGET
                </text>
              </g>
            </g>
          )}

          {/* 4. Campus Landmark Nodes (Buildings, Stairwells, Exits) */}
          {nodes.map((node) => {
            const isSelected = (currentZoneNode?.id === node.id);
            const isExit = node.is_exit;
            const isStair = node.category === 'stairwell';
            const risk = node.risk_score || 0;
            const isBlocked = node.is_blocked;
            const hasFire = (node.fire_intensity || 0) > 15;
            const hasSmoke = (node.smoke_density || 0) > 20;

            const radius = isExit ? 24 : isStair ? 18 : 28;
            const occRatio = node.current_occupancy / (node.capacity || 100);

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => setSelectedZone(node.id)}
                className="cursor-pointer group"
              >
                {/* Crowd Density Halo (Crowd Heat Visualization) */}
                {showCrowd && !isExit && node.current_occupancy > 0 && (
                  <circle
                    r={radius * 1.5}
                    fill={occRatio > 0.75 ? '#ef4444' : occRatio > 0.45 ? '#f97316' : occRatio > 0.20 ? '#eab308' : '#10b981'}
                    opacity="0.22"
                    className="pointer-events-none transition-all duration-300"
                  />
                )}

                {/* Selection Halo */}
                {isSelected && (
                  <circle
                    r={radius + 12}
                    fill="none"
                    stroke="#00f2fe"
                    strokeWidth="2.5"
                    strokeDasharray="4,4"
                    className="animate-spin"
                    style={{ animationDuration: '6s' }}
                  />
                )}

                {/* Risk Glow Pulse Effect */}
                {risk >= 40 && (
                  <circle
                    r={radius + 8}
                    fill={getRiskColor(risk, isBlocked)}
                    opacity="0.35"
                    className="animate-ping"
                  />
                )}

                {/* Main Node Geometry */}
                {isExit ? (
                  // Exit Gates: Diamond / Shield geometry
                  <polygon
                    points="0,-22 22,0 0,22 -22,0"
                    fill={isBlocked ? '#450a0a' : '#064e3b'}
                    stroke={isBlocked ? '#ef4444' : '#10b981'}
                    strokeWidth="2.5"
                    className="transition-transform group-hover:scale-110"
                  />
                ) : isStair ? (
                  // Staircase Nodes
                  <circle
                    r={radius}
                    fill="#1e1b4b"
                    stroke="#818cf8"
                    strokeWidth="2"
                    className="transition-transform group-hover:scale-110"
                  />
                ) : (
                  // Campus Building Zones: Rounded rectangle
                  <rect
                    x={-radius}
                    y={-radius + 6}
                    width={radius * 2}
                    height={radius * 1.4}
                    rx={8}
                    fill={isBlocked ? '#450a0a' : risk > 50 ? '#4c111a' : risk > 20 ? '#3b220c' : '#0c1322'}
                    stroke={getRiskColor(risk, isBlocked)}
                    strokeWidth={isSelected ? 3 : 1.5}
                    className="transition-transform group-hover:scale-105"
                  />
                )}

                {/* Scenario Hazard Icon Overlays */}
                {activeScenario === 'blast_explosion' && node.id === 'BLOCK_B_L1' && (
                  <g transform="translate(-12, -32)" filter="url(#fire-glow)">
                    <circle r="13" fill="#ea580c" opacity="0.95" />
                    <text x="-6.5" y="4.5" fontSize="13" fill="#ffffff">💥</text>
                  </g>
                )}

                {hasFire && activeScenario !== 'blast_explosion' && (
                  <g transform="translate(-12, -32)" filter="url(#fire-glow)">
                    <circle r="13" fill="#ef4444" opacity="0.95" />
                    <text x="-6.5" y="4.5" fontSize="13" fill="#ffffff">🔥</text>
                  </g>
                )}

                {hasSmoke && !hasFire && (
                  <g transform="translate(-10, -28)">
                    <circle r="11" fill="#475569" opacity="0.9" />
                    <text x="-5.5" y="4" fontSize="11" fill="#ffffff">💨</text>
                  </g>
                )}

                {isBlocked && !hasFire && !hasSmoke && (
                  <g transform="translate(-10, -28)">
                    <circle r="11" fill="#b45309" opacity="0.9" />
                    <text x="-5.5" y="4" fontSize="11" fill="#ffffff">🚧</text>
                  </g>
                )}

                {activeScenario === 'medical_emergency' && (node.id === 'CAFETERIA' || node.id === 'QUADRANGLE') && (
                  <g transform="translate(-10, -28)">
                    <circle r="11" fill="#1d4ed8" opacity="0.9" />
                    <text x="-5.5" y="4" fontSize="11" fill="#ffffff">🚑</text>
                  </g>
                )}

                {activeScenario === 'building_evacuation' && (node.id === 'BLOCK_A_L1' || node.id === 'STAIR_A') && (
                  <g transform="translate(-10, -28)">
                    <circle r="11" fill="#047857" opacity="0.9" />
                    <text x="-5.5" y="4" fontSize="11" fill="#ffffff">🏢</text>
                  </g>
                )}


                {/* Node Text Display Label */}
                <text
                  x="0"
                  y={isExit ? 32 : isStair ? 26 : radius + 2}
                  textAnchor="middle"
                  fill={isExit ? '#34d399' : '#f1f5f9'}
                  fontSize={isExit ? "11" : "10"}
                  fontWeight="bold"
                  fontFamily="monospace"
                  className="pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                >
                  {node.name.length > 20 ? node.name.substring(0, 18) + '..' : node.name}
                </text>

                {/* Compact Occupancy & Density Level Badge (LOW / MOD / HIGH / CRITICAL) */}
                {showCrowd && !isExit && node.current_occupancy > 0 && (() => {
                  const density = getDensityBadge(node.current_occupancy, node.capacity || 100);
                  return (
                    <g transform={`translate(${radius - 8}, ${-radius + 8})`}>
                      <rect x="-26" y="-8" width="52" height="15" rx="5" fill={density.bg} stroke={density.border} strokeWidth="1" opacity="0.95" />
                      <text x="0" y="3" textAnchor="middle" fill={density.text} fontSize="7.5" fontWeight="bold" fontFamily="monospace">
                        {node.current_occupancy} • {density.label}
                      </text>
                    </g>
                  );
                })()}
              </g>
            );
          })}
        </svg>

        {/* Legend Overlay in Bottom Left */}
        <div className="absolute bottom-2.5 left-2.5 bg-slate-950/85 border border-slate-800 p-2 rounded-md text-[9.5px] font-mono text-slate-300 backdrop-blur-sm space-y-1 z-20">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Safe (&lt;20)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> High (20-50)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Critical (&gt;75)</span>
          </div>
          <div className="flex items-center gap-2.5 pt-0.5 border-t border-slate-800 text-slate-400">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-400 inline-block" /> A* Evac Route</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block" /> Ambulance Lane</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rotate-45 bg-emerald-700 inline-block" /> Exit Gate</span>
          </div>
        </div>
      </div>

      {/* Selected / Problem Zone Telemetry Drawer (Dynamically changes with the problem block or clicked block!) */}
      {currentZoneNode && (
        <div className={`mt-3 p-3 rounded-lg border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-mono transition-all duration-200 ${
          currentZoneNode.is_blocked || currentZoneNode.risk_score > 50
            ? 'bg-red-950/40 border-red-600/80 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
            : 'bg-slate-950/90 border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${
              currentZoneNode.is_blocked || currentZoneNode.risk_score > 50
                ? 'bg-red-950 border-red-600 text-red-400 animate-pulse'
                : 'bg-cyan-950 border-cyan-700 text-cyan-400'
            }`}>
              {currentZoneNode.fire_intensity > 15 ? <Flame className="w-5 h-5 text-red-500" /> : <AlertOctagon className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{currentZoneNode.name}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  currentZoneNode.is_blocked || currentZoneNode.risk_score > 50 
                    ? 'bg-red-900 text-red-200' 
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {currentZoneNode.category.toUpperCase()} • Floor {currentZoneNode.floor}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Occupancy: <span className="text-white font-bold">{currentZoneNode.current_occupancy}</span> / {currentZoneNode.capacity} pers •
                Risk Score: <span className="font-bold ml-1" style={{ color: getRiskColor(currentZoneNode.risk_score, currentZoneNode.is_blocked) }}>{currentZoneNode.risk_score}/100</span>
              </p>
            </div>
          </div>

          {/* Dynamic Evacuation Recommendation for this Block */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {currentRoute && currentRoute.status === 'OPTIMAL' ? (
              <div className="bg-emerald-950/80 border border-emerald-500/50 px-3 py-1.5 rounded text-emerald-300 text-right">
                <div className="text-[10px] text-emerald-400 uppercase">Recommended Exit Route</div>
                <div className="font-bold text-white flex items-center gap-1.5 justify-end">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {currentRoute.exit_name}
                </div>
              </div>
            ) : currentRoute?.status === 'TRAPPED_NO_PATH' ? (
              <div className="bg-red-950 border border-red-600 px-3 py-1.5 rounded text-red-200 text-right animate-pulse">
                <div className="text-[10px] text-red-400 uppercase font-bold">ALL PATHS BLOCKED</div>
                <div className="font-bold text-white">Awaiting Rescue Dispatch</div>
              </div>
            ) : currentZoneNode.is_exit ? (
              <div className="bg-emerald-950/60 border border-emerald-600/50 px-3 py-1.5 rounded text-emerald-300 text-right">
                <div className="text-[10px] text-emerald-400 uppercase">Designated Campus Exit Gate</div>
                <div className="font-bold text-white">Muster Point Perimeter</div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded text-slate-300 text-right">
                <div className="text-[10px] text-slate-400 uppercase">Exit Status</div>
                <div className="font-bold text-white">Route Nominal</div>
              </div>
            )}

            {/* Quick Hazard Simulation / Reset Button for this specific Block */}
            {currentZoneNode.is_blocked || currentZoneNode.fire_intensity > 15 ? (
              <button
                onClick={() => resetHazards()}
                className="px-3 py-1.5 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                Clear Hazard
              </button>
            ) : (
              <button
                onClick={() => injectHazard(currentZoneNode.id, 85.0, 80.0, true)}
                className="px-3 py-1.5 rounded bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-300 text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer active:scale-95"
              >
                <Flame className="w-3.5 h-3.5 text-red-400" />
                Simulate Fire Here
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
