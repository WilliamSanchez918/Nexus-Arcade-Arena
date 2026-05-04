export const GAME_SIZE = Object.freeze({
  width: 960,
  height: 540,
  groundY: 386,
  minPlayerX: 118,
  maxPlayerX: 560
});

export const RUNNER_TUNING = Object.freeze({
  moveSpeed: 380,
  airMoveSpeed: 330,
  jumpVelocity: -610,
  doubleJumpVelocity: -560,
  coyoteMs: 120,
  jumpBufferMs: 140,
  dashSpeed: 760,
  dashSeconds: 0.16,
  dashCooldownSeconds: 1.15,
  hurtInvulnerableMs: 950,
  maxCollisions: 4,
  startSpeed: 310,
  speedRampPerSecond: 7.5,
  scoreRate: 1.05
});

export const HAZARD_TYPES = Object.freeze([
  { kind: 'hurdle', y: 333, width: 48, height: 72, color: 0xff2ed1, telegraph: 'JUMP' },
  { kind: 'low_bar', y: 252, width: 92, height: 30, color: 0x8b2cff, telegraph: 'SLIDE' },
  { kind: 'floor_laser', y: 366, width: 126, height: 18, color: 0xffd400, telegraph: 'AIR' },
  { kind: 'split_gate', y: 318, width: 42, height: 112, color: 0x00e5ff, telegraph: 'DASH' }
]);

export const PICKUP_TYPES = Object.freeze([
  { kind: 'boost', score: 700, color: 0x25ff9a, radius: 19 },
  { kind: 'shard', score: 260, color: 0xffd400, radius: 13 },
  { kind: 'time', score: 120, color: 0x00e5ff, radius: 15 }
]);
