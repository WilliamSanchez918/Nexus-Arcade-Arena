import {
  levelFromXp,
  xpRules
} from '../../../../packages/shared/src/index.js';
import {
  LeaderboardEntry,
  PlayerGameStats,
  PlayerInventory,
  PlayerProfile
} from '../models/index.js';

function scoreIsTopTen(existingScores, score) {
  if (existingScores.length < 10) {
    return true;
  }
  return score > Math.min(...existingScores.map((entry) => entry.score));
}

export async function applyProgressionForResult({ gameSession, resultPayload }) {
  const awards = [];
  const leaderboardScores = await LeaderboardEntry.find({
    gameId: resultPayload.gameId,
    siteId: resultPayload.siteId,
    scope: 'site'
  }).sort({ score: -1 }).limit(10);

  for (const playerResult of resultPayload.players) {
    if (!playerResult.playerId || playerResult.playerId === 'guest') {
      continue;
    }

    const profile = await PlayerProfile.findById(playerResult.playerId);
    if (!profile) {
      continue;
    }

    const stats = await PlayerGameStats.findOneAndUpdate(
      { playerId: profile._id, gameId: resultPayload.gameId },
      { $setOnInsert: { playerId: profile._id, gameId: resultPayload.gameId } },
      { upsert: true, new: true }
    );

    const previousBest = stats.bestScore || 0;
    const beatPersonalBest = playerResult.score > previousBest;
    const isWinner = String(playerResult.result || '').toLowerCase() === 'win';
    let xpAwarded = xpRules.playGame + xpRules.finishRound;

    if (beatPersonalBest) {
      xpAwarded += xpRules.beatPersonalBest;
    }
    if (isWinner) {
      xpAwarded += xpRules.winVersusMatch;
      stats.wins += 1;
    } else if (resultPayload.mode === 'versus') {
      stats.losses += 1;
    }
    if (scoreIsTopTen(leaderboardScores, playerResult.score)) {
      xpAwarded += xpRules.topTenLocalScore;
    }

    stats.totalPlays += 1;
    stats.totalScore += playerResult.score;
    stats.bestScore = Math.max(stats.bestScore || 0, playerResult.score);
    stats.lastPlayedAt = new Date(resultPayload.endedAt);
    if (!stats.achievements.some((achievement) => achievement.achievementId === 'first_run')) {
      stats.achievements.push({ achievementId: 'first_run', unlockedAt: new Date() });
    }
    if (beatPersonalBest && !stats.achievements.some((achievement) => achievement.achievementId === 'personal_best')) {
      stats.achievements.push({ achievementId: 'personal_best', unlockedAt: new Date() });
    }
    await stats.save();

    profile.progression.xp += xpAwarded;
    profile.progression.level = levelFromXp(profile.progression.xp);
    profile.progression.lifetimePlays += 1;
    profile.lastPlayedAt = new Date(resultPayload.endedAt);
    await profile.save();

    await PlayerInventory.updateOne(
      { playerId: profile._id },
      {
        $setOnInsert: { playerId: profile._id },
        $addToSet: {
          cosmetics: {
            cosmeticId: beatPersonalBest ? 'frame_personal_best' : 'badge_first_run',
            source: 'progression'
          }
        }
      },
      { upsert: true }
    );

    await LeaderboardEntry.create({
      gameId: resultPayload.gameId,
      scope: 'global',
      season: 'all-time',
      playerId: profile._id,
      displayName: profile.displayName,
      avatarSnapshot: profile.avatar,
      score: playerResult.score,
      gameSessionId: gameSession._id,
      achievedAt: new Date(resultPayload.endedAt)
    });
    await LeaderboardEntry.create({
      gameId: resultPayload.gameId,
      scope: 'site',
      siteId: resultPayload.siteId,
      season: 'all-time',
      playerId: profile._id,
      displayName: profile.displayName,
      avatarSnapshot: profile.avatar,
      score: playerResult.score,
      gameSessionId: gameSession._id,
      achievedAt: new Date(resultPayload.endedAt)
    });

    awards.push({
      playerId: String(profile._id),
      xpAwarded,
      level: profile.progression.level,
      beatPersonalBest,
      bestScore: stats.bestScore
    });
  }

  return awards;
}
