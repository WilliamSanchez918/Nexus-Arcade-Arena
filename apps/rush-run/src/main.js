import Phaser from 'phaser';
import { buildSignedResult, parseLaunchParams } from './contract.js';
import {
  avatarTelemetry,
  runnerVisualProfile,
  runtimeAvatarForPlayer
} from './avatarContract.js';
import {
  GAME_SIZE,
  HAZARD_TYPES,
  PICKUP_TYPES,
  RUNNER_TUNING
} from './gameTuning.js';
import './styles.css';

const { launchPayload, callbackUrl, callbackSecret } = parseLaunchParams();
const primaryPlayer = launchPayload.players[0];
const primaryAvatar = runtimeAvatarForPlayer(primaryPlayer);
const avatarProfile = runnerVisualProfile(primaryAvatar);
const avatarColors = primaryAvatar.colors;
const avatarEquipment = primaryAvatar.equipment;

function colorNumber(hex, fallback = 0x00e5ff) {
  if (!/^#[0-9a-f]{6}$/i.test(hex || '')) {
    return fallback;
  }
  return Number.parseInt(hex.slice(1), 16);
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

document.documentElement.style.setProperty('--player-primary', avatarColors.primary);
document.documentElement.style.setProperty('--player-secondary', avatarColors.secondary);
document.documentElement.style.setProperty('--player-accent', avatarColors.accent);
setText('player-label', `${primaryPlayer.displayName} - Level ${primaryPlayer.level}`);
setText('avatar-contract', `${primaryAvatar.manifestVersion} - ${primaryAvatar.avatarId}`);

function createAvatarRunner(scene, runtimeAvatar) {
  const colors = runtimeAvatar.colors;
  const equipment = runtimeAvatar.equipment;
  const visual = runnerVisualProfile(runtimeAvatar);
  const primary = colorNumber(colors.primary);
  const secondary = colorNumber(colors.secondary, 0xff2ed1);
  const accent = colorNumber(colors.accent, 0xffd400);
  const suit = equipment.outfit === 'outfit_laser_varsity' ? 0xf6f8ff : 0x111827;
  const skin = runtimeAvatar.morphology.bodyType === 'android' ? 0x9aa4c9 : 0xc98b64;
  const container = scene.add.container(0, 0);

  if (visual.hasBack) {
    container.add(scene.add.rectangle(-10, 0, 58, 74, 0x07101f, 0.9).setStrokeStyle(2, secondary, 0.8));
  }

  const leftLeg = scene.add.rectangle(-14, 22, 10 * visual.bootScale, 46, suit).setOrigin(0.5, 0);
  const rightLeg = scene.add.rectangle(14, 22, 10 * visual.bootScale, 46, suit).setOrigin(0.5, 0);
  const leftBoot = scene.add.rectangle(-14, 66, 18 * visual.bootScale, 12, primary).setOrigin(0.5, 0);
  const rightBoot = scene.add.rectangle(14, 66, 18 * visual.bootScale, 12, primary).setOrigin(0.5, 0);
  const torso = scene.add.rectangle(0, -8, 42 * visual.bodyScale, 58, suit).setStrokeStyle(3, primary, 0.86);
  const sash = scene.add.rectangle(-7, -10, 12, 64, secondary, 0.92).setRotation(0.22);
  const leftArm = scene.add.rectangle(-31 * visual.bodyScale, -18, 10, 42, secondary).setOrigin(0.5, 0);
  const rightArm = scene.add.rectangle(31 * visual.bodyScale, -18, 10, 42, secondary).setOrigin(0.5, 0);
  const leftHand = scene.add.circle(-34 * visual.bodyScale, 25, 7, skin);
  const rightHand = scene.add.circle(34 * visual.bodyScale, 25, 7, skin);
  const neck = scene.add.rectangle(0, -45, 12, 14, skin);
  const head = scene.add.ellipse(0, -70, 36 * visual.headScale, 44 * visual.headScale, skin);
  const visor = scene.add.rectangle(4, -74, 32 * visual.headScale, 8, secondary).setStrokeStyle(1, 0x050914, 0.8);

  container.add([leftLeg, rightLeg, leftBoot, rightBoot, torso, sash, leftArm, rightArm, leftHand, rightHand, neck, head, visor]);

  if (visual.hasHelmet) {
    container.add(scene.add.ellipse(0, -73, 43 * visual.headScale, 48 * visual.headScale, 0x101827, 0.84).setStrokeStyle(2, primary, 0.9));
    container.add(scene.add.rectangle(3, -73, 34 * visual.headScale, 10, secondary, 0.9));
  } else if (equipment.hair && equipment.hair !== 'hair_none') {
    const hairColor = equipment.hair.includes('mullet') ? 0x5b3525 : accent;
    container.add(scene.add.rectangle(0, -96, 28 * visual.headScale, 18, hairColor));
    if (equipment.hair.includes('mullet')) {
      container.add(scene.add.rectangle(0, -82, 30 * visual.headScale, 28, hairColor, 0.78));
    }
  }

  if (equipment.badge && equipment.badge !== 'rookie') {
    container.add(scene.add.star(16, -20, 5, 4, 9, accent, 0.86));
  }

  return {
    container,
    parts: {
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      leftHand,
      rightHand,
      head,
      torso,
      sash
    }
  };
}

class RushRunScene extends Phaser.Scene {
  constructor() {
    super('RushRunScene');
    this.score = 0;
    this.boosts = 0;
    this.collisions = 0;
    this.timeRemaining = 75;
    this.speed = RUNNER_TUNING.startSpeed;
    this.finished = false;
    this.airJumpsRemaining = 1;
    this.jumpBufferUntil = 0;
    this.lastGroundedAt = 0;
    this.dashSeconds = 0;
    this.dashCooldown = 0;
    this.dashDirection = 1;
    this.invulnerableUntil = 0;
    this.combo = 1;
    this.pickupStreak = 0;
    this.nextHazardDelay = 1850;
    this.nextPickupDelay = 900;
  }

  preload() {
    this.load.svg('runner', '/assets/runner.svg', { width: 72, height: 96 });
    this.load.svg('track', '/assets/track-tile.svg', { width: 256, height: 128 });
  }

  create() {
    this.createWorld();
    this.runner = this.physics.add.sprite(190, 286, 'runner');
    this.runner.setVisible(false);
    this.runner.setCollideWorldBounds(false);
    this.setStandingHitbox();

    this.avatarRig = createAvatarRunner(this, primaryAvatar);
    this.avatarRig.container.setPosition(this.runner.x, this.runner.y);

    this.trail = this.add.rectangle(
      128,
      310,
      avatarProfile.trailStyle === 'trail_comet' ? 128 : 84,
      10,
      colorNumber(avatarProfile.trailStyle === 'trail_comet' ? avatarColors.accent : avatarColors.primary, 0x00e5ff),
      avatarProfile.trailStyle === 'trail_comet' ? 0.6 : 0.38
    );

    this.ground = this.add.rectangle(GAME_SIZE.width / 2, GAME_SIZE.groundY, GAME_SIZE.width, 12, 0x00e5ff, 0);
    this.physics.add.existing(this.ground, true);
    this.physics.add.collider(this.runner, this.ground);

    this.hazards = this.physics.add.group({ allowGravity: false, immovable: true });
    this.pickups = this.physics.add.group({ allowGravity: false, immovable: true });
    this.physics.add.overlap(this.runner, this.hazards, this.hitHazard, undefined, this);
    this.physics.add.overlap(this.runner, this.pickups, this.collectPickup, undefined, this);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('A,D,W,S,J,SPACE');
    this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.input.keyboard.addCapture(['UP', 'DOWN', 'LEFT', 'RIGHT', 'SPACE', 'SHIFT', 'W', 'A', 'S', 'D', 'J']);

    this.time.addEvent({ delay: 1000, loop: true, callback: this.tickClock, callbackScope: this });
    this.refreshHud();
  }

  createWorld() {
    this.add.rectangle(480, 270, 960, 540, 0x060a14);
    this.add.rectangle(480, 394, 960, 4, colorNumber(avatarColors.primary), 0.95);
    this.add.rectangle(480, 408, 960, 4, colorNumber(avatarColors.secondary, 0xff2ed1), 0.72);
    this.track = this.add.tileSprite(480, 350, 960, 132, 'track').setScrollFactor(0).setName('track');
    this.backLines = [0, 1, 2, 3].map((index) => this.add.tileSprite(
      480,
      130 + index * 48,
      960,
      20,
      'track'
    ).setAlpha(0.05 + index * 0.025));
    this.aura = this.add.circle(
      190,
      292,
      54,
      colorNumber(avatarColors.secondary, 0xff2ed1),
      avatarProfile.auraStyle === 'aura_electric' ? 0.24 : 0.1
    );
  }

  update(_time, delta) {
    if (this.finished) {
      return;
    }

    const seconds = delta / 1000;
    const now = this.time.now;
    this.updateTimers(seconds);
    this.updateScore(seconds);
    this.updateMovement(seconds, now);
    this.updateWorld(seconds);
    this.updateSpawns(delta);
    this.cleanupObjects();
    this.refreshHud();
  }

  updateTimers(seconds) {
    this.speed += seconds * RUNNER_TUNING.speedRampPerSecond;
    this.dashCooldown = Math.max(0, this.dashCooldown - seconds);
    this.dashSeconds = Math.max(0, this.dashSeconds - seconds);
  }

  updateScore(seconds) {
    this.score += Math.round(seconds * this.speed * RUNNER_TUNING.scoreRate * this.combo);
    setText('score', this.score.toLocaleString());
  }

  updateMovement(seconds, now) {
    const grounded = this.runner.body.touching.down || this.runner.body.blocked.down;
    if (grounded) {
      this.airJumpsRemaining = 1;
      this.lastGroundedAt = now;
    }

    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const jumpHeld = this.cursors.up.isDown || this.keys.W.isDown || this.keys.SPACE.isDown;
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.keys.W) ||
      Phaser.Input.Keyboard.JustDown(this.keys.SPACE);
    const slideHeld = grounded && (this.cursors.down.isDown || this.keys.S.isDown);
    const dashPressed = Phaser.Input.Keyboard.JustDown(this.shiftKey) || Phaser.Input.Keyboard.JustDown(this.keys.J);

    if (jumpPressed) {
      this.jumpBufferUntil = now + RUNNER_TUNING.jumpBufferMs;
    }

    if (this.jumpBufferUntil > now) {
      this.tryJump(grounded, now);
    }

    if (!jumpHeld && this.runner.body.velocity.y < -230) {
      this.runner.setVelocityY(this.runner.body.velocity.y * 0.74);
    }

    if (dashPressed && this.dashCooldown <= 0) {
      this.dashDirection = left ? -1 : 1;
      this.dashSeconds = RUNNER_TUNING.dashSeconds;
      this.dashCooldown = RUNNER_TUNING.dashCooldownSeconds;
      this.invulnerableUntil = now + 220;
      this.cameras.main.flash(60, 37, 255, 154);
      this.triggerAvatarEmote('dash');
    }

    if (slideHeld) {
      this.setSlidingHitbox();
    } else {
      this.setStandingHitbox();
    }

    const maxSpeed = grounded ? RUNNER_TUNING.moveSpeed : RUNNER_TUNING.airMoveSpeed;
    const targetX = this.dashSeconds > 0
      ? this.dashDirection * RUNNER_TUNING.dashSpeed
      : (left ? -maxSpeed : right ? maxSpeed : 0);
    this.runner.setVelocityX(Phaser.Math.Linear(this.runner.body.velocity.x, targetX, Math.min(1, seconds * 13)));
    this.runner.x = Phaser.Math.Clamp(this.runner.x, GAME_SIZE.minPlayerX, GAME_SIZE.maxPlayerX);
    this.runner.setVelocityX(this.runner.x <= GAME_SIZE.minPlayerX && this.runner.body.velocity.x < 0 ? 0 : this.runner.body.velocity.x);
    this.runner.setVelocityX(this.runner.x >= GAME_SIZE.maxPlayerX && this.runner.body.velocity.x > 0 ? 0 : this.runner.body.velocity.x);

    this.isSliding = slideHeld;
    this.animateAvatar(seconds, grounded);
  }

  tryJump(grounded, now) {
    const canCoyoteJump = now - this.lastGroundedAt <= RUNNER_TUNING.coyoteMs;
    if (grounded || canCoyoteJump) {
      this.runner.setVelocityY(RUNNER_TUNING.jumpVelocity);
      this.jumpBufferUntil = 0;
      this.lastGroundedAt = -Infinity;
      this.triggerAvatarEmote('jump');
      return;
    }
    if (this.airJumpsRemaining > 0) {
      this.airJumpsRemaining -= 1;
      this.runner.setVelocityY(RUNNER_TUNING.doubleJumpVelocity);
      this.jumpBufferUntil = 0;
      this.triggerAvatarEmote('jump');
    }
  }

  updateWorld(seconds) {
    this.track.tilePositionX += seconds * this.speed;
    this.backLines.forEach((line, index) => {
      line.tilePositionX += seconds * this.speed * (0.12 + index * 0.06);
    });
    this.aura.setPosition(this.runner.x, this.runner.y + 4);
    this.trail.setPosition(this.runner.x - 54, this.runner.y + 27);
  }

  updateSpawns(delta) {
    this.nextHazardDelay -= delta;
    this.nextPickupDelay -= delta;
    if (this.nextHazardDelay <= 0) {
      this.spawnHazard();
      this.nextHazardDelay = Phaser.Math.Between(820, Math.max(940, 1420 - Math.round(this.speed * 0.9)));
    }
    if (this.nextPickupDelay <= 0) {
      this.spawnPickup();
      this.nextPickupDelay = Phaser.Math.Between(960, 1700);
    }
  }

  spawnHazard() {
    if (this.finished) {
      return;
    }
    const type = Phaser.Utils.Array.GetRandom(HAZARD_TYPES);
    const x = 1010;
    const hazard = this.add.rectangle(x, type.y, type.width, type.height, type.color, 0.78)
      .setStrokeStyle(3, 0xf6f8ff, 0.28);
    this.physics.add.existing(hazard);
    this.hazards.add(hazard);
    hazard.kind = type.kind;
    hazard.telegraph = type.telegraph;
    hazard.body.setAllowGravity(false);
    hazard.body.setImmovable(true);
    hazard.body.setVelocityX(-this.speed);

    const label = this.add.text(x, type.y - type.height / 2 - 22, type.telegraph, {
      color: '#f6f8ff',
      fontFamily: 'monospace',
      fontSize: '14px',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    hazard.label = label;
  }

  spawnPickup() {
    if (this.finished) {
      return;
    }
    const type = Phaser.Utils.Array.GetRandom(PICKUP_TYPES);
    const x = 1010;
    const y = Phaser.Math.Between(188, 318);
    const pickup = this.add.star(x, y, 4, Math.max(5, type.radius * 0.46), type.radius, type.color, 0.9)
      .setStrokeStyle(2, 0xf6f8ff, 0.42);
    this.physics.add.existing(pickup);
    this.pickups.add(pickup);
    pickup.kind = type.kind;
    pickup.scoreValue = type.score;
    pickup.body.setAllowGravity(false);
    pickup.body.setCircle(type.radius, -type.radius, -type.radius);
    pickup.body.setVelocityX(-this.speed * 0.92);
  }

  hitHazard(_runner, hazard) {
    const now = this.time.now;
    if (now < this.invulnerableUntil) {
      hazard.destroy();
      hazard.label?.destroy();
      this.score += 300;
      return;
    }

    hazard.destroy();
    hazard.label?.destroy();
    this.collisions += 1;
    this.combo = 1;
    this.pickupStreak = 0;
    this.score = Math.max(0, this.score - 500);
    this.invulnerableUntil = now + RUNNER_TUNING.hurtInvulnerableMs;
    this.cameras.main.shake(170, 0.012);
    this.cameras.main.flash(120, 255, 46, 96);
    this.triggerAvatarEmote('hurt');

    if (this.collisions >= RUNNER_TUNING.maxCollisions) {
      this.finishRun();
    }
  }

  collectPickup(_runner, pickup) {
    const kind = pickup.kind;
    const scoreValue = pickup.scoreValue;
    pickup.destroy();
    this.boosts += kind === 'boost' ? 1 : 0;
    this.pickupStreak += 1;
    this.combo = Math.min(3, 1 + this.pickupStreak * 0.15);
    this.score += Math.round(scoreValue * this.combo);

    if (kind === 'boost') {
      this.speed += 28;
      this.invulnerableUntil = this.time.now + 180;
    }
    if (kind === 'time') {
      this.timeRemaining = Math.min(99, this.timeRemaining + 4);
    }

    const flash = colorNumber(kind === 'time' ? avatarColors.primary : avatarColors.secondary, 0xff2ed1);
    this.cameras.main.flash(70, (flash >> 16) & 255, (flash >> 8) & 255, flash & 255);
    this.triggerAvatarEmote(kind === 'boost' ? 'dash' : 'pickup');
  }

  tickClock() {
    if (this.finished) {
      return;
    }
    this.timeRemaining -= 1;
    if (this.timeRemaining <= 0) {
      this.finishRun();
    }
  }

  cleanupObjects() {
    for (const group of [this.hazards, this.pickups]) {
      group.children.iterate((child) => {
        if (child && child.x < -100) {
          child.label?.destroy();
          child.destroy();
        } else if (child?.label) {
          child.label.x = child.x;
          child.label.y = child.y - child.height / 2 - 22;
        }
      });
    }
  }

  setStandingHitbox() {
    if (this.hitboxMode === 'stand') {
      return;
    }
    this.runner.body.setSize(44, 78).setOffset(14, 16);
    this.hitboxMode = 'stand';
  }

  setSlidingHitbox() {
    if (this.hitboxMode === 'slide') {
      return;
    }
    this.runner.body.setSize(62, 42).setOffset(5, 50);
    this.hitboxMode = 'slide';
  }

  refreshHud() {
    setText('score', this.score.toLocaleString());
    setText('timer', this.timeRemaining);
    setText('hits', `${Math.max(0, RUNNER_TUNING.maxCollisions - this.collisions)} HP`);
    setText('speed', `${Math.round(this.speed)} SPD`);
    setText('dash', this.dashCooldown <= 0 ? 'DASH' : `${this.dashCooldown.toFixed(1)}s`);
    setText('combo', `${this.combo.toFixed(1)}x`);
  }

  async finishRun() {
    if (this.finished) {
      return;
    }
    this.finished = true;
    this.physics.pause();
    const panel = document.getElementById('result-panel');
    const copy = document.getElementById('result-copy');
    panel.hidden = false;
    copy.textContent = `Final score ${this.score.toLocaleString()}. Submitting to Player Passport...`;

    if (!callbackUrl) {
      copy.textContent = `Final score ${this.score.toLocaleString()}. Demo mode only.`;
      return;
    }

    try {
      const result = await buildSignedResult({
        launchPayload,
        score: this.score,
        durationSeconds: 75 - this.timeRemaining,
        boosts: this.boosts,
        collisions: this.collisions,
        avatar: avatarTelemetry(primaryAvatar),
        callbackSecret
      });
      const response = await fetch(callbackUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(result)
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      copy.textContent = `Final score ${this.score.toLocaleString()} saved to Player Passport.`;
    } catch (error) {
      copy.textContent = `Final score ${this.score.toLocaleString()} queued or failed: ${error.message}`;
    }
  }

  animateAvatar(seconds, grounded) {
    const phase = this.time.now / 1000;
    const stride = Math.sin(phase * (grounded ? 13 : 5));
    const lift = grounded ? Math.abs(stride) * 4 : -5;
    const parts = this.avatarRig.parts;
    const hurtFlicker = this.time.now < this.invulnerableUntil ? 0.68 + Math.sin(phase * 40) * 0.22 : 1;
    const slideScaleY = this.isSliding ? 0.74 : 1;

    this.avatarRig.container.setPosition(this.runner.x, this.runner.y + lift + (this.isSliding ? 18 : 0));
    this.avatarRig.container.alpha = Phaser.Math.Clamp(hurtFlicker, 0.42, 1);
    parts.leftLeg.rotation = this.isSliding ? 0.96 : stride * 0.42;
    parts.rightLeg.rotation = this.isSliding ? -0.44 : -stride * 0.42;
    parts.leftArm.rotation = this.isSliding ? -0.82 : -stride * 0.48;
    parts.rightArm.rotation = this.isSliding ? 0.82 : stride * 0.48;
    parts.leftHand.x = -34 * avatarProfile.bodyScale + Math.sin(parts.leftArm.rotation) * 16;
    parts.rightHand.x = 34 * avatarProfile.bodyScale + Math.sin(parts.rightArm.rotation) * 16;
    parts.head.rotation = Math.sin(phase * 3) * 0.04;
    parts.sash.alpha = 0.76 + Math.sin(phase * 8) * 0.12;
    this.avatarRig.container.rotation = this.isSliding ? -0.18 : this.runner.body.velocity.y < -20 ? -0.08 : this.runner.body.velocity.y > 80 ? 0.1 : 0;
    this.avatarRig.container.scaleX = Phaser.Math.Linear(this.avatarRig.container.scaleX, 1, seconds * 9);
    this.avatarRig.container.scaleY = Phaser.Math.Linear(this.avatarRig.container.scaleY, slideScaleY, seconds * 10);
  }

  triggerAvatarEmote(reason) {
    if (!this.avatarRig) {
      return;
    }
    const scale = reason === 'dash'
      ? 1.18
      : reason === 'hurt'
        ? 0.86
        : avatarProfile.emoteId === 'emote_power_flex'
          ? 1.14
          : 1.08;
    this.tweens.add({
      targets: this.avatarRig.container,
      scaleX: scale,
      scaleY: reason === 'hurt' ? 0.9 : scale,
      yoyo: true,
      duration: reason === 'hurt' ? 95 : 125,
      ease: 'Sine.easeOut'
    });
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-root',
  backgroundColor: '#060a14',
  width: GAME_SIZE.width,
  height: GAME_SIZE.height,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1120 },
      debug: false
    }
  },
  scene: RushRunScene,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
});

document.getElementById('restart-button').addEventListener('click', () => {
  window.location.reload();
});
