/* ============================================================
   FIGHTER KONOHA — Data Karakter
   4 serangan dasar: punchLight, punchHeavy, kickLight, kickHeavy
   ============================================================ */

export const CHARACTERS = {
  praroro: {
    id: 'praroro',
    name: 'PRARORO',
    avatar: '🐱',
    color: '#e63946',
    archetype: 'Juggernaut',
    moves: {
      punchLight: {
        name: 'Jab', type: 'punchLight', limb: 'hand',
        startup: 4, active: 3, recovery: 8,
        damage: 25, hitstun: 12, blockstun: 6,
        pushback: 4, gaugeGain: 4,
        hitbox: { x: 40, y: -80, w: 50, h: 30 }
      },
      punchHeavy: {
        name: 'Pukulan Karat', type: 'punchHeavy', limb: 'hand', heavy: true,
        startup: 10, active: 4, recovery: 18,
        damage: 80, hitstun: 22, blockstun: 12,
        pushback: 10, gaugeGain: 8,
        hitbox: { x: 50, y: -75, w: 65, h: 45 }
      },
      kickLight: {
        name: 'Tendangan Kotak', type: 'kickLight', limb: 'leg',
        startup: 6, active: 3, recovery: 12,
        damage: 35, hitstun: 14, blockstun: 8,
        pushback: 6, gaugeGain: 5,
        hitbox: { x: 50, y: -65, w: 70, h: 40 }
      },
      kickHeavy: {
        name: 'Bobby Kick', type: 'kickHeavy', limb: 'leg', heavy: true,
        startup: 13, active: 5, recovery: 22,
        damage: 95, hitstun: 26, blockstun: 14,
        pushback: 14, gaugeGain: 9,
        hitbox: { x: 60, y: -70, w: 90, h: 50 }
      },
      special: {
        name: 'Joget Gemoy', type: 'special',
        startup: 6, active: 0, recovery: 30,
        damage: 0, invincibleFrames: 36,
        hitbox: null
      },
      ultimate: {
        name: 'Patriotik Smash', type: 'ultimate',
        startup: 20, active: 8, recovery: 40,
        damage: 250, hitstun: 40, blockstun: 20,
        pushback: 20, gaugeGain: 0,
        hitbox: { x: 60, y: -200, w: 140, h: 200 }
      }
    }
  },

  fufu: {
    id: 'fufu',
    name: 'FUFU',
    avatar: '🧪',
    color: '#38b000',
    archetype: 'Zoner',
    moves: {
      punchLight: {
        name: 'Splash Asam', type: 'punchLight', limb: 'hand',
        startup: 5, active: 3, recovery: 10,
        damage: 22, hitstun: 12, blockstun: 6,
        pushback: 4, gaugeGain: 4,
        hitbox: { x: 40, y: -80, w: 50, h: 30 }
      },
      punchHeavy: {
        name: 'Pukulan Sulfur', type: 'punchHeavy', limb: 'hand', heavy: true,
        startup: 12, active: 3, recovery: 20,
        damage: 70, hitstun: 20, blockstun: 10,
        pushback: 8, gaugeGain: 8,
        hitbox: { x: 50, y: -75, w: 60, h: 40 }
      },
      kickLight: {
        name: 'Tendangan Racun', type: 'kickLight', limb: 'leg',
        startup: 7, active: 3, recovery: 14,
        damage: 32, hitstun: 14, blockstun: 8,
        pushback: 6, gaugeGain: 5,
        hitbox: { x: 55, y: -65, w: 75, h: 40 }
      },
      kickHeavy: {
        name: 'Semburan Kaki', type: 'kickHeavy', limb: 'leg', heavy: true,
        startup: 14, active: 5, recovery: 24,
        damage: 85, hitstun: 24, blockstun: 14,
        pushback: 12, gaugeGain: 9,
        hitbox: { x: 65, y: -70, w: 95, h: 50 }
      },
      special: {
        name: 'Akun Anonim', type: 'special',
        startup: 8, active: 2, recovery: 24,
        damage: 50, hitstun: 16, blockstun: 8,
        pushback: 6, gaugeGain: 6,
        hitbox: { x: 60, y: -90, w: 60, h: 60 }
      },
      ultimate: {
        name: '19 Juta Lapangan', type: 'ultimate',
        startup: 16, active: 6, recovery: 40,
        damage: 220, hitstun: 40, blockstun: 20,
        pushback: 15, gaugeGain: 0,
        hitbox: { x: 50, y: -200, w: 160, h: 200 }
      }
    }
  },

  anies: {
    id: 'anies',
    name: 'ANIES-MAN',
    avatar: '📚',
    color: '#3a86ff',
    archetype: 'Puppeteer',
    moves: {
      punchLight: {
        name: 'Jab Retorika', type: 'punchLight', limb: 'hand',
        startup: 5, active: 3, recovery: 10,
        damage: 25, hitstun: 12, blockstun: 6,
        pushback: 4, gaugeGain: 4,
        hitbox: { x: 40, y: -80, w: 55, h: 30 }
      },
      punchHeavy: {
        name: 'Pukulan Buku', type: 'punchHeavy', limb: 'hand', heavy: true,
        startup: 11, active: 4, recovery: 18,
        damage: 72, hitstun: 20, blockstun: 10,
        pushback: 10, gaugeGain: 8,
        hitbox: { x: 55, y: -80, w: 70, h: 45 }
      },
      kickLight: {
        name: 'Tendangan Podium', type: 'kickLight', limb: 'leg',
        startup: 6, active: 3, recovery: 12,
        damage: 33, hitstun: 14, blockstun: 8,
        pushback: 6, gaugeGain: 5,
        hitbox: { x: 55, y: -65, w: 75, h: 40 }
      },
      kickHeavy: {
        name: 'Sabetan Gagasan', type: 'kickHeavy', limb: 'leg', heavy: true,
        startup: 13, active: 5, recovery: 22,
        damage: 82, hitstun: 25, blockstun: 14,
        pushback: 13, gaugeGain: 9,
        hitbox: { x: 60, y: -70, w: 90, h: 50 }
      },
      special: {
        name: 'Gagasan Barrier', type: 'special',
        startup: 6, active: 0, recovery: 30,
        damage: 0, invincibleFrames: 40,
        hitbox: null
      },
      ultimate: {
        name: 'Desak Konoha', type: 'ultimate',
        startup: 18, active: 8, recovery: 36,
        damage: 230, hitstun: 45, blockstun: 20,
        pushback: 18, gaugeGain: 0,
        hitbox: { x: 50, y: -200, w: 150, h: 200 }
      }
    }
  },

  ganjarist: {
    id: 'ganjarist',
    name: 'GANJARIST',
    avatar: '🐂',
    color: '#ff7b00',
    archetype: 'Rushdown',
    moves: {
      punchLight: {
        name: 'Jab Cepat', type: 'punchLight', limb: 'hand',
        startup: 3, active: 2, recovery: 7,
        damage: 20, hitstun: 10, blockstun: 5,
        pushback: 3, gaugeGain: 4,
        hitbox: { x: 35, y: -80, w: 50, h: 28 }
      },
      punchHeavy: {
        name: 'Red Bull Punch', type: 'punchHeavy', limb: 'hand', heavy: true,
        startup: 9, active: 4, recovery: 16,
        damage: 65, hitstun: 18, blockstun: 10,
        pushback: 12, gaugeGain: 8,
        hitbox: { x: 45, y: -80, w: 70, h: 45 }
      },
      kickLight: {
        name: 'Tendangan Cepat', type: 'kickLight', limb: 'leg',
        startup: 4, active: 3, recovery: 10,
        damage: 28, hitstun: 12, blockstun: 6,
        pushback: 5, gaugeGain: 5,
        hitbox: { x: 50, y: -65, w: 70, h: 38 }
      },
      kickHeavy: {
        name: 'Mudik Kick', type: 'kickHeavy', limb: 'leg', heavy: true,
        startup: 11, active: 5, recovery: 20,
        damage: 75, hitstun: 22, blockstun: 12,
        pushback: 14, gaugeGain: 9,
        hitbox: { x: 55, y: -70, w: 85, h: 50 }
      },
      special: {
        name: 'Mudik Dash', type: 'special',
        startup: 4, active: 8, recovery: 12,
        damage: 40, hitstun: 14, blockstun: 8,
        pushback: 6, gaugeGain: 6,
        invincibleFrames: 12,
        hitbox: { x: 40, y: -80, w: 70, h: 50 }
      },
      ultimate: {
        name: 'Lari Maraton', type: 'ultimate',
        startup: 14, active: 10, recovery: 34,
        damage: 240, hitstun: 45, blockstun: 20,
        pushback: 20, gaugeGain: 0,
        hitbox: { x: 40, y: -200, w: 180, h: 200 }
      }
    }
  }
};

export const ROSTER_ORDER = ['praroro', 'fufu', 'anies', 'ganjarist'];
