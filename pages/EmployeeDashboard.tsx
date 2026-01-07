
import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../App';
import { mockDb } from '../services/mockDb';
import { CommitData, ScoreMetrics } from '../types';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [commits, setCommits] = useState<CommitData[]>([]);
  const [personalScore, setPersonalScore] = useState<ScoreMetrics | null>(null);

  useEffect(() => {
    if (user?.team_id && user?.github_username) {
      const teamCommits = mockDb.getCommitsByTeam(user.team_id);
      setCommits(teamCommits.filter(c => c.author_username === user.github_username));

      const savedScores = localStorage.getItem(`impactlens_scores_${user.team_id}`);
      if (savedScores) {
        const scores: ScoreMetrics[] = JSON.parse(savedScores);
        const myScore = scores.find(s => s.user_id === user.github_username);
        setPersonalScore(myScore || null);
      }
    }
  }, [user]);

  const trendData = useMemo(() => {
    return commits.slice().reverse().map((c, i) => ({
      index: i + 1,
      impact: c.impact_score,
      activity: c.activity_score
    }));
  }, [commits]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Personal Impact Hub</h1>
          <p className="text-slate-500">Transparency report for @{user?.github_username}</p>
        </div>
        {personalScore && personalScore.category && (
          <div className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200">
            {personalScore.category}
          </div>
        )}
      </header>

      {!user?.team_id ? (
        <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-slate-200 text-center">
          <p className="text-slate-500">You are not currently mapped to a project team.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Team Rank" value={personalScore ? `#${personalScore.rank}` : '--'} icon="🏆" sub="Relative impact" />
            <StatCard label="Avg. Impact" value={personalScore ? personalScore.avg_impact.toFixed(1) : '--'} icon="⚡" sub="Out of 10" />
            <StatCard label="Z-Score" value={personalScore && personalScore.z_score !== undefined ? personalScore.z_score.toFixed(2) : '--'} icon="📊" sub="Deviation" />
            <StatCard label="Commits" value={commits.length} icon="📦" sub="Analyzed units" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-6">Impact Velocity</h2>
              <div className="h-[300px]">
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorImpact" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="index" hide />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Area type="monotone" dataKey="impact" stroke="#6366f1" fillOpacity={1} fill="url(#colorImpact)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 italic">Data sync required to generate trends.</div>
                )}
              </div>
            </div>

            <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex flex-col">
              <h2 className="text-lg font-bold mb-6 text-indigo-400">AI Feed & Feedback</h2>
              <div className="flex-1 space-y-4 overflow-y-auto max-h-[350px] custom-scrollbar pr-4">
                {commits.length === 0 ? (
                  <p className="text-slate-500 text-sm">Waiting for manager to synchronize repository data...</p>
                ) : (
                  commits.map((c) => (
                    <div key={c.commit_id} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Impact: {c.impact_score}/10</span>
                        <span className="text-[10px] text-slate-500">{new Date(c.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm font-medium mb-2 truncate">{c.commit_message}</p>
                      <p className="text-xs text-slate-400 italic leading-relaxed">
                        "{c.ai_explanation || 'Impact analysis pending.'}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon, sub }: { label: string, value: string | number, icon: string, sub: string }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-transform hover:-translate-y-1">
    <div className="flex justify-between items-start mb-4">
      <span className="text-2xl">{icon}</span>
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
    <p className="text-3xl font-bold text-slate-900">{value}</p>
    <p className="text-xs text-slate-500 mt-1 font-medium">{sub}</p>
  </div>
);

export default EmployeeDashboard;
