import Phaser from 'phaser';
import { buildSignedResult, parseLaunchParams } from './contract.js';
import './styles.css';

const { launchPayload, callbackUrl, callbackSecret } = parseLaunchParams();
const primaryPlayer = launchPayload.players[0];

document.getElementById('player-label').textContent = `${primaryPlayer.displayName} · Level ${primaryPlayer.level}`;

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
    this.runner = this.physics.add.sprite(170, 286, 'runner');
    this.runner.setCollideWorldBounds(true);
    this.runner.body.setSize(44, 74).setOffset(14, 18);

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
    this.cameras.main.flash(80, 43, 255, 138);
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
