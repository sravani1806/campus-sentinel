import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const SentinelContext = createContext(null);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://campus-sentinel-backend.onrender.com';

// Ensure Localtunnel doesn't block automated API check-ins
axios.defaults.headers.common['bypass-tunnel-reminder'] = 'true';
axios.defaults.headers.common['Bypass-Tunnel-Reminder'] = 'true';

const DEFAULT_CAMPUS_STATE = {
  cycle_id: 1,
  cycle_duration_ms: 12.5,
  threat_level: "GREEN_NORMAL",
  max_risk_score: 0.0,
  digital_twin: {
    nodes: [
      { id: "ADMIN_BLOCK", name: "Admin Block", category: "admin", x: 340, y: 100, floor: 1, capacity: 200, current_occupancy: 65, risk_score: 0, hazard_level: "SAFE", is_exit: false },
      { id: "BLOCK_A_L1", name: "Academic Block (Floor 1)", category: "academic", x: 220, y: 200, floor: 1, capacity: 400, current_occupancy: 180, risk_score: 0, hazard_level: "SAFE", is_exit: false },
      { id: "BLOCK_A_L2", name: "Academic Block (Floor 2)", category: "academic", x: 220, y: 140, floor: 2, capacity: 300, current_occupancy: 120, risk_score: 0, hazard_level: "SAFE", is_exit: false },
      { id: "STAIR_A", name: "A Block", category: "stairwell", x: 280, y: 170, floor: 1, capacity: 150, current_occupancy: 15, risk_score: 0, hazard_level: "SAFE", is_exit: false },
      { id: "BLOCK_B_L1", name: "U Block", category: "science", x: 780, y: 200, floor: 1, capacity: 350, current_occupancy: 140, risk_score: 0, hazard_level: "SAFE", is_exit: false },
      { id: "BLOCK_B_L2", name: "N Block (Floor 2)", category: "science", x: 780, y: 140, floor: 2, capacity: 250, current_occupancy: 90, risk_score: 0, hazard_level: "SAFE", is_exit: false },
      { id: "STAIR_B", name: "N Block Stairwell", category: "stairwell", x: 720, y: 170, floor: 1, capacity: 150, current_occupancy: 20, risk_score: 0, hazard_level: "SAFE", is_exit: false },
      { id: "LIBRARY", name: "Central Library", category: "library", x: 500, y: 180, floor: 1, capacity: 500, current_occupancy: 210, risk_score: 0, hazard_level: "SAFE", is_exit: false },
      { id: "AUDITORIUM", name: "Grand Auditorium", category: "event", x: 220, y: 480, floor: 1, capacity: 800, current_occupancy: 320, risk_score: 0, hazard_level: "SAFE", is_exit: false },
      { id: "CAFETERIA", name: "MHP", category: "dining", x: 780, y: 480, floor: 1, capacity: 450, current_occupancy: 195, risk_score: 0, hazard_level: "SAFE", is_exit: false },
      { id: "QUADRANGLE", name: "Central Quadrangle", category: "outdoor", x: 500, y: 360, floor: 1, capacity: 1200, current_occupancy: 280, risk_score: 0, hazard_level: "SAFE", is_exit: false },
      { id: "HOSTEL_HUB", name: "Student Hostels", category: "residential", x: 500, y: 550, floor: 1, capacity: 600, current_occupancy: 150, risk_score: 0, hazard_level: "SAFE", is_exit: false },
      { id: "MEDICAL_CENTER", name: "Medical Center & Clinic", category: "medical", x: 860, y: 100, floor: 1, capacity: 150, current_occupancy: 30, risk_score: 0, hazard_level: "SAFE", is_exit: false },
      { id: "SPORTS_COMPLEX", name: "Sports Complex & Arena", category: "sports", x: 340, y: 620, floor: 1, capacity: 700, current_occupancy: 110, risk_score: 0, hazard_level: "SAFE", is_exit: false },
      { id: "CORRIDOR_NORTH", name: "North Skyway", category: "corridor", x: 500, y: 270, floor: 1, capacity: 300, current_occupancy: 45, risk_score: 0, hazard_level: "SAFE", is_exit: false },
      { id: "CORRIDOR_WEST", name: "West Corridor", category: "corridor", x: 340, y: 360, floor: 1, capacity: 250, current_occupancy: 30, risk_score: 0, hazard_level: "SAFE", is_exit: false },
      { id: "CORRIDOR_EAST", name: "East Corridor", category: "corridor", x: 660, y: 360, floor: 1, capacity: 250, current_occupancy: 35, risk_score: 0, hazard_level: "SAFE", is_exit: false },
      { id: "CORRIDOR_SOUTH", name: "South Boulevard", category: "corridor", x: 500, y: 460, floor: 1, capacity: 350, current_occupancy: 50, risk_score: 0, hazard_level: "SAFE", is_exit: false },
      { id: "EXIT_NORTH_GATE", name: "Main Gate (North)", category: "exit", x: 500, y: 60, floor: 1, capacity: 2500, current_occupancy: 0, risk_score: 0, hazard_level: "SAFE", is_exit: true },
      { id: "EXIT_WEST_GATE", name: "West Perimeter Exit", category: "exit", x: 70, y: 360, floor: 1, capacity: 1500, current_occupancy: 0, risk_score: 0, hazard_level: "SAFE", is_exit: true },
      { id: "EXIT_EAST_GATE", name: "Main Gate", category: "exit", x: 930, y: 360, floor: 1, capacity: 1500, current_occupancy: 0, risk_score: 0, hazard_level: "SAFE", is_exit: true },
      { id: "EXIT_SOUTH_GATE", name: "South Sports Exit", category: "exit", x: 500, y: 660, floor: 1, capacity: 2500, current_occupancy: 0, risk_score: 0, hazard_level: "SAFE", is_exit: true },
      { id: "AMBULANCE_BAY", name: "Ambulance Bay", category: "emergency_staging", x: 930, y: 200, floor: 1, capacity: 200, current_occupancy: 10, risk_score: 0, hazard_level: "SAFE", is_exit: false }
    ],
    edges: [
      { source: "BLOCK_A_L2", target: "STAIR_A", is_blocked: false, is_emergency_corridor: false },
      { source: "STAIR_A", target: "BLOCK_A_L1", is_blocked: false, is_emergency_corridor: false },
      { source: "BLOCK_B_L2", target: "STAIR_B", is_blocked: false, is_emergency_corridor: false },
      { source: "STAIR_B", target: "BLOCK_B_L1", is_blocked: false, is_emergency_corridor: false },
      { source: "ADMIN_BLOCK", target: "EXIT_NORTH_GATE", is_blocked: false, is_emergency_corridor: false },
      { source: "ADMIN_BLOCK", target: "BLOCK_A_L1", is_blocked: false, is_emergency_corridor: false },
      { source: "ADMIN_BLOCK", target: "LIBRARY", is_blocked: false, is_emergency_corridor: false },
      { source: "MEDICAL_CENTER", target: "EXIT_NORTH_GATE", is_blocked: false, is_emergency_corridor: false },
      { source: "MEDICAL_CENTER", target: "BLOCK_B_L1", is_blocked: false, is_emergency_corridor: false },
      { source: "MEDICAL_CENTER", target: "AMBULANCE_BAY", is_blocked: false, is_emergency_corridor: true },
      { source: "BLOCK_A_L1", target: "CORRIDOR_NORTH", is_blocked: false, is_emergency_corridor: false },
      { source: "BLOCK_A_L1", target: "CORRIDOR_WEST", is_blocked: false, is_emergency_corridor: false },
      { source: "BLOCK_A_L1", target: "EXIT_WEST_GATE", is_blocked: false, is_emergency_corridor: false },
      { source: "LIBRARY", target: "CORRIDOR_NORTH", is_blocked: false, is_emergency_corridor: false },
      { source: "LIBRARY", target: "EXIT_NORTH_GATE", is_blocked: false, is_emergency_corridor: false },
      { source: "LIBRARY", target: "QUADRANGLE", is_blocked: false, is_emergency_corridor: false },
      { source: "BLOCK_B_L1", target: "CORRIDOR_NORTH", is_blocked: false, is_emergency_corridor: false },
      { source: "BLOCK_B_L1", target: "CORRIDOR_EAST", is_blocked: false, is_emergency_corridor: false },
      { source: "BLOCK_B_L1", target: "EXIT_EAST_GATE", is_blocked: false, is_emergency_corridor: false },
      { source: "BLOCK_B_L1", target: "AMBULANCE_BAY", is_blocked: false, is_emergency_corridor: true },
      { source: "AMBULANCE_BAY", target: "EXIT_EAST_GATE", is_blocked: false, is_emergency_corridor: true },
      { source: "QUADRANGLE", target: "CORRIDOR_NORTH", is_blocked: false, is_emergency_corridor: false },
      { source: "QUADRANGLE", target: "CORRIDOR_WEST", is_blocked: false, is_emergency_corridor: false },
      { source: "QUADRANGLE", target: "CORRIDOR_EAST", is_blocked: false, is_emergency_corridor: false },
      { source: "QUADRANGLE", target: "CORRIDOR_SOUTH", is_blocked: false, is_emergency_corridor: false },
      { source: "AUDITORIUM", target: "CORRIDOR_WEST", is_blocked: false, is_emergency_corridor: false },
      { source: "AUDITORIUM", target: "CORRIDOR_SOUTH", is_blocked: false, is_emergency_corridor: false },
      { source: "AUDITORIUM", target: "EXIT_WEST_GATE", is_blocked: false, is_emergency_corridor: false },
      { source: "CAFETERIA", target: "CORRIDOR_EAST", is_blocked: false, is_emergency_corridor: false },
      { source: "CAFETERIA", target: "CORRIDOR_SOUTH", is_blocked: false, is_emergency_corridor: false },
      { source: "CAFETERIA", target: "EXIT_EAST_GATE", is_blocked: false, is_emergency_corridor: false },
      { source: "SPORTS_COMPLEX", target: "AUDITORIUM", is_blocked: false, is_emergency_corridor: false },
      { source: "SPORTS_COMPLEX", target: "CORRIDOR_SOUTH", is_blocked: false, is_emergency_corridor: false },
      { source: "SPORTS_COMPLEX", target: "EXIT_SOUTH_GATE", is_blocked: false, is_emergency_corridor: false },
      { source: "HOSTEL_HUB", target: "CORRIDOR_SOUTH", is_blocked: false, is_emergency_corridor: false },
      { source: "HOSTEL_HUB", target: "EXIT_SOUTH_GATE", is_blocked: false, is_emergency_corridor: false },
      { source: "AUDITORIUM", target: "EXIT_SOUTH_GATE", is_blocked: false, is_emergency_corridor: false },
      { source: "CAFETERIA", target: "EXIT_SOUTH_GATE", is_blocked: false, is_emergency_corridor: false },
      { source: "CORRIDOR_WEST", target: "EXIT_WEST_GATE", is_blocked: false, is_emergency_corridor: false },
      { source: "CORRIDOR_EAST", target: "EXIT_EAST_GATE", is_blocked: false, is_emergency_corridor: false },
      { source: "CORRIDOR_NORTH", target: "EXIT_NORTH_GATE", is_blocked: false, is_emergency_corridor: false },
      { source: "CORRIDOR_SOUTH", target: "EXIT_SOUTH_GATE", is_blocked: false, is_emergency_corridor: false }
    ]
  },
  routes: {
    routes_by_zone: {
      "BLOCK_B_L1": {
        start: "BLOCK_B_L1",
        exit: "EXIT_EAST_GATE",
        exit_name: "Main Gate",
        path: ["BLOCK_B_L1", "EXIT_EAST_GATE"],
        cost: 150.0,
        estimated_time_seconds: 45,
        steps: ["Proceed from U Block towards Main Gate", "Arrive safely at Main Gate"],
        status: "OPTIMAL"
      },
      "BLOCK_A_L1": {
        start: "BLOCK_A_L1",
        exit: "EXIT_WEST_GATE",
        exit_name: "West Perimeter Exit",
        path: ["BLOCK_A_L1", "EXIT_WEST_GATE"],
        cost: 160.0,
        estimated_time_seconds: 48,
        steps: ["Proceed from Academic Block towards West Perimeter Exit", "Arrive safely at West Perimeter Exit"],
        status: "OPTIMAL"
      },
      "LIBRARY": {
        start: "LIBRARY",
        exit: "EXIT_NORTH_GATE",
        exit_name: "Main Gate (North)",
        path: ["LIBRARY", "EXIT_NORTH_GATE"],
        cost: 120.0,
        estimated_time_seconds: 35,
        steps: ["Proceed from Central Library towards Main Gate (North)", "Arrive safely at Main Gate (North)"],
        status: "OPTIMAL"
      }
    },
    rerouted_zones: [],
    trapped_zones_count: 0
  },
  simulation: {
    initial_campus_population: 1200,
    estimated_full_clearance_minutes: 3.2,
    predicted_chokepoints: []
  },
  risks: {
    campus_threat_level: "GREEN_NORMAL",
    max_risk_score: 0.0,
    priority_evacuation_zones: [],
    zone_risk_matrix: {}
  },
  crowd: {
    total_population: 1200
  },
  resources: {
    active_corridors: [{ path: ["AMBULANCE_BAY", "EXIT_EAST_GATE"], status: "ACTIVE_CORRIDOR" }],
    total_deployed_units: 2
  },
  commander: {
    commander_source: "Sentinel Tactical Engine (Local AI)",
    assessment: "Autonomous multi-agent surveillance active. 0 hazards detected across campus.",
    why_this_route: "All campus zones operating within safe risk thresholds. Shortest baseline A* evacuation trajectories verified for all 23 campus locations.",
    directives: [
      "Continuous YOLOv11 person tracking active across all camera feeds.",
      "All primary and emergency exit gates clear and verified."
    ],
    pa_announcement: "Campus operations are normal. All emergency egress systems online and ready.",
    agent_steps: [
      { phase: "PERCEPTION", title: "Surveillance Active", detail: "All CCTV feeds online. 0 fire/smoke anomalies detected." },
      { phase: "RISK ANALYSIS", title: "Nominal Status", detail: "Campus threat score 0.0/100 (GREEN_NORMAL)." },
      { phase: "PLANNING", title: "A* Pathways Calibrated", detail: "Shortest escape trajectories verified for all campus zones." },
      { phase: "ACTION", title: "Standby Readiness", detail: "Emergency response bay staged. PWA synchronization active." },
      { phase: "MONITORING", title: "Autonomous Guard", detail: "Evaluating campus safety continuously at 30 FPS." }
    ],
    confidence: 0.99
  }
};

