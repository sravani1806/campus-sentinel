import React, { useState } from 'react';
import { 
  AlertTriangle, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Users, 
  Truck, 
  FileText, 
  Filter 
} from 'lucide-react';
import { useSentinel } from '../context/SentinelContext';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const IncidentManager = () => {
  const { incidents, safetyCheckins, telemetry } = useSentinel();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [zoneId, setZoneId] = useState('BLOCK_A_L1');
  const [severity, setSeverity] = useState('HIGH');
  const [hazardType, setHazardType] = useState('FIRE_SMOKE');
  const [description, setDescription] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  const digitalTwin = telemetry?.digital_twin || { nodes: [] };
  const nodes = digitalTwin.nodes || [];

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
            className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
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
                        className="px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-[10px] font-bold transition flex items-center gap-1"
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

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {safetyCheckins.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  No mobile check-ins logged yet.<br />Students can submit status from the Student PWA tab.
                </div>
              ) : (
                safetyCheckins.map((chk) => (
                  <div
                    key={chk.id}
                    className={`p-2.5 rounded-lg border text-xs ${
                      chk.status === 'SAFE'
                        ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-200'
                        : 'bg-red-950/60 border-red-600 text-red-200 animate-pulse'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{chk.user_name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900">
                        {chk.status === 'SAFE' ? '✅ SAFE' : '🚨 SOS NEED HELP'}
                      </span>
                    </div>
                    <div className="text-[11px] opacity-80 mt-1">
                      Zone: <strong>{chk.zone_id}</strong>
                    </div>
                    {chk.message && (
                      <p className="text-[10px] italic opacity-90 mt-0.5">"{chk.message}"</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
            📡 Safety check-ins are synced via WebSockets and cached offline on student devices.
          </div>
        </div>
      </div>

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
                <label className="text-slate-300 font-bold block mb-1">Incident Headline:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electrical Spark & Corridor Smoke"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Location Zone:</label>
                  <select
                    value={zoneId}
                    onChange={(e) => setZoneId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono"
                  >
                    {nodes.map(n => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Severity Level:</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Detailed Situation Description:</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Describe observed hazards, trapped occupants, or blocked doors..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 rounded bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white font-bold"
                >
                  Broadcast & Dispatch Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
