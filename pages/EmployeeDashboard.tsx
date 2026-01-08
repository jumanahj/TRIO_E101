
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { mockDb } from '../services/mockDb';
import { CommitData, ClientFeedback, WorkSubmission } from '../types';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [commits, setCommits] = useState<CommitData[]>([]);
  const [feedbackDesc, setFeedbackDesc] = useState('');
  const [workTitle, setWorkTitle] = useState('');
  const [workDesc, setWorkDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (user?.team_id && user?.is_technical) {
      const teamCommits = mockDb.getCommitsByTeam(user.team_id);
      const myCommits = teamCommits.filter(c => 
        c.author_username.toLowerCase() === user.github_username.toLowerCase()
      );
      // Sort newest to oldest
      setCommits(myCommits.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    }
  }, [user]);

  const handleFeedbackUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackDesc.trim()) return;
    setSubmitting(true);
    const feedback: ClientFeedback = {
      id: `cf-${Date.now()}`,
      user_id: user!.user_id,
      description: feedbackDesc,
      date: new Date().toISOString(),
      file_name: 'simulated_upload.pdf'
    };
    mockDb.saveClientFeedback(feedback);
    setFeedbackDesc('');
    setSuccessMsg('Feedback uploaded successfully!');
    setSubmitting(false);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleWorkUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workTitle.trim()) return;
    setSubmitting(true);
    const submission: WorkSubmission = {
      id: `ws-${Date.now()}`,
      user_id: user!.user_id,
      title: workTitle,
      description: workDesc,
      date: new Date().toISOString(),
      file_name: 'work_report.docx'
    };
    mockDb.saveWorkSubmission(submission);
    setWorkTitle('');
    setWorkDesc('');
    setSuccessMsg('Work report submitted successfully!');
    setSubmitting(false);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-12 animate-in fade-in duration-500">
      <header className="flex items-center gap-6 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-100 overflow-hidden">
          {user?.avatar_url ? (
            <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
          ) : (
            <span className="text-3xl font-black text-white">{user?.name.charAt(0)}</span>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900">Welcome, {user?.name}</h1>
          <p className="text-slate-500 font-medium mt-1">
            Logged in as <span className="text-emerald-600 font-bold">@{user?.github_username || user?.user_id}</span>
          </p>
        </div>
      </header>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl font-bold text-center animate-bounce">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* Work Upload Section (Non-Technical or All) */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 mb-2">Work Submission</h2>
            <p className="text-sm text-slate-500 mb-6 font-medium uppercase tracking-wider">Upload your reports, summaries, or deliverables</p>
            <form onSubmit={handleWorkUpload} className="space-y-4">
              <input 
                type="text" 
                placeholder="Work Title (e.g. Q1 Marketing Report)"
                value={workTitle}
                onChange={(e) => setWorkTitle(e.target.value)}
                className="w-full px-5 py-3 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all text-slate-900 font-medium outline-none"
              />
              <textarea 
                placeholder="Short description of the work performed..."
                value={workDesc}
                onChange={(e) => setWorkDesc(e.target.value)}
                className="w-full px-5 py-3 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all text-slate-900 font-medium outline-none min-h-[100px]"
              />
              <div className="flex items-center gap-4">
                <div className="flex-1 px-5 py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-xs font-bold text-center cursor-pointer hover:border-emerald-300 hover:text-emerald-500 transition-colors">
                  Select Document / PDF
                </div>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  Submit
                </button>
              </div>
            </form>
          </section>

          {/* Feedback Upload Section */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 mb-2">Client Feedback / Appreciation</h2>
            <p className="text-sm text-slate-500 mb-6 font-medium uppercase tracking-wider">Share positive recognition from stakeholders</p>
            <form onSubmit={handleFeedbackUpload} className="space-y-4">
              <textarea 
                placeholder="Paste client feedback or appreciation message here..."
                value={feedbackDesc}
                onChange={(e) => setFeedbackDesc(e.target.value)}
                className="w-full px-5 py-3 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 font-medium outline-none min-h-[120px]"
              />
              <div className="flex items-center gap-4">
                <div className="flex-1 px-5 py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-xs font-bold text-center cursor-pointer">
                  Upload Screenshot / Email (Optional)
                </div>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  Post Feedback
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Right Column: Commit Log (Conditional) */}
        {user?.is_technical && (
          <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-8 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900 mb-1">Commit Audit Log</h2>
              <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Source of Truth: GitHub Repository</p>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[600px] custom-scrollbar">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 z-10">
                  <tr className="border-b border-slate-100">
                    <th className="px-8 py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">Commit Message</th>
                    <th className="px-8 py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">Author</th>
                    <th className="px-8 py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest text-right">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {commits.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-8 py-20 text-center text-slate-400 italic">
                        No commits found for your account. Ensure your GitHub sync is completed by your manager.
                      </td>
                    </tr>
                  ) : (
                    commits.map((c) => (
                      <tr key={c.commit_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-5 font-bold text-slate-800 leading-snug">
                          {c.commit_message}
                          <div className="mt-1 font-mono text-[9px] text-indigo-400 uppercase tracking-tighter">SHA: {c.github_commit_hash.substring(0, 7)}</div>
                        </td>
                        <td className="px-8 py-5 font-medium text-slate-600">
                          @{c.author_username}
                        </td>
                        <td className="px-8 py-5 text-slate-500 text-right font-medium whitespace-nowrap">
                          {new Date(c.timestamp).toLocaleString(undefined, { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
      
      <footer className="pt-8 border-t border-slate-200 text-center">
        <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">Contribution Privacy Protected &bull; Access Strictly Limited</p>
      </footer>
    </div>
  );
};

export default EmployeeDashboard;
