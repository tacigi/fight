/* ============================================================
   FIGHTER KONOHA — Konfigurasi Global
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
    left:     ['KeyA'],
    right:    ['KeyD'],
    up:       ['KeyW'],
    down:     ['KeyS'],
    light:    ['KeyJ'],
    heavy:    ['KeyK'],
    special:  ['KeyL'],
    ultimate: ['KeyU'],
    taunt:    ['KeyT'],
    striker:  ['KeyI']
  },
  p2: {
    left:     ['ArrowLeft'],
    right:    ['ArrowRight'],
    up:       ['ArrowUp'],
    down:     ['ArrowDown'],
    light:    ['Numpad1', 'Comma'],
    heavy:    ['Numpad2', 'Period'],
    special:  ['Numpad3', 'Slash'],
    ultimate: ['Numpad4', 'Quote'],
    taunt:    ['Numpad5', 'BracketLeft'],
    striker:  ['Numpad6', 'BracketRight']
  }
};

export const CONTROLS_LABELS = [
  { key: 'left',     label: 'Mundur / Maju (kiri)' },
  { key: 'right',    label: 'Maju / Mundur (kanan)' },
  { key: 'up',       label: 'Lompat' },
  { key: 'down',     label: 'Tahan (jongkok)' },
  { key: 'light',    label: 'Pukulan Ringan' },
  { key: 'heavy',    label: 'Pukulan Berat' },
  { key: 'special',  label: 'Jurus Spesial' },
  { key: 'ultimate', label: 'Ultimate (gauge penuh)' },
  { key: 'taunt',    label: 'Provokasi (isi gauge)' },
  { key: 'striker',  label: 'Panggil Striker' }
];

export const KEY_DISPLAY = {
  KeyA: 'A', KeyD: 'D', KeyW: 'W', KeyS: 'S',
  KeyJ: 'J', KeyK: 'K', KeyL: 'L', KeyU: 'U',
  KeyT: 'T', KeyI: 'I',
  ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓',
  Numpad1: 'Num1', Numpad2: 'Num2', Numpad3: 'Num3',
  Numpad4: 'Num4', Numpad5: 'Num5', Numpad6: 'Num6',
  Comma: ',', Period: '.', Slash: '/', Quote: "'",
  BracketLeft: '[', BracketRight: ']'
};

export const SETTINGS_STORAGE_KEY = 'fk_settings_v1';

export const DEFAULT_SETTINGS = {
  master: 0.8,
  sfx: 0.9,
  music: 0.45,
  musicOn: true
};
