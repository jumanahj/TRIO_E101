
import { User, Team, CommitData, ScoreMetrics } from '../types';
import { INITIAL_USERS } from '../constants';

const DB_KEYS = {
  USERS: 'impactlens_users',
  TEAMS: 'impactlens_teams',
  COMMITS: 'impactlens_commits',
  SCORES: 'impactlens_scores',
};

export const mockDb = {
  getUsers: (): User[] => {
    const data = localStorage.getItem(DB_KEYS.USERS);
    return data ? JSON.parse(data) : INITIAL_USERS;
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
};
