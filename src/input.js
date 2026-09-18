import { CFG } from './config.js';

export class Input {
  constructor() {
    this.current = {};   // tombol yang sedang ditahan
    this.buffer = [];    // antrian input terbaru
    window.addEventListener('keydown', e => {
      if (!this.current[e.code]) {
        this.buffer.push({ code: e.code, age: 0 });
      }
      this.current[e.code] = true;
    });
    window.addEventListener('keyup', e => {
      this.current[e.code] = false;
    });
  }

  update() {
    this.buffer.forEach(b => b.age++);
    this.buffer = this.buffer.filter(b => b.age < CFG.INPUT_BUFFER);
  }

  // Ambil input dari buffer (sekali pakai)
  consume(code) {
    const i = this.buffer.findIndex(b => b.code === code);
    if (i >= 0) { this.buffer.splice(i, 1); return true; }
    return false;
  }
}
