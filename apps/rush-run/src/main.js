import Phaser from 'phaser';
import { buildSignedResult, parseLaunchParams } from './contract.js';
import {
  avatarTelemetry,
  runnerVisualProfile,
  runtimeAvatarForPlayer
} from './avatarContract.js';
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

document.documentElement.style.setProperty('--player-primary', avatarColors.primary);
document.documentElement.style.setProperty('--player-secondary', avatarColors.secondary);
document.documentElement.style.setProperty('--player-accent', avatarColors.accent);


document.getElementById('player-label').textContent = `${primaryPlayer.displayName} - Level ${primaryPlayer.level}`;
document.getElementById('avatar-contract').textContent = `${primaryAvatar.manifestVersion} - ${primaryAvatar.avatarId}`;

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
    this.timeRemaining = 60;
    this.speed = 280;
    this.finished = false;
  }

  preload() {
    this.load.svg('runner', '/assets/runner.svg', { width: 72, height: 96 });
    this.load.svg('hurdle', '/assets/hurdle.svg', { width: 70, height: 70 });
    this.load.svg('boost', '/assets/boost.svg', { width: 50, height: 50 });
    this.load.svg('track', '/assets/track-tile.svg', { width: 256, height: 128 });
  }

  create() {
    this.add.tileSprite(480, 352, 960, 128, 'track').setScrollFactor(0).setName('track');
    this.aura = this.add.circle(
      170,
      292,
      52,
      colorNumber(avatarColors.secondary, 0xff2ed1),
      avatarProfile.auraStyle === 'aura_electric' ? 0.22 : 0.08
    );
    this.runner = this.physics.add.sprite(170, 286, 'runner');
    this.runner.setVisible(false);
    this.runner.setCollideWorldBounds(true);
    this.runner.body.setSize(44, 74).setOffset(14, 18);
    this.avatarRig = createAvatarRunner(this, primaryAvatar);
    this.avatarRig.container.setPosition(this.runner.x, this.runner.y);
    this.trail = this.add.rectangle(
      128,
      310,
      avatarProfile.trailStyle === 'trail_comet' ? 100 : 74,
      10,
      colorNumber(avatarProfile.trailStyle === 'trail_comet' ? avatarColors.accent : avatarColors.primary, 0x00e5ff),
      avatarProfile.trailStyle === 'trail_comet' ? 0.58 : 0.36
    );

    this.ground = this.add.rectangle(480, 374, 960, 10, 0x00e5ff, 0);
    this.physics.add.existing(this.ground, true);
    this.physics.add.collider(this.runner, this.ground);

    this.hurdles = this.physics.add.group();
    this.boostGroup = this.physics.add.group();
    this.physics.add.overlap(this.runner, this.hurdles, this.hitHurdle, undefined, this);
    this.physics.add.overlap(this.runner, this.boostGroup, this.collectBoost, undefined, this);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('A,D,W,SPACE');

    this.time.addEvent({ delay: 1250, loop: true, callback: this.spawnObstacle, callbackScope: this });
    this.time.addEvent({ delay: 2200, loop: true, callback: this.spawnBoost, callbackScope: this });
    this.time.addEvent({ delay: 1000, loop: true, callback: this.tickClock, callbackScope: this });
  }

  update(_time, delta) {
    if (this.finished) {
      return;
    }

    const seconds = delta / 1000;
    this.score += Math.round(seconds * this.speed * 0.8);
    this.speed += seconds * 6;
    document.getElementById('score').textContent = this.score.toLocaleString();

    const track = this.children.getByName('track');
    track.tilePositionX += seconds * this.speed;
    this.aura.setPosition(this.runner.x, this.runner.y + 4);
    this.trail.setPosition(this.runner.x - 42, this.runner.y + 26);
    this.avatarRig.container.setPosition(this.runner.x, this.runner.y);
    this.animateAvatar(seconds);

    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const jump = this.cursors.up.isDown || this.keys.W.isDown || this.keys.SPACE.isDown;

    this.runner.setVelocityX(left ? -220 : right ? 220 : 0);
    if (jump && this.runner.body.touching.down) {
      this.runner.setVelocityY(-520);
    }

    for (const group of [this.hurdles, this.boostGroup]) {
      group.children.iterate((child) => {
        if (child && child.x < -80) {
          child.destroy();
        }
      });
    }
  }

  spawnObstacle() {
    if (this.finished) {
      return;
    }
    const hurdle = this.hurdles.create(1000, 322, 'hurdle');
    hurdle.body.setAllowGravity(false);
    hurdle.setVelocityX(-this.speed);
    hurdle.body.setSize(52, 54).setOffset(9, 12);
  }

  spawnBoost() {
    if (this.finished) {
      return;
    }
    const boost = this.boostGroup.create(1000, Phaser.Math.Between(170, 265), 'boost');
    boost.body.setAllowGravity(false);
    boost.setVelocityX(-this.speed * 0.92);
  }

  hitHurdle(_runner, hurdle) {
    hurdle.destroy();
    this.collisions += 1;
    this.score = Math.max(0, this.score - 350);
    this.cameras.main.shake(150, 0.01);
    if (this.collisions >= 3) {
      this.finishRun();
    }
  }

  collectBoost(_runner, boost) {
    boost.destroy();
    this.boosts += 1;
    this.score += 600;
    this.speed += 24;
    const flash = colorNumber(avatarColors.secondary, 0xff2ed1);
    this.cameras.main.flash(80, (flash >> 16) & 255, (flash >> 8) & 255, flash & 255);
    this.triggerAvatarEmote('boost');
  }

  tickClock() {
    if (this.finished) {
      return;
    }
    this.timeRemaining -= 1;
    document.getElementById('timer').textContent = this.timeRemaining;
    if (this.timeRemaining <= 0) {
      this.finishRun();
    }
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
        durationSeconds: 60 - this.timeRemaining,
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

  animateAvatar(seconds) {
    const phase = this.time.now / 1000;
    const grounded = this.runner.body.touching.down;
    const stride = Math.sin(phase * (grounded ? 11 : 5));
    const lift = grounded ? Math.abs(stride) * 3 : -4;
    const parts = this.avatarRig.parts;

    this.avatarRig.container.y = this.runner.y + lift;
    parts.leftLeg.rotation = stride * 0.34;
    parts.rightLeg.rotation = -stride * 0.34;
    parts.leftArm.rotation = -stride * 0.42;
    parts.rightArm.rotation = stride * 0.42;
    parts.leftHand.x = -34 * avatarProfile.bodyScale + Math.sin(parts.leftArm.rotation) * 16;
    parts.rightHand.x = 34 * avatarProfile.bodyScale + Math.sin(parts.rightArm.rotation) * 16;
    parts.head.rotation = Math.sin(phase * 3) * 0.035;
    parts.sash.alpha = 0.76 + Math.sin(phase * 8) * 0.12;
    this.avatarRig.container.rotation = this.runner.body.velocity.y < -20 ? -0.08 : this.runner.body.velocity.y > 80 ? 0.1 : 0;
    this.avatarRig.container.scaleX = Phaser.Math.Linear(this.avatarRig.container.scaleX, 1, seconds * 8);
    this.avatarRig.container.scaleY = Phaser.Math.Linear(this.avatarRig.container.scaleY, 1, seconds * 8);
  }

  triggerAvatarEmote(reason) {
    if (reason !== 'boost' || !this.avatarRig) {
      return;
    }
    const scale = avatarProfile.emoteId === 'emote_power_flex' ? 1.18 : avatarProfile.emoteId === 'emote_air_guitar' ? 1.12 : 1.08;
    this.tweens.add({
      targets: this.avatarRig.container,
      scaleX: scale,
      scaleY: scale,
      yoyo: true,
      duration: 120,
      ease: 'Sine.easeOut'
    });
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-root',
  backgroundColor: '#060a14',
  width: 960,
  height: 540,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 980 },
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
