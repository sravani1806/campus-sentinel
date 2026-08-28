import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Users, 
  Truck, 
  FileText, 
  Filter,
  Search,
  ExternalLink,
  RefreshCw,
  PhoneCall,
  MapPin,
  Database
} from 'lucide-react';
import { useSentinel } from '../context/SentinelContext';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://campus-sentinel-backend.onrender.com';

export const IncidentManager = () => {
  const { incidents, safetyCheckins, telemetry, setActiveTab, studentSummary } = useSentinel();
  const [showModal, setShowModal] = useState(false);
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [rosterList, setRosterList] = useState([]);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterFilter, setRosterFilter] = useState('ALL');

  const [title, setTitle] = useState('');
  const [zoneId, setZoneId] = useState('BLOCK_A_L1');
  const [severity, setSeverity] = useState('HIGH');
  const [hazardType, setHazardType] = useState('FIRE_SMOKE');
  const [description, setDescription] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  const digitalTwin = telemetry?.digital_twin || { nodes: [] };
  const nodes = digitalTwin.nodes || [];

  // Fetch live students from backend
  const fetchLiveRoster = async () => {
    setIsLoadingRoster(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/students`);
      if (res.data && Array.isArray(res.data.data)) {
        setRosterList(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load students roster:", err);
    } finally {
      setIsLoadingRoster(false);
    }
  };

  useEffect(() => {
    if (showRosterModal) {
      fetchLiveRoster();
    }
  }, [showRosterModal]);

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BACKEND_URL}/api/incidents`, {
        title,
        zone_id: zoneId,
        zone_name: nodes.find(n => n.id === zoneId)?.name || zoneId,
        hazard_type: hazardType,
        severity,
        description,
        reported_by: "Campus Operations Marshall"
      });
      setShowModal(false);
      setTitle('');
      setDescription('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await axios.patch(`${BACKEND_URL}/api/incidents/${id}`, {
        status: newStatus,
        notes: `Status updated to ${newStatus} by Dispatch Commander`
      });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredIncidents = incidents.filter(i => {
    if (filterSeverity === 'ALL') return true;
    return i.severity === filterSeverity;
  });

  const filteredStudents = rosterList.filter(s => {
    if (rosterFilter !== 'ALL' && s.status !== rosterFilter) return false;
    if (rosterSearch) {
      const q = rosterSearch.toLowerCase();
      return (
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.roll_no && s.roll_no.toLowerCase().includes(q)) ||
        (s.current_zone && s.current_zone.toLowerCase().includes(q)) ||
        (s.department && s.department.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const safeCount = rosterList.filter(s => s.status === 'SAFE').length;
  const dangerCount = rosterList.filter(s => s.status === 'IN_DANGER').length;

  return (
    <div className="space-y-4 font-mono">
      {/* Top Header & Actions */}
      <div className="tactical-card rounded-xl p-4 border border-sentinel-border bg-[#0a0f1d]/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            INCIDENT COMMAND & DISPATCH LOG
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time emergency incident logging, responder task allocation, and student safety check-in registry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.4)] cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Log New Emergency Incident
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Incidents Table / Cards (2 Cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Active Incident Records ({filteredIncidents.length})</span>
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-300 rounded px-2 py-0.5"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
              </select>
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredIncidents.map((inc) => (
              <div
                key={inc.id}
                className="tactical-card p-4 rounded-xl border border-slate-800 bg-slate-950/80 hover:border-slate-700 transition space-y-2.5 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{inc.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                      {inc.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      inc.severity === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-700' :
                      inc.severity === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                      'bg-yellow-950 text-yellow-300 border border-yellow-800'
                    }`}>
                      {inc.severity}
                    </span>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      inc.status === 'RESOLVED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
                      inc.status === 'INVESTIGATING' ? 'bg-blue-950 text-blue-300 border border-blue-700' :
                      'bg-purple-950 text-purple-300 border border-purple-700'
                    }`}>
                      {inc.status}
                    </span>
                  </div>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed bg-slate-900/60 p-2 rounded">
                  {inc.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <div>
                    Zone: <strong className="text-cyan-400">{inc.zone_name || inc.zone_id}</strong> • Reported by: <strong className="text-slate-300">{inc.reported_by}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    {inc.status !== 'RESOLVED' ? (
                      <button
                        onClick={() => handleUpdateStatus(inc.id, 'RESOLVED')}
                        className="px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Mark Resolved
                      </button>
                    ) : (
                      <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Resolved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Safety Check-in Stream (1 Col) */}
        <div className="tactical-card rounded-xl p-4 border border-sentinel-border bg-[#0a0f1d]/90 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4" />
                Live Student Safety Pings
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                {safetyCheckins.length} Pings
              </span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {safetyCheckins.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  No mobile check-ins in current session.<br />
                  Click below to inspect all students in the database.
                </div>
              ) : (
                safetyCheckins.map((chk) => (
                  <div
                    key={chk.id || Math.random()}
                    className={`p-2.5 rounded-lg border text-xs ${
                      chk.status === 'SAFE'
                        ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-200'
                        : 'bg-red-950/60 border-red-600 text-red-200 animate-pulse'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{chk.user_name || chk.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900">
                        {chk.status === 'SAFE' ? '✅ SAFE' : '🚨 SOS NEED HELP'}
                      </span>
                    </div>
                    <div className="text-[11px] opacity-80 mt-1">
                      Zone: <strong>{chk.zone_id || chk.zone_name}</strong>
                    </div>
                    {chk.message && (
                      <p className="text-[10px] italic opacity-90 mt-0.5">"{chk.message}"</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <button
              onClick={() => setShowRosterModal(true)}
              className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition cursor-pointer active:scale-95"
            >
              <Users className="w-4 h-4" />
              <span>View Full Safety &amp; Danger Roster</span>
            </button>

            <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
              <span>📡 Synced with Cloud Database</span>
              <a 
                href={`${BACKEND_URL}/api/students`} 
                target="_blank" 
                rel="noreferrer"
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 font-bold"
              >
                <span>Raw API</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Roster & Live Students Modal */}
      {showRosterModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="tactical-card max-w-3xl w-full max-h-[90vh] rounded-2xl overflow-hidden border border-cyan-500/50 shadow-2xl bg-[#060c1a] p-5 space-y-4 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/60 text-cyan-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white tracking-wider flex items-center gap-2">
                    LIVE PERSONNEL SAFETY &amp; DANGER ROSTER
                    <span className="text-[10px] px-2 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold">
                      {rosterList.length} Registered
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Real-time status feed fetched directly from MongoDB Database Layer
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchLiveRoster}
                  disabled={isLoadingRoster}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Refresh Roster"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingRoster ? 'animate-spin text-cyan-400' : ''}`} />
                </button>
                <button
                  onClick={() => setShowRosterModal(false)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Quick KPI Bar */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-600/60 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-emerald-300 font-bold uppercase">Confirmed Safe</div>
                  <div className="text-base font-black text-white">{safeCount} Students</div>
                </div>
                <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              </div>

              <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-600/60 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-red-300 font-bold uppercase">In Danger / SOS</div>
                  <div className="text-base font-black text-white">{dangerCount} Students</div>
                </div>
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]" />
              </div>

              <div className="p-2.5 rounded-xl bg-blue-950/60 border border-blue-600/60 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-cyan-300 font-bold uppercase">Total Database Records</div>
                  <div className="text-base font-black text-white">{rosterList.length} Students</div>
                </div>
                <Database className="w-4 h-4 text-cyan-400" />
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by student name, roll number, zone..."
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#08152c] border border-blue-900/80 text-white placeholder-slate-500 outline-none focus:border-cyan-400 font-mono text-xs"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setRosterFilter('ALL')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold border transition cursor-pointer ${
                    rosterFilter === 'ALL'
                      ? 'bg-cyan-600 text-white border-cyan-400 shadow'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  All ({rosterList.length})
                </button>
                <button
                  onClick={() => setRosterFilter('IN_DANGER')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold border transition cursor-pointer ${
                    rosterFilter === 'IN_DANGER'
                      ? 'bg-red-600 text-white border-red-400 shadow'
                      : 'bg-slate-900 text-red-400 border-slate-800'
                  }`}
                >
                  🔴 In Danger ({dangerCount})
                </button>
                <button
                  onClick={() => setRosterFilter('SAFE')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold border transition cursor-pointer ${
                    rosterFilter === 'SAFE'
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow'
                      : 'bg-slate-900 text-emerald-400 border-slate-800'
                  }`}
                >
                  🟢 Safe ({safeCount})
                </button>
              </div>
            </div>

            {/* Students List Table */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
              {isLoadingRoster ? (
                <div className="py-12 text-center text-xs text-cyan-400 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                  <span>Fetching real-time records from MongoDB...</span>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 space-y-1">
                  <div className="text-slate-400 font-bold">No students found matching current filter.</div>
                  <div className="text-[11px]">Students can register and check in from the Student PWA tab.</div>
                </div>
              ) : (
                filteredStudents.map((stu) => (
                  <div
                    key={stu.student_id || stu._id || stu.roll_no}
                    className={`p-3 rounded-xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
                      stu.status === 'IN_DANGER'
                        ? 'bg-red-950/40 border-red-600 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                        : stu.status === 'SAFE'
                        ? 'bg-emerald-950/30 border-emerald-700/60'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-sm">{stu.name}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded bg-blue-950 text-cyan-300 border border-blue-800 font-bold">
                          {stu.roll_no || stu.student_id}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {stu.department}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-300 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          Zone: <strong className="text-white">{stu.zone_name || stu.current_zone}</strong>
                        </span>
                        {stu.phone && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <PhoneCall className="w-3 h-3 text-slate-500" />
                            {stu.phone}
                          </span>
                        )}
                      </div>

                      {stu.emergency_message && (
                        <p className="text-[11px] text-amber-200/90 italic bg-black/40 px-2 py-1 rounded border border-slate-800 mt-1">
                          "{stu.emergency_message}"
                        </p>
                      )}
                    </div>

                    {/* Status Pill & Timestamp */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-1">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black border ${
                        stu.status === 'IN_DANGER'
                          ? 'bg-red-600 text-white border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse'
                          : stu.status === 'SAFE'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow'
                          : 'bg-amber-950 text-amber-300 border-amber-500'
                      }`}>
                        {stu.status === 'IN_DANGER' ? '🚨 IN DANGER / SOS' : stu.status === 'SAFE' ? '✅ CONFIRMED SAFE' : '⚪ PENDING'}
                      </span>
                      <span className="text-[9.5px] text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {stu.last_checkin_time ? new Date(stu.last_checkin_time).toLocaleTimeString() : 'Just now'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-blue-900/60 pt-3 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                Live Cloud Sync Active • {rosterList.length} documents
              </span>
              <button
                onClick={() => setShowRosterModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log New Incident Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="tactical-card max-w-lg w-full rounded-xl overflow-hidden border border-red-500/50 shadow-2xl bg-slate-950 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                CREATE EMERGENCY INCIDENT DISPATCH
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Incident Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smoke detected on 2nd Floor Corridor"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Campus Zone:</label>
                  <select
                    value={zoneId}
                    onChange={(e) => setZoneId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono"
                  >
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name} (Floor {n.floor})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Severity Level:</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Hazard Classification:</label>
                <select
                  value={hazardType}
                  onChange={(e) => setHazardType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono"
                >
                  <option value="FIRE_SMOKE">Fire &amp; Thermal Plume</option>
                  <option value="CROWD_SURGE">Crowd Density Bottleneck</option>
                  <option value="STRUCTURAL">Structural Blockage</option>
                  <option value="HAZMAT">Hazardous Material Drift</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Incident Summary &amp; Directives:</label>
                <textarea
                  rows={3}
                  placeholder="Describe sensor telemetry, immediate hazards, and suggested evacuation routes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow"
                >
                  Dispatch Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
