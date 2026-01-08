
import { User, Team, CommitData, ClientFeedback, WorkSubmission } from '../types';
import { INITIAL_USERS } from '../constants';

const DB_KEYS = {
  USERS: 'impactlens_users',
  TEAMS: 'impactlens_teams',
  COMMITS: 'impactlens_commits',
  SCORES: 'impactlens_scores',
  FEEDBACK: 'impactlens_client_feedback',
  WORK: 'impactlens_work_submissions',
};

export const mockDb = {
  getUsers: (): User[] => {
    const data = localStorage.getItem(DB_KEYS.USERS);
    if (!data) {
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(data);
  },
  saveUsers: (users: User[]) => {
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
  },
  getTeams: (): Team[] => {
    const data = localStorage.getItem(DB_KEYS.TEAMS);
    return data ? JSON.parse(data) : [];
  },
  saveTeams: (teams: Team[]) => {
    localStorage.setItem(DB_KEYS.TEAMS, JSON.stringify(teams));
  },
  getCommitsByTeam: (teamId: string): CommitData[] => {
    const data = localStorage.getItem(`${DB_KEYS.COMMITS}_${teamId}`);
    return data ? JSON.parse(data) : [];
  },
  saveCommits: (teamId: string, commits: CommitData[]) => {
    localStorage.setItem(`${DB_KEYS.COMMITS}_${teamId}`, JSON.stringify(commits));
  },

  // New storage methods for uploads
  saveClientFeedback: (feedback: ClientFeedback) => {
    const current = mockDb.getClientFeedback();
    localStorage.setItem(DB_KEYS.FEEDBACK, JSON.stringify([...current, feedback]));
  },
  getClientFeedback: (): ClientFeedback[] => {
    const data = localStorage.getItem(DB_KEYS.FEEDBACK);
    return data ? JSON.parse(data) : [];
  },
  saveWorkSubmission: (submission: WorkSubmission) => {
    const current = mockDb.getWorkSubmissions();
    localStorage.setItem(DB_KEYS.WORK, JSON.stringify([...current, submission]));
  },
  getWorkSubmissions: (): WorkSubmission[] => {
    const data = localStorage.getItem(DB_KEYS.WORK);
    return data ? JSON.parse(data) : [];
  },

  syncTeamEmployees: (teamId: string, collaborators: {login: string, id: number, avatar_url: string}[]) => {
    const currentUsers = mockDb.getUsers();
    const newEmployees: User[] = collaborators.map(c => ({
      user_id: c.login,
      name: c.login,
      role: 'Employee',
      github_username: c.login,
      password: 'emp123',
      team_id: teamId,
      avatar_url: c.avatar_url,
      is_technical: true
    }));

    let updated = [...currentUsers];
    newEmployees.forEach(emp => {
      const existingIdx = updated.findIndex(u => u.github_username === emp.github_username);
      if (existingIdx === -1) {
        updated.push(emp);
      } else {
        updated[existingIdx] = { ...updated[existingIdx], team_id: teamId, is_technical: true };
      }
    });

    mockDb.saveUsers(updated);
  },
  
  verifyCredentials: async (usernameOrId: string, password: string): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const users = mockDb.getUsers();
    const user = users.find(u => 
      (u.user_id === usernameOrId || u.github_username === usernameOrId) && 
      u.password === password
    );
    return user || null;
  }
};
