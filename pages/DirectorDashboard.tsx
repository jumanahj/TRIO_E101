
import React, { useState, useEffect } from 'react';
import { Team, User } from '../types';
import { mockDb } from '../services/mockDb';
import { githubService } from '../services/githubService';
import { useAuth } from '../App';

const DirectorDashboard = () => {
  const { user: currentUser } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [newRepoUrl, setNewRepoUrl] = useState('facebook/react');
  const [githubToken, setGithubToken] = useState('');
  
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);

  useEffect(() => {
    setTeams(mockDb.getTeams());
    setUsers(mockDb.getUsers());
  }, []);

  const cleanRepoPath = (path: string) => {
    return path
      .replace(/https?:\/\/github\.com\//, '')
      .replace(/\/$/, '')
      .trim();
  };

  const handleTestConnection = async () => {
    if (!newRepoUrl) return;
    setTesting(true);
    setTestResult(null);
    try {
      const repoPath = cleanRepoPath(newRepoUrl);
      await githubService.validateRepo(repoPath, githubToken);
      setTestResult({ success: true, message: `Connected to ${repoPath}!` });
    } catch (e: any) {
      setTestResult({ success: false, message: e.message });
    } finally {
      setTesting(false);
    }
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName || !newRepoUrl) return;

    const repoPath = cleanRepoPath(newRepoUrl);

    const newTeam: Team = {
      team_id: `t${Date.now()}`,
      team_name: newTeamName,
      repo_url: repoPath,
      created_by: currentUser!.user_id,
      github_token: githubToken.trim() || undefined
    };

    const updatedTeams = [...teams, newTeam];
    setTeams(updatedTeams);
    mockDb.saveTeams(updatedTeams);
    setNewTeamName('');
    setNewRepoUrl('');
    setGithubToken('');
    setTestResult(null);
  };

  const handleUpdateUserTeam = (userId: string, teamId: string) => {
    const updatedUsers = users.map(u => u.user_id === userId ? { ...u, team_id: teamId } : u);
    setUsers(updatedUsers);
    mockDb.saveUsers(updatedUsers);
  };

  const handleUpdateGithubUsername = (userId: string, githubUsername: string) => {
    const updatedUsers = users.map(u => u.user_id === userId ? { ...u, github_username: githubUsername } : u);
    setUsers(updatedUsers);
    mockDb.saveUsers(updatedUsers);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Director Portal</h1>
          <p className="text-slate-500">System Setup & Team Architecture</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Team Creation */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Create New Team</h2>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Team Name</label>
                <input 
                  type="text"
                  required
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  placeholder="e.g. Core Engineering"
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">GitHub Repo Path</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    required
                    value={newRepoUrl}
                    onChange={e => setNewRepoUrl(e.target.value)}
                    placeholder="owner/repo"
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  <button 
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-xs font-bold"
                  >
                    {testing ? '...' : 'Test'}
                  </button>
                </div>
                {testResult && (
                  <p className={`text-[10px] mt-1 font-medium ${testResult.success ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {testResult.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  GitHub Token <span className="text-xs font-normal text-slate-400">(Optional)</span>
                </label>
                <input 
                  type="password"
                  value={githubToken}
                  onChange={e => setGithubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Required for private repos or high-volume usage.</p>
              </div>
              <button className="w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100">
                Initialize Team
              </button>
            </form>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl">
             <h3 className="text-lg font-bold mb-2">Team Overview</h3>
             <div className="space-y-4">
               {teams.length === 0 ? (
                 <p className="text-slate-400 text-sm">No teams configured yet.</p>
               ) : (
                 teams.map(t => (
                   <div key={t.team_id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                     <div>
                       <p className="font-semibold text-white">{t.team_name}</p>
                       <p className="text-xs text-indigo-300">{t.repo_url}</p>
                     </div>
                     <div className="flex flex-col items-end gap-1">
                        <span className="text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-lg">Active</span>
                        {t.github_token && <span className="text-[10px] text-emerald-400">Auth Enabled</span>}
                     </div>
                   </div>
                 ))
               )}
             </div>
          </div>
        </div>

        {/* User Mapping */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Developer Mapping</h2>
              <p className="text-sm text-slate-500">Link GitHub usernames to internal employees for impact tracking</p>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">GitHub Username</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Team</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.filter(u => u.role !== 'Director').map(u => (
                  <tr key={u.user_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-800">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold ${u.role === 'Manager' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <input 
                        type="text"
                        defaultValue={u.github_username}
                        onBlur={(e) => handleUpdateGithubUsername(u.user_id, e.target.value)}
                        className="bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-500 focus:outline-none text-sm text-slate-700 w-full"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={u.team_id || ''}
                        onChange={(e) => handleUpdateUserTeam(u.user_id, e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg text-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Unassigned</option>
                        {teams.map(t => (
                          <option key={t.team_id} value={t.team_id}>{t.team_name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectorDashboard;
