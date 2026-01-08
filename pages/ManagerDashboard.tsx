
import React, { useState, useEffect, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../services/api';
import { mockDb } from '../services/mockDb';
import { Team, ScoreMetrics, CommitData, ClientFeedback, WorkSubmission } from '../types';
import { useAuth } from '../App';

const BADGE_STYLES = {
  'Silent Architect': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'High Visibility / Low Impact': 'bg-amber-100 text-amber-700 border-amber-200',
  'Balanced Contributor': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'N/A': 'bg-slate-100 text-slate-500 border-slate-200'
};

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [scores, setScores] = useState<ScoreMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [feedback, setFeedback] = useState<ClientFeedback[]>([]);
  const [work, setWork] = useState<WorkSubmission[]>([]);

  useEffect(() => {
    const allTeams = mockDb.getTeams();
    const accessibleTeams = user?.role === 'Director' 
      ? allTeams 
      : allTeams.filter(t => t.assigned_manager_id === user?.user_id);
    
    setTeams(accessibleTeams);
    if (accessibleTeams.length > 0) setSelectedTeam(accessibleTeams[0]);

    setFeedback(mockDb.getClientFeedback());
    setWork(mockDb.getWorkSubmissions());
  }, [user]);

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
      x: Number((s.avg_activity + s.avg_visibility).toFixed(2)), 
      y: Number(s.avg_impact.toFixed(2)),
      final: Number(s.final_contribution_score.toFixed(2)),
      badge: s.badge
    }));
  }, [scores]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Workforce Performance Monitor</h1>
          <p className="text-slate-500 text-sm">
            {user?.role === 'Manager' ? `Scope: ${user.name}` : 'Director Audit Mode'}
          </p>
        </div>
        
        <div className="flex gap-3">
          <select 
            value={selectedTeam?.team_id || ''}
            onChange={(e) => setSelectedTeam(teams.find(t => t.team_id === e.target.value) || null)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
          >
            {teams.length === 0 ? (
              <option value="">No teams assigned</option>
            ) : (
              teams.map(t => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)
            )}
          </select>
          <button 
            onClick={() => handleSync(false)}
            disabled={loading || !selectedTeam}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Syncing...' : 'Sync GitHub'}
          </button>
        </div>
      </header>

      {teams.length === 0 ? (
        <div className="bg-white p-12 rounded-[2rem] border-2 border-dashed border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800">No Assigned Teams</h3>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
              <h2 className="text-lg font-bold text-slate-800 mb-6">Execution Depth vs. Perceived Visibility</h2>
              <div className="h-[400px]">
                {scores.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis type="number" dataKey="x" name="Visibility" />
                      <YAxis type="number" dataKey="y" name="Impact" />
                      <ZAxis type="number" dataKey="final" range={[100, 1000]} />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        formatter={(value: any) => typeof value === 'number' ? value.toFixed(2) : value}
                      />
                      <Scatter name="Contributors" data={chartData}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.badge === 'Silent Architect' ? '#6366f1' : '#cbd5e1'} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-slate-400 italic">No sync data available.</div>}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl">
                <h3 className="font-bold mb-4 uppercase text-[10px] tracking-widest text-indigo-400">Sync Formulas</h3>
                <div className="space-y-3">
                  <FormulaItem label="Impact" formula="Code Weight (AI) + Feedback Bonus" />
                  <FormulaItem label="Visibility" formula="Commits + Slack activity" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 uppercase text-[10px] tracking-widest">Recent Feedback</h3>
                <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar">
                  {feedback.length === 0 ? <p className="text-xs text-slate-400 italic">No feedback entries.</p> : feedback.map(f => (
                    <div key={f.id} className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                      <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">@{f.user_id}</p>
                      <p className="text-xs text-slate-700 italic">"{f.description}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Operational Matrix (Restored Team Metrics)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Rank</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Developer</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Work Type</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Impact Points</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Visibility</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Collab</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Submissions</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Final Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scores.map((s) => (
                    <tr key={s.user_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-400">#{s.rank}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">@{s.user_id}</td>
                      <td className="px-6 py-4 text-[10px] uppercase font-black text-slate-400">
                        {mockDb.getUsers().find(u => u.user_id === s.user_id)?.is_technical ? 'Technical' : 'General'}
                      </td>
                      <td className="px-6 py-4 font-bold text-indigo-600">{s.avg_impact.toFixed(2)}</td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{(s.avg_activity + s.avg_visibility).toFixed(2)}</td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{s.avg_collaboration.toFixed(2)}</td>
                      <td className="px-6 py-4 text-slate-500">
                        {work.filter(w => w.user_id === s.user_id).length} Reports
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-slate-900 text-white rounded-lg font-black text-xs">
                          {s.final_contribution_score.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const FormulaItem = ({ label, formula }: { label: string, formula: string }) => (
  <div>
    <p className="font-black text-[9px] uppercase text-indigo-400 mb-1">{label}</p>
    <p className="text-white/70 font-medium font-mono text-[11px] leading-tight">{formula}</p>
  </div>
);

export default ManagerDashboard;
