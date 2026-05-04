import { LeaderboardEntry } from '../models/index.js';

export async function listLeaderboard({ gameId, scope = 'global', siteId, season = 'all-time', limit = 25 }) {
  const query = { gameId, scope, season };
  if (scope === 'site') {
    query.siteId = siteId;
  }
  const entries = await LeaderboardEntry.find(query)
    .sort({ score: -1, achievedAt: 1 })
    .limit(Math.min(Number(limit) || 25, 100))
    .lean();

  return entries.map((entry, index) => ({
    rank: index + 1,
    playerId: entry.playerId ? String(entry.playerId) : undefined,
    displayName: entry.displayName,
    avatar: entry.avatarSnapshot,
    score: entry.score,
    achievedAt: entry.achievedAt,
    scope: entry.scope,
    siteId: entry.siteId,
    season: entry.season
  }));
}