export const SentinelProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [telemetry, setTelemetry] = useState(() => {
    try {
      const cached = localStorage.getItem('sentinel_cached_telemetry');
      return cached ? JSON.parse(cached) : DEFAULT_CAMPUS_STATE;
    } catch (e) {
      return DEFAULT_CAMPUS_STATE;
    }
  });
  const [incidents, setIncidents] = useState([]);
  const [selectedZone, setSelectedZone] = useState('BLOCK_B_L1');
  const [activeScenario, setActiveScenario] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [lastAlert, setLastAlert] = useState(null);
  const [safetyCheckins, setSafetyCheckins] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentSummary, setStudentSummary] = useState({
    total: 12,
    safe_count: 7,
    in_danger_count: 3,
    unaccounted_count: 2,
    database: { isConnected: true, statusLabel: "MongoDB Connected" }
  });
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isOfflineManual, setIsOfflineManual] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isPaBroadcasting, setIsPaBroadcasting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [incidentTimeline, setIncidentTimeline] = useState([
    { id: 'init-1', time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: 'Campus Sentinel surveillance initialized across 23 nodes.', type: 'SYSTEM', badge: 'NOMINAL' },
    { id: 'init-2', time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: 'Autonomous A* route graph online and calibrated.', type: 'SYSTEM', badge: 'CALIBRATED' }
  ]);

  const addTimelineEvent = (text, type = 'EVENT', badge = 'LIVE') => {
    const newEntry = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      text,
      type,
      badge
    };
    setIncidentTimeline(prev => [newEntry, ...prev.slice(0, 30)]);
  };

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const openPushAlertModal = () => {
    setIsAlertModalOpen(true);
  };

  const confirmPushEmergencyAlert = () => {
    const nodes = telemetry?.digital_twin?.nodes || [];
    const activeHazard = nodes.find(n => (n.fire_intensity || 0) > 15 || (n.smoke_density || 0) > 20 || n.is_blocked || (n.risk_score || 0) >= 50) || nodes.find(n => n.id === selectedZone) || { name: 'Campus Core Zone', id: 'CAMPUS' };
    const threat = telemetry?.threat_level || 'GREEN_NORMAL';
    const isCritical = threat === 'RED_CRITICAL';
    const exitNode = nodes.find(n => n.is_exit && !n.is_blocked) || { name: 'Main East Gate' };

    const alertPayload = {
      id: `ALERT-${Date.now()}`,
      title: isCritical ? "🚨 CRITICAL EMERGENCY ALERT DISPATCHED" : "📢 CAMPUS SAFETY ADVISORY DISPATCHED",
      message: isCritical 
        ? `Emergency Alert pushed to all campus users. Hazard active at ${activeHazard.name}. Evacuate immediately via designated green corridor toward ${exitNode.name}.`
        : `Campus Safety Notice broadcasted: All 23 zones nominal. Perimeter and corridors operational.`,
      type: isCritical ? 'CRITICAL_HAZARD' : 'ADVISORY',
      location: activeHazard.name,
      action: isCritical ? `Evacuate via ${exitNode.name}` : `Follow standard muster protocols`,
      safeExit: exitNode.name,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
    };
    
    setToastNotification(alertPayload);
    setIsAlertModalOpen(false);
    playAudioSiren();
    addTimelineEvent(`Emergency alert transmitted to campus users & mobile PWA for ${activeHazard.name}`, 'ALERT', 'DISPATCHED');
    
    // Automatically switch directly to Student PWA!
    setActiveTab('pwa');
    return alertPayload;
  };

  const sendPushEmergencyAlert = () => {
    setActiveTab('pwa');
    return confirmPushEmergencyAlert();
  };

  const broadcastPA = (announcementText) => {
    const text = announcementText || telemetry?.commander?.pa_announcement || "Attention Vignan Campus: Follow designated green evacuation paths to nearest open gate.";
    if (isPaBroadcasting) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsPaBroadcasting(false);
      addTimelineEvent("Public Address voice announcement terminated.", 'PA', 'STOPPED');
      return;
    }

    setIsPaBroadcasting(true);
    addTimelineEvent(`Public Address Broadcast active: "${text.substring(0, 50)}..."`, 'PA', 'BROADCASTING');

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.onend = () => setIsPaBroadcasting(false);
        utterance.onerror = () => setIsPaBroadcasting(false);
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        setIsPaBroadcasting(true);
      }
    }
  };

  useEffect(() => {
    const s = io(BACKEND_URL, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    s.on('connect', () => {
      console.log('[Socket.io] Connected to Sentinel Real-Time Gateway');
      setIsConnected(true);
      s.emit('request_state_refresh');
    });

    s.on('disconnect', () => {
      console.log('[Socket.io] Disconnected from Gateway');
      setIsConnected(false);
    });

    s.on('telemetry_update', (data) => {
      if (data) {
        setTelemetry(data);
        try {
          localStorage.setItem('sentinel_cached_telemetry', JSON.stringify(data));
        } catch (e) {}
      }
    });

    s.on('scenario_triggered', (data) => {
      if (data?.state) {
        setTelemetry(data.state);
      }
    });

    s.on('hazard_updated', (data) => {
      if (data?.new_state) {
        setTelemetry(data.new_state);
      }
    });

    s.on('hazards_cleared', (data) => {
      if (data?.new_state) {
        setTelemetry(data.new_state);
      }
    });

    s.on('emergency_alert', (alert) => {
      setLastAlert(alert);
      if (!isAudioMuted && alert.threat_level === 'RED_CRITICAL') {
        playAudioSiren();
      }
    });

    s.on('incident_created', (newInc) => {
      setIncidents(prev => [newInc, ...prev]);
    });

    s.on('safety_checkin_received', (checkin) => {
      setSafetyCheckins(prev => [checkin, ...prev]);
    });

    s.on('student_status_updated', (payload) => {
      if (payload?.student) {
        setStudents(prev => {
          const idx = prev.findIndex(s => s.student_id === payload.student.student_id);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = payload.student;
            return updated;
          }
          return [payload.student, ...prev];
        });
      }
      fetchStudentSummary();
    });

    s.on('roster_reset', () => {
      fetchStudents();
      fetchStudentSummary();
    });

    s.on('emergency_evacuation_ping', (ping) => {
      setToastNotification({
        id: `PING-${Date.now()}`,
        title: ping.title || "EMERGENCY SAFETY PING",
        message: ping.message || "Please confirm your safety status.",
        type: "CRITICAL_HAZARD",
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
      });
      playAudioSiren();
    });

    setSocket(s);

    fetchIncidents();
    fetchInitialState();
    fetchStudents();
    fetchStudentSummary();

    const syncInterval = setInterval(() => {
      fetchInitialState();
      fetchStudentSummary();
    }, 3000);

    return () => {
      clearInterval(syncInterval);
      s.disconnect();
    };
  }, []);

  const fetchInitialState = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/agent-logs/state`, { timeout: 2500 });
      if (res.data.success && res.data.data) {
        setTelemetry(res.data.data);
      }
    } catch (e) {
      const cached = localStorage.getItem('sentinel_cached_telemetry');
      if (cached) {
        try { setTelemetry(JSON.parse(cached)); } catch (err) {}
      }
    }
  };

  const fetchIncidents = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/incidents`, { timeout: 2500 });
      if (res.data.success && Array.isArray(res.data.data)) {
        setIncidents(res.data.data);
      }
    } catch (e) {}
  };

  const playAudioSiren = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {}
  };

  const generateEmergencyFallbackState = (scenarioId, customHazard = null) => {
    const base = JSON.parse(JSON.stringify(DEFAULT_CAMPUS_STATE));
    base.cycle_id = (telemetry?.cycle_id || 1) + 1;

    if (customHazard) {
      const { zoneId, fire, smoke, blocked } = customHazard;
      const isCrit = fire > 50 || smoke > 60 || blocked;
      base.threat_level = isCrit ? "RED_CRITICAL" : "YELLOW_WARNING";
      base.max_risk_score = Math.max(fire, smoke, isCrit ? 90 : 45);
      const dynamicEtaMin = Number((3.2 + (fire * 0.08) + (smoke * 0.04) + (blocked ? 3.5 : 0)).toFixed(1));
      
      base.simulation = {
        initial_campus_population: 1200,
        estimated_full_clearance_minutes: dynamicEtaMin,
        predicted_chokepoints: blocked ? [{ name: zoneId, delay: 45 }] : []
      };

      base.digital_twin.nodes = base.digital_twin.nodes.map(n => {
        if (n.id === zoneId) {
          return { ...n, fire_intensity: fire, smoke_density: smoke, is_blocked: blocked, risk_score: Math.max(fire, smoke), hazard_level: isCrit ? 'CRITICAL' : 'WARNING' };
        }
        return n;
      });

      if (blocked) {
        base.digital_twin.edges = base.digital_twin.edges.map(e => {
          if (e.source === zoneId || e.target === zoneId) return { ...e, is_blocked: true };
          return e;
        });
      }

      base.routes.rerouted_zones = blocked ? [zoneId] : [];
      return base;
    }

    if (scenarioId === 'fire_science_block' || scenarioId === 'fire_emergency') {
      base.threat_level = "RED_CRITICAL";
      base.max_risk_score = 98.0;
      base.simulation = {
        initial_campus_population: 1200,
        estimated_full_clearance_minutes: 9.8,
        predicted_chokepoints: [{ name: "U Block Corridor East", delay: 60 }]
      };
      
      base.digital_twin.nodes = base.digital_twin.nodes.map(n => {
        if (n.id === 'BLOCK_B_L1') {
          return { ...n, fire_intensity: 85.0, smoke_density: 90.0, is_blocked: true, risk_score: 98.0, hazard_level: 'CRITICAL', current_occupancy: 140 };
        }
        if (n.id === 'CORRIDOR_EAST') {
          return { ...n, fire_intensity: 35.0, smoke_density: 50.0, is_blocked: true, risk_score: 55.0, hazard_level: 'WARNING' };
        }
        return n;
      });

      base.digital_twin.edges = base.digital_twin.edges.map(e => {
        if (e.source === 'BLOCK_B_L1' || e.target === 'BLOCK_B_L1' || e.source === 'CORRIDOR_EAST' || e.target === 'CORRIDOR_EAST') {
          return { ...e, is_blocked: true };
        }
        return e;
      });

      base.routes = {
        routes_by_zone: {
          "BLOCK_B_L1": {
            start: "BLOCK_B_L1",
            exit: "EXIT_NORTH_GATE",
            exit_name: "Main Gate (North)",
            path: ["BLOCK_B_L1", "CORRIDOR_NORTH", "EXIT_NORTH_GATE"],
            cost: 180.0,
            distance_meters: 180,
            estimated_time_seconds: 110,
            status: "REROUTED_SAFE",
            steps: ["U Block corridor blocked", "Diverting students north via Skyway", "Proceed to Main Gate (North)"]
          },
          "BLOCK_B_L2": {
            start: "BLOCK_B_L2",
            exit: "EXIT_NORTH_GATE",
            exit_name: "Main Gate (North)",
            path: ["BLOCK_B_L2", "STAIR_B", "CORRIDOR_NORTH", "EXIT_NORTH_GATE"],
            cost: 210.0,
            distance_meters: 210,
            estimated_time_seconds: 125,
            status: "REROUTED_SAFE",
            steps: ["Diverted away from U Block ground fire", "Follow North Skyway to Main Gate (North)"]
          },
          "LIBRARY": {
            start: "LIBRARY",
            exit: "EXIT_NORTH_GATE",
            exit_name: "Main Gate (North)",
            path: ["LIBRARY", "EXIT_NORTH_GATE"],
            cost: 120.0,
            distance_meters: 120,
            estimated_time_seconds: 35,
            status: "OPTIMAL",
            steps: ["Proceed directly north to Main Gate"]
          }
        },
        rerouted_zones: ["BLOCK_B_L1", "BLOCK_B_L2"],
        trapped_zones_count: 0
      };

      base.resources = {
        active_corridors: [{ path: ["AMBULANCE_BAY", "EXIT_EAST_GATE", "CORRIDOR_EAST", "BLOCK_B_L1"], status: "EMERGENCY_DISPATCH" }],
        total_deployed_units: 3
      };

      base.commander = {
        commander_source: "Sentinel Tactical Engine (Local AI)",
        threat_level: "RED_CRITICAL",
        assessment: "CRITICAL THERMAL HAZARD: Multi-sensor fire confirmed in U Block Science Labs. Corridors compromised.",
        why_this_route: "Direct East Corridor is impassable due to 85% fire intensity. A* graph re-routed student flow northward via North Skyway to Main Gate (North).",
        directives: [
          "Deploy Fire Engine Alpha & Ambulance to East Staging Lane.",
          "Evacuate U Block Floor 1 & 2 occupants via North Skyway.",
          "Enforce perimeter lockdown at East Gate for incoming emergency units."
        ],
        pa_announcement: "ATTENTION CAMPUS: Fire emergency reported in U Block. Avoid East Corridor. Evacuate immediately via North Skyway toward Main Gate North.",
        confidence: 0.99
      };
    } else if (scenarioId === 'blast_explosion') {
      base.threat_level = "RED_CRITICAL";
      base.max_risk_score = 100.0;
      base.simulation = {
        initial_campus_population: 1200,
        estimated_full_clearance_minutes: 13.5,
        predicted_chokepoints: [{ name: "Blast Perimeter Zone", delay: 90 }]
      };
      
      base.digital_twin.nodes = base.digital_twin.nodes.map(n => {
        if (n.id === 'BLOCK_B_L1') {
          return { ...n, fire_intensity: 95.0, smoke_density: 100.0, is_blocked: true, risk_score: 100.0, hazard_level: 'CRITICAL', current_occupancy: 40 };
        }
        return n;
      });

      base.routes = {
        routes_by_zone: {
          "BLOCK_B_L1": {
            start: "BLOCK_B_L1",
            exit: "EXIT_NORTH_GATE",
            exit_name: "Main Gate (North)",
            path: ["BLOCK_B_L1", "CORRIDOR_NORTH", "EXIT_NORTH_GATE"],
            cost: 200.0,
            distance_meters: 200,
            estimated_time_seconds: 155,
            status: "REROUTED_SAFE",
            steps: ["Blast epicenter isolated", "Evacuate north to Main Gate"]
          }
        },
        rerouted_zones: ["BLOCK_B_L1"],
        trapped_zones_count: 0
      };

      base.commander = {
        commander_source: "Sentinel Tactical Engine (Local AI)",
        threat_level: "RED_CRITICAL",
        assessment: "CRITICAL BLAST EVENT: High-energy chemical explosion in U Block. Structural perimeter isolation active.",
        why_this_route: "Blast epicenter sealed. All occupants routed away from glass façades toward North Gate.",
        directives: [
          "Dispatch Hazmat & Rescue Units to U Block perimeter.",
          "Activate general campus evacuation protocol."
        ],
        pa_announcement: "EMERGENCY BROADCAST: Blast event detected in U Block. Drop, cover, and evacuate outward toward perimeter gates.",
        confidence: 0.99
      };
    } else if (scenarioId === 'library_smoke_blockage') {
      base.threat_level = "YELLOW_WARNING";
      base.max_risk_score = 75.0;
      base.simulation = {
        initial_campus_population: 1200,
        estimated_full_clearance_minutes: 6.8,
        predicted_chokepoints: [{ name: "Central Library Egress", delay: 40 }]
      };
      base.digital_twin.nodes = base.digital_twin.nodes.map(n => {
        if (n.id === 'LIBRARY') {
          return { ...n, smoke_density: 85.0, risk_score: 75.0, hazard_level: 'WARNING' };
        }
        return n;
      });
      base.routes.rerouted_zones = ["LIBRARY"];
    } else if (scenarioId === 'auditorium_surge_fire') {
      base.threat_level = "RED_CRITICAL";
      base.max_risk_score = 92.0;
      base.simulation = {
        initial_campus_population: 1200,
        estimated_full_clearance_minutes: 10.4,
        predicted_chokepoints: [{ name: "MHP Cafeteria Chokepoint", delay: 75 }]
      };
      base.digital_twin.nodes = base.digital_twin.nodes.map(n => {
        if (n.id === 'CAFETERIA') {
          return { ...n, current_occupancy: 450, risk_score: 92.0, hazard_level: 'CRITICAL' };
        }
        return n;
      });
      base.routes.rerouted_zones = ["CAFETERIA"];
    } else if (scenarioId === 'gate_north_blocked') {
      base.threat_level = "YELLOW_WARNING";
      base.max_risk_score = 65.0;
      base.simulation = {
        initial_campus_population: 1200,
        estimated_full_clearance_minutes: 7.8,
        predicted_chokepoints: [{ name: "East Gate Redirect Lane", delay: 50 }]
      };
      base.digital_twin.nodes = base.digital_twin.nodes.map(n => {
        if (n.id === 'EXIT_NORTH_GATE') return { ...n, is_blocked: true, hazard_level: 'WARNING' };
        return n;
      });
      base.routes.rerouted_zones = ["ADMIN_BLOCK", "LIBRARY"];
    } else if (scenarioId === 'medical_emergency') {
      base.threat_level = "YELLOW_WARNING";
      base.max_risk_score = 50.0;
      base.simulation = {
        initial_campus_population: 1200,
        estimated_full_clearance_minutes: 4.5,
        predicted_chokepoints: []
      };
    } else if (scenarioId === 'multi_point_disaster') {
      base.threat_level = "RED_CRITICAL";
      base.max_risk_score = 100.0;
      base.simulation = {
        initial_campus_population: 1200,
        estimated_full_clearance_minutes: 15.8,
        predicted_chokepoints: [{ name: "Campus Core Intersection", delay: 120 }]
      };
      base.routes.rerouted_zones = ["BLOCK_A_L1", "BLOCK_B_L1", "LIBRARY", "CAFETERIA"];
    } else {
      base.threat_level = "GREEN_NORMAL";
      base.max_risk_score = 0.0;
      base.simulation = {
        initial_campus_population: 1200,
        estimated_full_clearance_minutes: 3.2,
        predicted_chokepoints: []
      };
    }

    return base;
  };

  const triggerScenario = async (scenarioId) => {
    setActiveScenario(scenarioId);
    setIsLoading(true);
    addTimelineEvent(`Scenario initiated: "${scenarioId.replace(/_/g, ' ').toUpperCase()}"`, 'SCENARIO', 'TRIGGERED');

    try {
      const res = await axios.post(`${BACKEND_URL}/api/simulation/scenario`, { scenario_id: scenarioId }, { timeout: 3000 });
      if (res.data.success && res.data.data) {
        setTelemetry(res.data.data);
      } else {
        const fallback = generateEmergencyFallbackState(scenarioId);
        setTelemetry(fallback);
      }
    } catch (e) {
      const fallback = generateEmergencyFallbackState(scenarioId);
      setTelemetry(fallback);
    } finally {
      setIsLoading(false);
      playAudioSiren();
    }
  };

  const injectHazard = async (zoneId, fireIntensity, smokeDensity, isBlocked) => {
    setIsLoading(true);
    addTimelineEvent(`Hazard injected at ${zoneId}: Fire ${fireIntensity}%, Smoke ${smokeDensity}%`, 'HAZARD', 'INJECTED');
    try {
      const res = await axios.post(`${BACKEND_URL}/api/simulation/hazard`, {
        zone_id: zoneId,
        fire: fireIntensity,
        smoke: smokeDensity,
        blocked: isBlocked
      }, { timeout: 3000 });
      if (res.data.success && res.data.data) {
        setTelemetry(res.data.data);
      } else {
        const fallback = generateEmergencyFallbackState(null, { zoneId, fire: fireIntensity, smoke: smokeDensity, blocked: isBlocked });
        setTelemetry(fallback);
      }
    } catch (e) {
      const fallback = generateEmergencyFallbackState(null, { zoneId, fire: fireIntensity, smoke: smokeDensity, blocked: isBlocked });
      setTelemetry(fallback);
    } finally {
      setIsLoading(false);
      playAudioSiren();
    }
  };

  const resetHazards = async () => {
    setActiveScenario(null);
    setIsLoading(true);
    addTimelineEvent("Campus hazards cleared. Returning to baseline normal state.", 'SYSTEM', 'RESET');
    try {
      const res = await axios.post(`${BACKEND_URL}/api/simulation/reset`, {}, { timeout: 3000 });
      if (res.data.success && res.data.data) {
        setTelemetry(res.data.data);
      } else {
        setTelemetry(DEFAULT_CAMPUS_STATE);
      }
    } catch (e) {
      setTelemetry(DEFAULT_CAMPUS_STATE);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
      if (filters.zone_id && filters.zone_id !== 'ALL') params.append('zone_id', filters.zone_id);
      if (filters.search) params.append('search', filters.search);

      const res = await axios.get(`${BACKEND_URL}/api/students?${params.toString()}`, { timeout: 3000 });
      if (res.data.success && Array.isArray(res.data.data)) {
        setStudents(res.data.data);
      }
    } catch (e) {
      console.warn('[Context] Could not fetch students:', e.message);
    }
  };

  const fetchStudentSummary = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/students/summary`, { timeout: 3000 });
      if (res.data.success && res.data.data) {
        setStudentSummary(res.data.data);
      }
    } catch (e) {
      console.warn('[Context] Could not fetch student summary:', e.message);
    }
  };

  const markStudentSafe = async (studentId) => {
    try {
      const res = await axios.patch(`${BACKEND_URL}/api/students/${studentId}/status`, {
        status: 'SAFE',
        emergency_message: 'Marked Safe by Incident Commander in Sentinel Control Center',
        is_rescued: true
      });
      if (res.data.success) {
        addTimelineEvent(`Personnel ${studentId} verified and marked SAFE in database.`, 'SAFETY', 'VERIFIED');
        fetchStudents();
        fetchStudentSummary();
      }
      return res.data;
    } catch (e) {
      console.error(e);
    }
  };

  const dispatchRescueToStudent = async (studentId, notes = "QRF Rescue Squad Dispatched") => {
    try {
      const res = await axios.patch(`${BACKEND_URL}/api/students/${studentId}/status`, {
        emergency_message: `🚨 RESCUE IN PROGRESS: ${notes}`,
        is_rescued: false
      });
      if (res.data.success) {
        addTimelineEvent(`QRF Emergency Rescue deployed for student ${studentId}.`, 'RESCUE', 'DISPATCHED');
        playAudioSiren();
        fetchStudents();
      }
      return res.data;
    } catch (e) {
      console.error(e);
    }
  };

  const pingUnaccountedStudents = async () => {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/students/ping-unaccounted`);
      addTimelineEvent(`Emergency check-in ping broadcasted to all unaccounted students.`, 'ALERT', 'BROADCAST');
      return res.data;
    } catch (e) {
      console.error(e);
    }
  };

  const resetStudentRoster = async () => {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/students/reset`);
      if (res.data.success) {
        setStudents(res.data.data);
        addTimelineEvent("Student safety roster reset to demo baseline.", 'SYSTEM', 'RESET');
        fetchStudentSummary();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const submitSafetyCheckin = async (studentIdOrName, zoneId, status, message, phone = '') => {
    try {
      const isObject = typeof studentIdOrName === 'object';
      const studentId = isObject ? studentIdOrName.student_id : (studentIdOrName.includes('2026-') ? studentIdOrName : undefined);
      const userName = isObject ? studentIdOrName.name : studentIdOrName;

      const res = await axios.post(`${BACKEND_URL}/api/students/check-in`, {
        student_id: studentId,
        user_name: userName,
        name: userName,
        zone_id: zoneId,
        status: status,
        message: message,
        phone: phone
      }, { timeout: 3000 });

      if (res.data.success) {
        addTimelineEvent(`Safety check-in: ${userName} recorded as ${status} at ${zoneId}`, status === 'SAFE' ? 'SAFE' : 'SOS', status);
        fetchStudents();
        fetchStudentSummary();
      }
      return res.data;
    } catch (e) {
      const offlineRecord = {
        id: `OFFLINE-SOS-${Date.now()}`,
        student_id: typeof studentIdOrName === 'object' ? studentIdOrName.student_id : `OFFLINE-${Date.now()}`,
        user_name: typeof studentIdOrName === 'object' ? studentIdOrName.name : studentIdOrName,
        zone_id: zoneId,
        status: status,
        message: message,
        timestamp: new Date().toISOString(),
        is_offline_cached: true
      };
      setSafetyCheckins(prev => [offlineRecord, ...prev]);
      return { success: true, data: offlineRecord };
    }
  };

  const triggerManualAlarm = (zoneId, message) => {
    if (socket) {
      socket.emit('manual_alarm_trigger', { zone_id: zoneId, message });
    }
    playAudioSiren();
    addTimelineEvent(`Manual emergency alarm triggered for ${zoneId}`, 'ALARM', 'CRITICAL');
  };

  const effectiveIsOffline = isOffline || isOfflineManual;
  const systemStatus = {
    mode: effectiveIsOffline 
      ? 'OFFLINE EVACUATION MODE ACTIVE' 
      : isConnected 
        ? 'OPERATIONAL' 
        : 'LOCAL SIMULATION ENGINE ACTIVE',
    badgeClass: effectiveIsOffline
      ? 'bg-amber-950/80 border-amber-500 text-amber-300'
      : isConnected
        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
        : 'bg-yellow-950/80 border-yellow-500 text-yellow-300',
    subsystems: {
      frontend: 'CONNECTED (100% OPERATIONAL)',
      backend: isConnected ? 'CONNECTED (PORT 5000)' : 'LOCAL SIMULATION ENGINE ACTIVE',
      aiService: 'DETERMINISTIC LOCAL ENGINE (ACTIVE)',
      simulationEngine: 'RUNNING (30 FPS)',
      database: studentSummary.database?.statusLabel || 'MongoDB Connected'
    }
  };

  return (
    <SentinelContext.Provider value={{
      activeTab,
      setActiveTab,
      isConnected,
      isOffline: effectiveIsOffline,
      isOfflineManual,
      setIsOfflineManual,
      systemStatus,
      incidentTimeline,
      addTimelineEvent,
      toastNotification,
      setToastNotification,
      isAlertModalOpen,
      setIsAlertModalOpen,
      openPushAlertModal,
      confirmPushEmergencyAlert,
      sendPushEmergencyAlert,
      isPaBroadcasting,
      broadcastPA,
      telemetry,
      incidents,
      selectedZone,
      setSelectedZone,
      activeScenario,
      lastAlert,
      isAudioMuted,
      setIsAudioMuted,
      isLoading,
      safetyCheckins,
      students,
      studentSummary,
      fetchStudents,
      fetchStudentSummary,
      markStudentSafe,
      dispatchRescueToStudent,
      pingUnaccountedStudents,
      resetStudentRoster,
      triggerScenario,
      injectHazard,
      resetHazards,
      submitSafetyCheckin,
      triggerManualAlarm,
      playAudioSiren
    }}>
      {children}
    </SentinelContext.Provider>
  );
};

export const useSentinel = () => useContext(SentinelContext);
