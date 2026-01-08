
import { githubService } from './githubService';
import { mockDb } from './mockDb';
import { CommitData, ScoreMetrics } from '../types';

export const api = {
  syncTeamData: async (teamId: string, useDemo: boolean = false) => {
    const teams = mockDb.getTeams();
    const team = teams.find(t => t.team_id === teamId);
    if (!team) throw new Error("Team not found");

    const rawCommits = useDemo ? githubService.getDemoCommits() : await githubService.fetchCommits(team.repo_url, team.github_token);

    const processedCommits: CommitData[] = rawCommits.map((c: any) => {
      const activity_score = (1 * 1) + (c.is_pr_merged ? 2 : 0);
      const impact_score = (c.is_bug_fix ? 5 : 0) + (c.is_pr_merged ? 3 : 0) + (c.files_changed * 0.5);
      const collaboration_score = (c.pr_reviews_given * 4) + (c.review_comments * 2) + (c.issue_comments * 1.5);
      const visibility_score = (c.slack_messages * 1) + (c.slack_threads * 2) + (c.slack_mentions * 1.5);
      const final_score = (0.2 * activity_score) + (0.6 * impact_score) + (0.2 * collaboration_score);

      return {
        ...c,
        commit_id: c.sha,
        github_commit_hash: c.sha,
        author_username: c.author,
        timestamp: c.date,
        commit_message: c.message,
        activity_score,
        impact_score,
        collaboration_score,
        visibility_score,
        final_score
      };
    });

    mockDb.saveCommits(teamId, processedCommits);
    api.calculateTeamRankings(teamId);
    return processedCommits;
  },

  calculateTeamRankings: (teamId: string) => {
    const commits = mockDb.getCommitsByTeam(teamId);
    if (!commits.length) return;

    const allFeedback = mockDb.getClientFeedback();

    const userStats = new Map<string, { 
      impact: number, activity: number, collab: number, vis: number, final: number, count: number 
    }>();

    commits.forEach(c => {
      if (!userStats.has(c.author_username)) {
        userStats.set(c.author_username, { impact: 0, activity: 0, collab: 0, vis: 0, final: 0, count: 0 });
      }
      const s = userStats.get(c.author_username)!;
      s.impact += c.impact_score;
      s.activity += c.activity_score;
      s.collab += c.collaboration_score;
      s.vis += c.visibility_score;
      s.final += c.final_score;
      s.count += 1;
    });

    const userMetrics = Array.from(userStats.entries()).map(([username, s]) => {
      const avgImpact = s.impact / s.count;
      
      // Calculate Feedback Bonus
      const userFeedback = allFeedback.filter(f => f.user_id === username).length;
      const feedbackBonus = userFeedback * 1.5; // Internal bonus points

      return {
        user_id: username,
        avg_impact: avgImpact + feedbackBonus,
        avg_activity: s.activity / s.count,
        avg_collaboration: s.collab / s.count,
        avg_visibility: s.vis / s.count,
        final_contribution_score: (s.final / s.count) + (feedbackBonus * 0.5),
      };
    });

    const teamAvgImpact = userMetrics.reduce((a, b) => a + b.avg_impact, 0) / userMetrics.length;
    const teamAvgVisibility = userMetrics.reduce((a, b) => a + (b.avg_activity + b.avg_visibility), 0) / userMetrics.length;

    const rankings: ScoreMetrics[] = userMetrics.map(u => {
      const combinedVisibility = u.avg_activity + u.avg_visibility;
      
      let badge: ScoreMetrics['badge'] = 'Balanced Contributor';
      if (u.avg_impact > teamAvgImpact && combinedVisibility < teamAvgVisibility) {
        badge = 'Silent Architect';
      } else if (u.avg_impact < teamAvgImpact && combinedVisibility > teamAvgVisibility) {
        badge = 'High Visibility / Low Impact';
      }

      return {
        ...u,
        rank: 0,
        badge
      };
    });

    rankings.sort((a, b) => b.final_contribution_score - a.final_contribution_score);
    rankings.forEach((r, i) => r.rank = i + 1);

    localStorage.setItem(`impactlens_scores_${teamId}`, JSON.stringify(rankings));
  }
};
