
import React, { useState, useEffect, useMemo } from 'react';
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
  const [assignedManagerId, setAssignedManagerId] = useState('');
  
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);
  const [scannedMembers, setScannedMembers] = useState<{login: string, avatar_url: string}[]>([]);

  useEffect(() => {
    setTeams(mockDb.getTeams());
    setUsers(mockDb.getUsers());
    const managers = mockDb.getUsers().filter(u => u.role === 'Manager');
    if (managers.length > 0) setAssignedManagerId(managers[0].user_id);
  }, []);

  const managers = users.filter(u => u.role === 'Manager');

  const cleanRepoPath = (path: string) => {
    return path
      .replace(/https?:\/\/github\.com\//, '')
      .replace(/\/$/, '')
      .trim();
  };

  const handleTestAndScan = async () => {
    if (!newRepoUrl) return;
    setTesting(true);
    setTestResult(null);
    setScannedMembers([]);
    try {
      const repoPath = cleanRepoPath(newRepoUrl);
      await githubService.validateRepo(repoPath, githubToken);
      
      const collaborators = await githubService.fetchCollaborators(repoPath, githubToken);
      setScannedMembers(collaborators);
      
      setTestResult({ success: true, message: `Connected! Found ${collaborators.length} collaborators.` });
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
    const teamId = `t${Date.now()}`;

    const newTeam: Team = {
      team_id: teamId,
      team_name: newTeamName,
      repo_url: repoPath,
      created_by: currentUser!.user_id,
      assigned_manager_id: assignedManagerId || undefined,
      github_token: githubToken.trim() || undefined
    };

    const updatedTeams = [...teams, newTeam];
    setTeams(updatedTeams);
    mockDb.saveTeams(updatedTeams);

    if (scannedMembers.length > 0) {
      mockDb.syncTeamEmployees(teamId, scannedMembers as any);
      setUsers(mockDb.getUsers()); 
    }

    setNewTeamName('');
    setNewRepoUrl('');
    setGithubToken('');
    setTestResult(null);
    setScannedMembers([]);
  };

  const getManagerName = (mid?: string) => {
    const m = managers.find(u => u.user_id === mid);
    return m ? m.name : 'Unassigned';
  };

  const teamGroupedEmployees = useMemo(() => {
    const employeeUsers = users.filter(u => u.role === 'Employee');
    const groups: Record<string, User[]> = {};
    
    employeeUsers.forEach(u => {
      const tid = u.team_id || 'unassigned';
      if (!groups[tid]) groups[tid] = [];
      groups[tid].push(u);
    });
    
    return groups;
  }, [users]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Director Portal</h1>
          <p className="text-slate-500">Organizational Governance & Team Delegation</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Provision New Team</h2>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign Responsible Manager</label>
                <select 
                  value={assignedManagerId}
                  onChange={e => setAssignedManagerId(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="">Choose a Manager...</option>
                  {managers.map(m => (
                    <option key={m.user_id} value={m.user_id}>{m.name}</option>
                  ))}
                </select>
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
                    onClick={handleTestAndScan}
                    disabled={testing}
                    className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-xs font-bold whitespace-nowrap"
                  >
                    {testing ? 'Scanning...' : 'Scan Repo'}
                  </button>
                </div>
                {testResult && (
                  <p className={`text-[10px] mt-1 font-medium ${testResult.success ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {testResult.message}
                  </p>
                )}
              </div>

              {scannedMembers.length > 0 && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Collaborators Found</h3>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                    {scannedMembers.map(m => (
                      <div key={m.login} className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <img src={m.avatar_url} className="w-4 h-4 rounded-full" alt="" />
                        <span className="text-[10px] font-bold text-slate-700">@{m.login}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button 
                type="submit"
                disabled={!testResult?.success}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100 disabled:opacity-50"
              >
                Initialize Team
              </button>
            </form>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl">
             <h3 className="text-lg font-bold mb-4">Manager Directory</h3>
             <div className="space-y-3">
               {managers.map(m => (
                 <div key={m.user_id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                   <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-xs">
                     {m.name.charAt(0)}
                   </div>
                   <div>
                     <p className="text-sm font-bold">{m.name}</p>
                     <p className="text-[10px] text-slate-400 tracking-wider uppercase">Active Manager</p>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Team-wise Organization Structure</h2>
              <p className="text-sm text-slate-500">View team groupings and manager assignments</p>
            </div>
            <div className="p-6 space-y-6 max-h-[700px] overflow-y-auto custom-scrollbar">
              {teams.length === 0 ? (
                <div className="text-center py-10 text-slate-400 italic">No teams registered in the system.</div>
              ) : (
                teams.map(team => (
                  <div key={team.team_id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-black text-slate-900">Team: {team.team_name}</h3>
                        <p className="text-xs text-slate-500 font-mono">{team.repo_url}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black uppercase text-indigo-500 block mb-1">Manager</span>
                        <span className="px-3 py-1 bg-white border border-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                          {getManagerName(team.assigned_manager_id)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase text-slate-400 block tracking-widest">Employees ({teamGroupedEmployees[team.team_id]?.length || 0})</span>
                      <div className="flex flex-wrap gap-2">
                        {teamGroupedEmployees[team.team_id]?.map(emp => (
                          <div key={emp.user_id} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-200 shadow-sm">
                            {emp.avatar_url && <img src={emp.avatar_url} className="w-4 h-4 rounded-full" alt="" />}
                            <span className="text-xs font-bold text-slate-700">@{emp.github_username}</span>
                          </div>
                        )) || <p className="text-xs text-slate-400 italic">No employees assigned to this repo yet.</p>}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {teamGroupedEmployees['unassigned'] && (
                <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100 space-y-4">
                  <h3 className="text-lg font-black text-rose-900">Unassigned Talent</h3>
                  <div className="flex flex-wrap gap-2">
                    {teamGroupedEmployees['unassigned'].map(emp => (
                      <div key={emp.user_id} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-rose-200 shadow-sm">
                        <span className="text-xs font-bold text-rose-700">@{emp.github_username}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectorDashboard;
