/* ============================================================
   FIGHTER KONOHA — CPU AI Controller
   Meniru interface Input agar bisa dipakai Fighter.update().
   ============================================================ */

import { CFG } from './config.js';

export class CpuController {
  constructor(controls) {
    this.controls = controls;
    this.current = {};
    this.buffer = [];
    this.decisionTimer = 0;
    this.heldAction = null;
    this.opponentIsToRight = false;
  }

  // Dipanggil setiap frame sebelum fighter.update()
  think(self, opponent) {
    // Update arah relatif ke lawan
    this.opponentIsToRight = opponent.x > self.x;

    // Age input buffer
    for (let i = 0; i < this.buffer.length; i++) this.buffer[i].age++;
    this.buffer = this.buffer.filter((b) => b.age < CFG.INPUT_BUFFER);

    // Reset tombol yang "ditahan"
    this.current = {};

    // Kalau KO atau kena stun, jangan berpikir
    if (self.state === 'ko' || self.hitstun > 0 || self.stunTimer > 0) return;

    // Masih dalam durasi aksi sebelumnya
    this.decisionTimer--;
    if (this.decisionTimer > 0) {
      if (this.heldAction) this.applyHold(this.heldAction);
      return;
    }

    // Buat keputusan baru
    const action = this.decide(self, opponent);
    this.heldAction = action.hold;
    this.decisionTimer = action.duration;

    if (action.hold) this.applyHold(action.hold);
    if (action.press) this.buffer.push({ code: action.press, age: 0 });
  }

  applyHold(direction) {
    const right = this.opponentIsToRight;
    if (direction === 'forward') {
      this.current[right ? this.controls.right[0] : this.controls.left[0]] = true;
    } else if (direction === 'back') {
      this.current[right ? this.controls.left[0] : this.controls.right[0]] = true;
    } else if (direction === 'jump') {
      this.current[this.controls.up[0]] = true;
    }
  }

  decide(self, opponent) {
    const dx = opponent.x - self.x;
    const dist = Math.abs(dx);
    const oppAttacking = opponent.state === 'attack' && opponent.move;
    const gaugeFull = self.gauge >= CFG.MAX_GAUGE;
    const hpLow = self.hp / CFG.MAX_HP < 0.3;

    // Prioritas: blok kalau lawan menyerang jarak dekat
    if (oppAttacking && dist < 160 && Math.random() < 0.55) {
      return { hold: 'back', press: null, duration: 22 };
    }

    // Jauh: mendekat atau pakai jurus jarak jauh
    if (dist > 220) {
      if (gaugeFull && Math.random() < 0.2) {
        return { hold: 'forward', press: this.controls.ultimate[0], duration: 30 };
      }
      if (Math.random() < 0.25) {
        return { hold: null, press: this.controls.special[0], duration: 24 };
      }
      return { hold: 'forward', press: null, duration: 18 + Math.random() * 20 };
    }

    // Sedang: campuran
    if (dist > 100) {
      const r = Math.random();
      if (r < 0.45) return { hold: 'forward', press: null, duration: 14 + Math.random() * 14 };
      if (r < 0.65) return { hold: null, press: this.controls.heavy[0], duration: 28 };
      if (r < 0.85) return { hold: null, press: this.controls.special[0], duration: 24 };
      return { hold: 'back', press: null, duration: 14 };
    }

    // Dekat: serang habis-habisan
    const r = Math.random();
    if (gaugeFull && r < 0.25) {
      return { hold: null, press: this.controls.ultimate[0], duration: 45 };
    }
    if (hpLow && r < 0.35) {
      return { hold: 'back', press: null, duration: 22 };
    }
    if (r < 0.5) return { hold: null, press: this.controls.light[0], duration: 11 };
    if (r < 0.75) return { hold: null, press: this.controls.heavy[0], duration: 24 };
    if (r < 0.9) return { hold: null, press: this.controls.special[0], duration: 24 };
    return { hold: 'back', press: null, duration: 14 };
  }

  isDown(code) {
    const codes = Array.isArray(code) ? code : [code];
    return codes.some((c) => this.current[c]);
  }

  consume(code) {
    const codes = Array.isArray(code) ? code : [code];
    for (let k = 0; k < codes.length; k++) {
      for (let i = 0; i < this.buffer.length; i++) {
        if (this.buffer[i].code === codes[k]) {
          this.buffer.splice(i, 1);
          return true;
        }
      }
    }
    return false;
  }

  // Untuk Clash QTE — CPU mash otomatis
  autoClash() {
    return Math.random() < 0.09;
  }
}
