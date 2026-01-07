
import { User, Role } from './types';

export const INITIAL_USERS: User[] = [
  { user_id: 'u1', name: 'Alice Director', role: 'Director', github_username: 'alice_dir' },
  { user_id: 'u2', name: 'Bob Manager', role: 'Manager', github_username: 'bob_mgr' },
  { user_id: 'u3', name: 'Charlie Dev', role: 'Employee', github_username: 'charlie_code' },
];

export const ROLE_PERMISSIONS = {
  Director: ['setup_teams', 'view_all', 'manage_users'],
  Manager: ['view_dashboard', 'analyze_repo', 'view_team'],
  Employee: ['view_personal_stats', 'view_transparency_report'],
};

export const GITHUB_API_BASE = 'https://api.github.com';
