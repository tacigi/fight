/* ============================================================
   FIGHTER KONOHA — Class Fighter
   State machine, fisika, hitbox, hurtbox, damage.
   ============================================================ */

import { CFG } from './config.js';

export class Fighter {
  constructor(charData, startX, facing, controls) {
    this.data = charData;
    this.controls = controls;
    this.startX = startX;
    this.startFacing = facing;
    this.reset();
  }

  reset() {
    this.x = this.startX;
    this.y = CFG.GROUND;
    this.vx = 0;
    this.vy = 0;
    this.facing = this.startFacing;
    this.hp = CFG.MAX_HP;
    this.gauge = 0;
    this.state = 'idle';
    this.frame = 0;
    this.move = null;
    this.moveFrame = 0;
    this.hitstun = 0;
    this.blockstun = 0;
    this.stunTimer = 0;
    this.invincible = 0;
    this.hitDone = false;
    this.blocking = false;
    this.strikerUsed = false;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.maxCombo = 0;
    this.totalDamage = 0;
  }

  get hurtbox() {
    if (this.invincible > 0 || this.state === 'ko') return null;
    return { x: this.x - 30, y: this.y - 110, w: 60, h: 110 };
  }

  get activeHitbox() {
    if (this.state !== 'attack' || !this.move) return null;
    const m = this.move;
    if (!m.hitbox) return null;
    if (this.moveFrame < m.startup) return null;
    if (this.moveFrame >= m.startup + m.active) return null;
    if (this.hitDone) return null;
    const hb = m.hitbox;
    return {
      x: this.facing === 1 ? this.x + hb.x : this.x - hb.x - hb.w,
      y: this.y + hb.y,
      w: hb.w,
      h: hb.h,
      move: m,
      owner: this
    };
  }

  update(input, opponent) {
    this.frame++;
    if (this.hitstun > 0) this.hitstun--;
    if (this.blockstun > 0) this.blockstun--;
    if (this.stunTimer > 0) this.stunTimer--;
    if (this.invincible > 0) this.invincible--;
    if (this.comboTimer > 0) {
      this.comboTimer--;
      if (this.comboTimer === 0) this.comboCount = 0;
    }

    if (this.state === 'ko') { this.applyPhysics(); return; }

    if (this.state !== 'attack' && this.y >= CFG.GROUND) {
      this.facing = opponent.x >= this.x ? 1 : -1;
    }

    if (this.hitstun > 0 || this.stunTimer > 0) {
      this.state = 'hitstun';
      this.applyPhysics();
      return;
    }

    if (this.state === 'attack') {
      this.updateAttack();
      this.applyPhysics();
      return;
    }

    this.handleMovement(input);
    this.handleActions(input);
    this.applyPhysics();
  }

  handleMovement(input) {
    const k = this.controls;
    const grounded = this.y >= CFG.GROUND;
    const holdingBack =
      (this.facing === 1 && input.isDown(k.left)) ||
      (this.facing === -1 && input.isDown(k.right));

    this.blocking = holdingBack && grounded;
    if (!grounded) return;

    let moving = false;
    if (input.isDown(k.left)) {
      this.x -= (this.facing === -1 ? CFG.WALK : CFG.BACK);
      moving = true;
    }
    if (input.isDown(k.right)) {
      this.x += (this.facing === 1 ? CFG.WALK : CFG.BACK);
      moving = true;
    }

    if (input.isDown(k.up)) {
      this.vy = CFG.JUMP_V;
      this.vx = 0;
      if (input.isDown(k.left)) this.vx = -CFG.WALK;
      if (input.isDown(k.right)) this.vx = CFG.WALK;
      this.state = 'jump';
      return;
    }

    this.state = moving ? 'walk' : 'idle';
  }

  handleActions(input) {
    const k = this.controls;

    if (input.consume(k.light)) {
      this.startMove(this.data.moves.light);
    } else if (input.consume(k.heavy)) {
      this.startMove(this.data.moves.heavy);
    } else if (input.consume(k.special)) {
      this.startMove(this.data.moves.special);
    } else if (this.gauge >= CFG.MAX_GAUGE && input.consume(k.ultimate)) {
      this.gauge = 0;
      this.startMove(this.data.moves.ultimate);
      if (window.FK_announce) window.FK_announce('ULTIMATE!');
    } else if (input.consume(k.taunt)) {
      this.gauge = Math.min(CFG.MAX_GAUGE, this.gauge + 10);
    } else if (input.consume(k.striker) && !this.strikerUsed) {
      this.strikerUsed = true;
      if (window.FK_toast) window.FK_toast(this.data.name + ' memanggil striker!');
      this.gauge = Math.min(CFG.MAX_GAUGE, this.gauge + 15);
    }
  }

  startMove(move) {
    this.state = 'attack';
    this.move = move;
    this.moveFrame = 0;
    this.hitDone = false;
    if (move.invincibleFrames) this.invincible = move.invincibleFrames;
  }

  updateAttack() {
    this.moveFrame++;
    const total = this.move.startup + this.move.active + this.move.recovery;
    if (this.moveFrame >= total) {
      this.state = 'idle';
      this.move = null;
    }
  }

  applyPhysics() {
    const airborne = this.y < CFG.GROUND || this.vy < 0;
    if (airborne) {
      this.vy += CFG.GRAVITY;
      this.y += this.vy;
      this.x += this.vx;
      if (this.y >= CFG.GROUND) {
        this.y = CFG.GROUND;
        this.vy = 0;
        this.vx = 0;
        if (this.state === 'jump') this.state = 'idle';
      }
    }
    this.x = Math.max(60, Math.min(CFG.W - 60, this.x));
  }

  takeHit(move, attacker, blocked) {
    if (blocked) {
      this.blockstun = move.blockstun || 8;
      const chip = (move.damage || 0) * 0.15;
      this.hp -= chip;
      attacker.totalDamage += chip;
      this.x += attacker.facing * (move.pushback || 4) * 0.5;
    } else {
      this.hp -= move.damage || 0;
      attacker.totalDamage += move.damage || 0;
      this.hitstun = move.hitstun || 12;
      this.x += attacker.facing * (move.pushback || 4);
      this.gauge = Math.min(CFG.MAX_GAUGE, this.gauge + (move.damage || 0) * 0.3);
      attacker.gauge = Math.min(CFG.MAX_GAUGE, attacker.gauge + (move.gaugeGain || 0));
      attacker.comboCount++;
      if (attacker.comboCount > attacker.maxCombo) attacker.maxCombo = attacker.comboCount;
      attacker.comboTimer = 60;
    }
    if (this.hp <= 0) { this.hp = 0; this.state = 'ko'; }
  }
}
