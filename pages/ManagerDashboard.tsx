
import React, { useState, useEffect, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../services/api';
import { mockDb } from '../services/mockDb';
import { Team, ScoreMetrics, CommitData } from '../types';

const BADGE_STYLES = {
  'Silent Architect': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'High Visibility / Low Impact': 'bg-amber-100 text-amber-700 border-amber-200',
  'Balanced Contributor': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'N/A': 'bg-slate-100 text-slate-500 border-slate-200'
};

const ManagerDashboard = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [scores, setScores] = useState<ScoreMetrics[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const allTeams = mockDb.getTeams();
    setTeams(allTeams);
    if (allTeams.length > 0) setSelectedTeam(allTeams[0]);
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      const savedScores = localStorage.getItem(`impactlens_scores_${selectedTeam.team_id}`);
      setScores(savedScores ? JSON.parse(savedScores) : []);
    }
  }, [selectedTeam]);

  const handleSync = async (useDemo = false) => {
    if (!selectedTeam) return;
    setLoading(true);
    try {
      await api.syncTeamData(selectedTeam.team_id, useDemo);
      const savedScores = localStorage.getItem(`impactlens_scores_${selectedTeam.team_id}`);
      setScores(savedScores ? JSON.parse(savedScores) : []);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    return scores.map(s => ({
      name: s.user_id,
      x: s.avg_activity + s.avg_visibility, // Activity + Slack Visibility
      y: s.avg_impact,
      final: s.final_contribution_score,
      badge: s.badge
    }));
  }, [scores]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Workforce Contribution Monitor</h1>
          <p className="text-slate-500 text-sm">Quantifying engineering value through execution and collaboration</p>
        </div>
        
        <div className="flex gap-3">
          <select 
            value={selectedTeam?.team_id || ''}
            onChange={(e) => setSelectedTeam(teams.find(t => t.team_id === e.target.value) || null)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
          >
            {teams.map(t => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)}
          </select>
          <button 
            onClick={() => handleSync(false)}
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Syncing...' : 'Sync GitHub'}
          </button>
          <button 
            onClick={() => handleSync(true)}
            className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900"
          >
            Demo Data
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Scatter Plot */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Execution vs. Perceived Effort</h2>
          <div className="h-[400px]">
            {scores.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" dataKey="x" name="Visibility + Activity" label={{ value: 'Visibility (Activity + Slack)', position: 'bottom', offset: 0, fontSize: 10 }} />
                  <YAxis type="number" dataKey="y" name="Impact" label={{ value: 'Execution Impact', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <ZAxis type="number" dataKey="final" range={[100, 1000]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-white/10 text-xs">
                          <p className="font-bold">@{d.name}</p>
                          <p className="text-indigo-400 font-bold mt-1">{d.badge}</p>
                          <div className="mt-2 space-y-1 opacity-70">
                            <p>Visibility: {d.x.toFixed(1)}</p>
                            <p>Impact: {d.y.toFixed(1)}</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Scatter name="Contributors" data={chartData}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.badge === 'Silent Architect' ? '#6366f1' : '#cbd5e1'} 
                        strokeWidth={entry.badge === 'Silent Architect' ? 2 : 0}
                        stroke="#4f46e5"
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic">No team data synced.</div>
            )}
          </div>
          <div className="absolute top-10 left-10 pointer-events-none">
            <span className="text-[10px] font-black uppercase text-indigo-500/30 tracking-[0.2em]">Quadrant: Silent Architects</span>
          </div>
        </div>

        {/* Stats Legend */}
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col justify-center">
          <h3 className="font-bold text-slate-800 mb-4">Metric Formulas</h3>
          <div className="space-y-4 text-xs">
            <FormulaItem label="Activity" formula="(Commits × 1) + (PR Merged × 2)" />
            <FormulaItem label="Impact" formula="(Bug Fixes × 5) + (PR Merged × 3) + (Files Changed × 0.5)" />
            <FormulaItem label="Collaboration" formula="(Reviews × 4) + (Review Comments × 2)" />
            <FormulaItem label="Final Score" formula="Impact(60%) + Activity(20%) + Collab(20%)" />
          </div>
        </div>
      </div>

      {/* Contributors Table */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Contributors Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Rank</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Developer</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Activity</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Impact</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Collaboration</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Final Score</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Status Badge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scores.map((s) => (
                <tr key={s.user_id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-400">#{s.rank}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-900 block">@{s.user_id}</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-600">{s.avg_activity.toFixed(1)}</td>
                  <td className="px-6 py-4 font-bold text-indigo-600">{s.avg_impact.toFixed(1)}</td>
                  <td className="px-6 py-4 font-medium text-slate-600">{s.avg_collaboration.toFixed(1)}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-900 text-white rounded-lg font-black text-xs">
                      {s.final_contribution_score.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${BADGE_STYLES[s.badge]}`}>
                      {s.badge === 'Silent Architect' ? '🧠 ' : s.badge === 'High Visibility / Low Impact' ? '📣 ' : '⚖️ '}
                      {s.badge}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const FormulaItem = ({ label, formula }: { label: string, formula: string }) => (
  <div className="p-3 bg-white rounded-xl border border-slate-200">
    <p className="font-black text-[9px] uppercase text-indigo-500 mb-1">{label}</p>
    <p className="text-slate-600 font-medium font-mono tracking-tight">{formula}</p>
  </div>
);

export default ManagerDashboard;
