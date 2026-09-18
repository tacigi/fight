/* ============================================================
   FIGHTER KONOHA — Konfigurasi Global
   Sudah mendukung 2 tipe serangan: tangan & kaki.
   ============================================================ */

export const CFG = {
  W: 1280,
  H: 720,
  GROUND: 560,
  GRAVITY: 0.9,
  JUMP_V: -16,
  WALK: 3.2,
  BACK: 2.4,
  MAX_HP: 1000,
  MAX_GAUGE: 100,
  INPUT_BUFFER: 10,
  HITSTOP: 6,
  STUN_CLASH: 60,
  ROUND_TIME: 99
};

export const CONTROLS = {
  p1: {
    left:       ['KeyA'],
    right:      ['KeyD'],
    up:         ['KeyW'],
    down:       ['KeyS'],
    punchLight: ['KeyJ'],
    punchHeavy: ['KeyK'],
    kickLight:  ['KeyL'],
    kickHeavy:  ['Semicolon'],
    special:    ['KeyU'],
    ultimate:   ['KeyI'],
    taunt:      ['KeyO'],
    striker:    ['KeyP']
  },
  p2: {
    left:       ['ArrowLeft'],
    right:      ['ArrowRight'],
    up:         ['ArrowUp'],
    down:       ['ArrowDown'],
    punchLight: ['Numpad1', 'KeyZ'],
    punchHeavy: ['Numpad2', 'KeyX'],
    kickLight:  ['Numpad3', 'KeyC'],
    kickHeavy:  ['Numpad4', 'KeyV'],
    special:    ['Numpad5', 'KeyB'],
    ultimate:   ['Numpad6', 'KeyN'],
    taunt:      ['Numpad7', 'KeyM'],
    striker:    ['Numpad8', 'Space']
  }
};

export const CONTROLS_LABELS = [
  { key: 'left',       label: 'Mundur / Maju (kiri)' },
  { key: 'right',      label: 'Maju / Mundur (kanan)' },
  { key: 'up',         label: 'Lompat' },
  { key: 'down',       label: 'Menunduk' },
  { key: 'punchLight', label: '✊ Pukulan Tangan Ringan' },
  { key: 'punchHeavy', label: '✊ Pukulan Tangan Berat' },
  { key: 'kickLight',  label: '🦵 Tendangan Kaki Ringan' },
  { key: 'kickHeavy',  label: '🦵 Tendangan Kaki Berat' },
  { key: 'special',    label: 'Jurus Spesial' },
  { key: 'ultimate',   label: 'Ultimate (gauge penuh)' },
  { key: 'taunt',      label: 'Provokasi (isi gauge)' },
  { key: 'striker',    label: 'Panggil Striker' }
];

export const KEY_DISPLAY = {
  KeyA: 'A', KeyD: 'D', KeyW: 'W', KeyS: 'S',
  KeyJ: 'J', KeyK: 'K', KeyL: 'L',
  KeyU: 'U', KeyI: 'I', KeyO: 'O', KeyP: 'P',
  KeyZ: 'Z', KeyX: 'X', KeyC: 'C', KeyV: 'V',
  KeyB: 'B', KeyN: 'N', KeyM: 'M',
  Semicolon: ';',
  ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓',
  Numpad1: 'Num1', Numpad2: 'Num2', Numpad3: 'Num3', Numpad4: 'Num4',
  Numpad5: 'Num5', Numpad6: 'Num6', Numpad7: 'Num7', Numpad8: 'Num8',
  Space: 'Spasi'
};

export const SETTINGS_STORAGE_KEY = 'fk_settings_v1';

export const DEFAULT_SETTINGS = {
  master: 0.8,
  sfx: 0.9,
  music: 0.45,
  musicOn: true
};
