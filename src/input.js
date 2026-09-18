/* ============================================================
   FIGHTER KONOHA — Input Manager
   Mendukung fallback key (array) untuk antisipasi NumLock off.
   ============================================================ */

import { CFG } from './config.js';

export class Input {
  constructor() {
    this.current = {};
    this.buffer = [];

    window.addEventListener('keydown', (e) => {
      if (!this.current[e.code]) {
        this.buffer.push({ code: e.code, age: 0 });
      }
      this.current[e.code] = true;

      // Cegah scroll pakai arrow/space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.current[e.code] = false;
    });
  }

  update() {
    for (let i = 0; i < this.buffer.length; i++) this.buffer[i].age++;
    this.buffer = this.buffer.filter((b) => b.age < CFG.INPUT_BUFFER);
  }

  // code: string ATAU array of string
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

  // code: string ATAU array of string
  isDown(code) {
    const codes = Array.isArray(code) ? code : [code];
    for (let k = 0; k < codes.length; k++) {
      if (this.current[codes[k]]) return true;
    }
    return false;
  }
}
