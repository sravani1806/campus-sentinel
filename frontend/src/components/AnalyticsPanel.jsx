import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  ShieldAlert, 
  Truck 
} from 'lucide-react';
import { useSentinel } from '../context/SentinelContext';

export const AnalyticsPanel = () => {
  const { telemetry } = useSentinel();

  const risksMatrix = telemetry?.risks?.zone_risk_matrix || {};
  const simulationTimeline = telemetry?.simulation?.timeline_projections || [
    { time_min: 1, label: "T+1m", evacuated_count: 320, remaining_count: 880, clearance_percent: 26.7 },
    { time_min: 3, label: "T+3m", evacuated_count: 750, remaining_count: 450, clearance_percent: 62.5 },
    { time_min: 5, label: "T+5m", evacuated_count: 1050, remaining_count: 150, clearance_percent: 87.5 },
    { time_min: 8, label: "T+8m", evacuated_count: 1200, remaining_count: 0, clearance_percent: 100 }
  ];

  const exitDistribution = telemetry?.routes?.exit_distribution || {
    "EXIT_NORTH_GATE": 4,
    "EXIT_WEST_GATE": 5,
    "EXIT_EAST_GATE": 3,
    "EXIT_SOUTH_GATE": 4
  };

  // Format zone risks for Bar Chart
  const riskChartData = Object.entries(risksMatrix).map(([zoneId, data]) => ({
    name: data.name ? data.name.split(' ')[0] : zoneId,
    risk: data.risk_score || 0,
    occupancy: data.current_occupancy || 0
  })).slice(0, 8);

  const pieData = Object.entries(exitDistribution).map(([gate, count]) => ({
    name: gate.replace('EXIT_', '').replace('_GATE', ''),
    value: count
  }));

  const COLORS = ['#00f2fe', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-4 font-mono">
      {/* Top Stat KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="tactical-card p-3.5 rounded-xl border border-slate-800 bg-[#091122]/95 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Campus Population</div>
            <div className="text-xl font-bold text-white">
              {telemetry?.crowd?.total_population || 1200}
              <span className="text-xs text-slate-400 font-normal ml-1">people</span>
            </div>
          </div>
        </div>

        <div className="tactical-card p-3.5 rounded-xl border border-slate-800 bg-[#091122]/95 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-700/50 text-red-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Max Risk Score</div>
            <div className="text-xl font-bold text-red-400">
              {telemetry?.max_risk_score || 0}
              <span className="text-xs text-slate-400 font-normal ml-1">/ 100</span>
            </div>
          </div>
        </div>

        <div className="tactical-card p-3.5 rounded-xl border border-slate-800 bg-[#091122]/95 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-700/50 text-emerald-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Est. Clearance Time</div>
            <div className="text-xl font-bold text-emerald-400">
              {telemetry?.simulation?.estimated_full_clearance_minutes || 6.5}
              <span className="text-xs text-slate-400 font-normal ml-1">min</span>
            </div>
          </div>
        </div>

        <div className="tactical-card p-3.5 rounded-xl border border-slate-800 bg-[#091122]/95 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-blue-400">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Active Responders</div>
            <div className="text-xl font-bold text-blue-400">
              {telemetry?.resources?.total_deployed_units || 2}
              <span className="text-xs text-slate-400 font-normal ml-1">units</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Zone Dynamic Risk Breakdown */}
        <div className="tactical-card rounded-xl p-4 border border-sentinel-border bg-[#0a0f1d]/90">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Dynamic Zone Risk Scores (0-100)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskChartData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="risk" fill="#00f2fe" radius={[4, 4, 0, 0]}>
                  {riskChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.risk > 70 ? '#ef4444' : entry.risk > 40 ? '#f59e0b' : '#10b981'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Projected Evacuation Clearance Rate Curve */}
        <div className="tactical-card rounded-xl p-4 border border-sentinel-border bg-[#0a0f1d]/90">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Predictive Evacuation Clearance Progress
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={simulationTimeline}>
                <defs>
                  <linearGradient id="evacGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="evacuated_count" stroke="#10b981" fillOpacity={1} fill="url(#evacGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Exit Gate Load Balancing */}
        <div className="tactical-card rounded-xl p-4 border border-sentinel-border bg-[#0a0f1d]/90 lg:col-span-2 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-1/2">
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">
              Autonomous Exit Gate Load Balancing
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              NetworkX & A* dynamically balance egress flow to prevent bottlenecks at any single gate. When a gate or corridor is compromised, flow automatically shifts to adjacent perimeter exits.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {pieData.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-slate-300 font-bold">{item.name} Gate:</span>
                  <span className="text-white ml-auto">{item.value} zones</span>
                </div>
              ))}
            </div>
          </div>

          <div className="h-56 w-full md:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
