
export type Role = 'Director' | 'Manager' | 'Employee';

export interface User {
  user_id: string;
  name: string;
  role: Role;
  github_username: string;
  team_id?: string;
  avatar_url?: string;
}

export interface Team {
  team_id: string;
  team_name: string;
  repo_url: string; 
  created_by: string;
  github_token?: string;
}

export interface CommitData {
  commit_id: string;
  github_commit_hash: string;
  author_username: string;
  lines_added: number;
  lines_deleted: number;
  commit_message: string;
  timestamp: string;
  files_changed: number;
  is_bug_fix: boolean;
  is_pr_merged: boolean;
  pr_reviews_given: number;
  review_comments: number;
  issue_comments: number;
  slack_messages: number;
  slack_threads: number;
  slack_mentions: number;
  // Computed scores
  activity_score: number;
  impact_score: number;
  collaboration_score: number;
  visibility_score: number;
  final_score: number;
  // AI related fields
  ai_explanation?: string;
}

export interface ScoreMetrics {
  user_id: string;
  avg_activity: number;
  avg_impact: number;
  avg_collaboration: number;
  avg_visibility: number;
  final_contribution_score: number;
  rank: number;
  badge: 'Silent Architect' | 'High Visibility / Low Impact' | 'Balanced Contributor' | 'N/A';
  // Additional metrics used in UI
  category?: string;
  z_score?: number;
}
