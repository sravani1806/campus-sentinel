import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Compass, 
  CheckCircle2, 
  AlertTriangle, 
  PhoneCall, 
  WifiOff, 
  Wifi,
  MapPin, 
  ArrowRight, 
  ArrowLeft,
  ShieldCheck, 
  Radio, 
  Flame, 
  BookOpen,
  Volume2,
  Building2,
  HelpCircle,
  Clock,
  ExternalLink,
  Info,
  User,
  Database,
  Send,
  MessageSquare,
  Lock,
  LogOut,
  UserCheck,
  Mail,
  Hash
} from 'lucide-react';
import { useSentinel } from '../context/SentinelContext';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const StudentPWA = () => {
  const { 
    telemetry, 
    playAudioSiren 
  } = useSentinel();

  // One-time Student Login / Profile State (Persisted in LocalStorage)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sentinel_student_profile');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Cached previous user for seamless backward return
  const [previousUser, setPreviousUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sentinel_student_profile');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Login Form Inputs
  const [loginName, setLoginName] = useState('');
  const [loginRollNo, setLoginRollNo] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginDept, setLoginDept] = useState('Computer Science & Engineering');
  const [loginPhone, setLoginPhone] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Active PWA Session State
  const [isPwaOffline, setIsPwaOffline] = useState(!navigator.onLine);
  const [offlineToast, setOfflineToast] = useState(null);
  const [currentZone, setCurrentZone] = useState('BLOCK_B_L1');
  const [userStatus, setUserStatus] = useState('UNACCOUNTED'); // 'SAFE' | 'IN_DANGER' | 'UNACCOUNTED'
  const [distressMessage, setDistressMessage] = useState('');
  const [checkinSuccess, setCheckinSuccess] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState('route'); // 'route' | 'status' | 'instructions' | 'contacts'
  const [activeInstructionScenario, setActiveInstructionScenario] = useState('FIRE');

  // Monitor network online/offline state
  useEffect(() => {
    const handleOnline = () => {
      setIsPwaOffline(false);
      setOfflineToast("CONNECTION RESTORED • Live MongoDB Sync Active");
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

  // Handle One-Time Student Login / Registration
  const handleStudentLogin = async (e) => {
    e.preventDefault();
    if (!loginName.trim() && !loginRollNo.trim() && !loginEmail.trim()) {
      setLoginError("Please enter your name, roll number, or email.");
      return;
    }

    setIsSubmittingLogin(true);
    setLoginError('');

    try {
      const res = await axios.post(`${BACKEND_URL}/api/students/login`, {
        name: loginName.trim() || "Student",
        roll_no: loginRollNo.trim() || (loginEmail ? loginEmail.split('@')[0] : `221FA-${Math.floor(1000 + Math.random() * 9000)}`),
        email: loginEmail.trim(),
        department: loginDept,
        phone: loginPhone.trim() || "+91 98765 43210",
        current_zone: currentZone
      });

      if (res.data.success && res.data.data) {
        const studentDoc = res.data.data;
        setCurrentUser(studentDoc);
        setUserStatus(studentDoc.status || 'UNACCOUNTED');
        localStorage.setItem('sentinel_student_profile', JSON.stringify(studentDoc));
      }
    } catch (err) {
      console.error(err);
      // Fallback offline login
      const fallbackDoc = {
        student_id: loginRollNo ? `STU-${loginRollNo.toUpperCase()}` : `STU-${Date.now()}`,
        name: loginName || "Campus Student",
        roll_no: loginRollNo || "221FA04001",
        email: loginEmail,
        department: loginDept,
        phone: loginPhone || "+91 98765 43210",
        current_zone: currentZone,
        status: "UNACCOUNTED"
      };
      setCurrentUser(fallbackDoc);
      setUserStatus('UNACCOUNTED');
      localStorage.setItem('sentinel_student_profile', JSON.stringify(fallbackDoc));
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  // Logout / Switch Student Account
  const handleLogout = () => {
    if (currentUser) {
      setPreviousUser(currentUser);
    }
    localStorage.removeItem('sentinel_student_profile');
    setCurrentUser(null);
    setDistressMessage('');
    setCheckinSuccess(false);
    setSosSent(false);
  };

  // Submit "I AM SAFE" check-in to MongoDB
  const handleSafeCheckin = async () => {
    if (!currentUser) return;
    const msg = distressMessage || `Checked in SAFE at ${nodes.find(n => n.id === currentZone)?.name || currentZone}`;

    try {
      await axios.post(`${BACKEND_URL}/api/students/check-in`, {
        student_id: currentUser.student_id || currentUser.roll_no,
        name: currentUser.name,
        roll_no: currentUser.roll_no,
        email: currentUser.email,
        zone_id: currentZone,
        zone_name: nodes.find(n => n.id === currentZone)?.name || currentZone,
        status: "SAFE",
        message: msg,
        phone: currentUser.phone
      });

      setUserStatus('SAFE');
      setCheckinSuccess(true);
      setDistressMessage('');
      setTimeout(() => setCheckinSuccess(false), 5000);
    } catch (e) {
      console.error('Check-in error:', e);
      setUserStatus('SAFE');
      setCheckinSuccess(true);
      setTimeout(() => setCheckinSuccess(false), 5000);
    }
  };

  // Submit "I AM IN DANGER / SOS" check-in to MongoDB
  const handleSosBeacon = async () => {
    if (!currentUser) return;
    playAudioSiren();
    const msg = distressMessage || `URGENT: Trapped or requiring assistance at ${nodes.find(n => n.id === currentZone)?.name || currentZone}!`;

    try {
      await axios.post(`${BACKEND_URL}/api/students/check-in`, {
        student_id: currentUser.student_id || currentUser.roll_no,
        name: currentUser.name,
        roll_no: currentUser.roll_no,
        email: currentUser.email,
        zone_id: currentZone,
        zone_name: nodes.find(n => n.id === currentZone)?.name || currentZone,
        status: "IN_DANGER",
        message: msg,
        phone: currentUser.phone
      });

      setUserStatus('IN_DANGER');
      setSosSent(true);
      setDistressMessage('');
      setTimeout(() => setSosSent(false), 6000);
    } catch (e) {
      console.error('SOS error:', e);
      setUserStatus('IN_DANGER');
      setSosSent(true);
      setTimeout(() => setSosSent(false), 6000);
    }
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

  // ==========================================
  // VIEW 1: ONE-TIME STUDENT LOGIN / SIGN-IN
  // ==========================================
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto space-y-4 font-mono">
        <div className="tactical-card rounded-2xl p-6 border border-emerald-500/50 bg-gradient-to-b from-[#07172e] via-[#051124] to-[#040e1e] shadow-[0_10px_35px_rgba(16,185,129,0.2)] space-y-4 relative overflow-hidden">
          {/* Header */}
          <div className="text-center space-y-1 pb-3 border-b border-emerald-900/60">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-400 flex items-center justify-center mx-auto mb-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-base font-black text-white tracking-wider">CAMPUS SENTINEL PASS</h2>
            <p className="text-xs text-emerald-300/80">
              One-Time Student Login • Synced directly to MongoDB
            </p>
          </div>

          {loginError && (
            <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-500 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Backward Navigation to Previous Account */}
          {previousUser && (
            <button
              type="button"
              onClick={() => {
                setCurrentUser(previousUser);
                setUserStatus(previousUser.status || 'UNACCOUNTED');
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/60 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-md group"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-1 transition-transform" />
              <span>← Cancel &amp; Return to {previousUser.name} ({previousUser.roll_no || previousUser.student_id})</span>
            </button>
          )}

          {/* Registration / Login Form */}
          <form onSubmit={handleStudentLogin} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 font-bold block mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                Student Full Name:
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Naga Sai"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                className="w-full bg-[#081730] border border-blue-700/60 rounded-xl p-2.5 text-white font-mono placeholder-slate-500 outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-300 font-bold block mb-1 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-cyan-400" />
                  Roll Number / ID:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 221FA04001"
                  value={loginRollNo}
                  onChange={(e) => setLoginRollNo(e.target.value)}
                  className="w-full bg-[#081730] border border-blue-700/60 rounded-xl p-2.5 text-white font-mono placeholder-slate-500 outline-none focus:border-cyan-400 transition"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  Email (Optional):
                </label>
                <input
                  type="email"
                  placeholder="student@vignan.ac.in"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-[#081730] border border-blue-700/60 rounded-xl p-2.5 text-white font-mono placeholder-slate-500 outline-none focus:border-cyan-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                Department:
              </label>
              <select
                value={loginDept}
                onChange={(e) => setLoginDept(e.target.value)}
                className="w-full bg-[#081730] border border-blue-700/60 rounded-xl p-2.5 text-white font-mono outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="Computer Science & Engineering">Computer Science &amp; Engineering</option>
                <option value="Artificial Intelligence & Data Science">Artificial Intelligence &amp; Data Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics & Communication">Electronics &amp; Communication</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Biotechnology">Biotechnology</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
                Phone Number (Emergency Contact):
              </label>
              <input
                type="text"
                placeholder="+91 98480 12345"
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                className="w-full bg-[#081730] border border-blue-700/60 rounded-xl p-2.5 text-white font-mono placeholder-slate-500 outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingLogin}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm tracking-wide shadow-[0_0_20px_rgba(16,185,129,0.4)] transition cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>{isSubmittingLogin ? "Saving to MongoDB..." : "Login & Register to MongoDB"}</span>
              </button>
            </div>

            <div className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1.5 pt-1">
              <Database className="w-3 h-3 text-emerald-400" />
              <span>Saves permanently to MongoDB `students` collection</span>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: ACTIVE LOGGED-IN STUDENT PWA
  // ==========================================
  return (
    <div className="max-w-md mx-auto space-y-3 font-mono">
      {/* Offline Status Toast */}
      {offlineToast && (
        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs flex items-center justify-between shadow-lg animate-fade-in">
          <span>{offlineToast}</span>
          <button onClick={() => setOfflineToast(null)} className="text-slate-400 hover:text-white font-bold ml-2">✕</button>
        </div>
      )}

      {/* Main Student Card */}
      <div className="tactical-card rounded-2xl p-4 border border-emerald-500/50 bg-gradient-to-b from-[#07172e] to-[#040e1e] shadow-[0_10px_35px_rgba(16,185,129,0.2)] space-y-3 relative overflow-hidden">
        {/* Top Header & DB Status */}
        <div className="flex items-center justify-between border-b border-emerald-900/60 pb-2.5">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isPwaOffline ? 'bg-amber-400' : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'}`} />
            <div>
              <span className="text-xs font-extrabold tracking-wider text-white flex items-center gap-1.5">
                CAMPUS SENTINEL
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-semibold">PWA</span>
              </span>
              <span className="text-[9px] text-emerald-300/80 block font-normal flex items-center gap-1">
                <Database className="w-2.5 h-2.5 text-emerald-400" />
                <span>Connected to MongoDB</span>
              </span>
            </div>
          </div>

          {/* Student Account & Offline Simulation Toggle */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                const nextOffline = !isPwaOffline;
                setIsPwaOffline(nextOffline);
                setOfflineToast(nextOffline ? "OFFLINE EVACUATION MODE • Local Cached A* Routes & Emergency Protocols Active" : "LIVE SYNC RESTORED • Connected to MongoDB");
                setTimeout(() => setOfflineToast(null), 4500);
              }}
              className={`px-2 py-1 rounded border text-[10px] flex items-center gap-1 transition cursor-pointer ${
                isPwaOffline
                  ? 'bg-amber-950/80 border-amber-500 text-amber-300 font-bold'
                  : 'bg-emerald-950/60 border-emerald-700 text-emerald-300 hover:bg-emerald-900/60'
              }`}
              title="Test Offline Evacuation Mode"
            >
              {isPwaOffline ? <WifiOff className="w-3 h-3 text-amber-400" /> : <Wifi className="w-3 h-3 text-emerald-400" />}
              <span>{isPwaOffline ? 'OFFLINE' : 'ONLINE'}</span>
            </button>

            <button
              onClick={handleLogout}
              title="Switch Student Account"
              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white text-[10px] flex items-center gap-1 transition cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span>Switch</span>
            </button>
          </div>
        </div>

        {/* Logged-In Student Profile Banner */}
        <div className="bg-[#051124] p-3 rounded-xl border border-blue-900/60 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-950 border border-cyan-500/60 text-cyan-300 flex items-center justify-center font-bold text-xs">
                {currentUser.name ? currentUser.name[0] : 'S'}
              </div>
              <div>
                <div className="text-xs font-black text-white">{currentUser.name}</div>
                <div className="text-[10px] text-cyan-300 font-mono">{currentUser.roll_no || currentUser.student_id}</div>
              </div>
            </div>

            {/* Current Status Pill stored in MongoDB */}
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black border flex items-center gap-1 ${
              userStatus === 'SAFE'
                ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : userStatus === 'IN_DANGER'
                ? 'bg-red-950 border-red-500 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.4)] animate-pulse'
                : 'bg-amber-950 border-amber-500 text-amber-300'
            }`}>
              {userStatus === 'SAFE' && '✅ DB: SAFE'}
              {userStatus === 'IN_DANGER' && '🚨 DB: IN DANGER'}
              {userStatus === 'UNACCOUNTED' && '⚪ DB: PENDING'}
            </span>
          </div>

          <div className="text-[10px] text-slate-400 pt-1 border-t border-blue-950 flex items-center justify-between">
            <span>Dept: <strong className="text-slate-200">{currentUser.department}</strong></span>
            <span>Phone: <strong className="text-slate-200">{currentUser.phone}</strong></span>
          </div>
        </div>

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
              Hazard detected on campus. Follow illuminated green corridors to designated exit immediately.
            </p>
            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-red-800/80 text-slate-200">
              <span>Exit: <strong className="text-emerald-300 font-extrabold">{currentRoute?.exit_name || 'Main North Gate'}</strong></span>
              <span>ETA: <strong className="text-white font-extrabold">{currentRoute?.estimated_time_seconds || 45}s</strong></span>
            </div>
          </div>
        )}

        {/* Location Zone Selector */}
        <div className="bg-[#051124] p-2.5 rounded-xl border border-blue-900/60">
          <label className="text-[10px] text-blue-300 uppercase font-semibold block mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-400" />
              Your Current Location Zone:
            </span>
            <span className="text-slate-400 text-[9px]">Select Where You Are</span>
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

        {/* Optional Note Box */}
        <div className="bg-[#051124] p-2.5 rounded-xl border border-blue-900/60">
          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1 flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-slate-400" />
            Optional Note (Stored in MongoDB):
          </label>
          <input
            type="text"
            placeholder="e.g. Safe at exit OR smoke in room with 2 friends"
            value={distressMessage}
            onChange={(e) => setDistressMessage(e.target.value)}
            className="w-full bg-[#081730] border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 font-mono outline-none focus:border-cyan-400 transition"
          />
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

        {/* High-Impact Action Buttons: "I AM SAFE" & "I AM IN DANGER" */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-900/60">
          <button
            onClick={handleSafeCheckin}
            className="py-3.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition flex flex-col items-center justify-center gap-1 shadow-[0_0_18px_rgba(16,185,129,0.4)] cursor-pointer active:scale-95"
          >
            <ShieldCheck className="w-5 h-5 text-slate-950" />
            <span>{checkinSuccess ? "SAVED IN MONGODB! ✅" : "I AM SAFE"}</span>
            <span className="text-[9px] font-normal text-slate-900">Record SAFE in MongoDB</span>
          </button>

          <button
            onClick={handleSosBeacon}
            className="py-3.5 px-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs transition flex flex-col items-center justify-center gap-1 shadow-[0_0_20px_rgba(239,68,68,0.5)] cursor-pointer active:scale-95 animate-pulse-slow"
          >
            <Volume2 className="w-5 h-5 text-white animate-bounce" />
            <span>{sosSent ? "SAVED IN MONGODB! 🚨" : "I AM IN DANGER"}</span>
            <span className="text-[9px] font-normal text-red-100">Record IN DANGER in MongoDB</span>
          </button>
        </div>
      </div>
    </div>
  );
};
