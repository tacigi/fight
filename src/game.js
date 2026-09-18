/* ============================================================
   FIGHTER KONOHA — Main Game Script v1.0
   Single-file build • Tanpa import • Null-safe • Fallback key
   ============================================================ */

(function () {
  'use strict';

  // ---------- GLOBAL ERROR HANDLER ----------
  window.addEventListener('error', function (e) {
    console.error('[Fighter Konoha] Error:', e.message, e.filename, e.lineno);
    const box = document.getElementById('fatal-error');
    if (box) {
      box.textContent = 'Error: ' + e.message + ' (' + e.filename + ':' + e.lineno + ')';
      box.classList.add('show');
    }
  });

  console.log('[Fighter Konoha] script loaded');

  /* ---------- CONFIG ---------- */
  const CFG = {
    W: 1280, H: 720,
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
    ROUND_TIME: 99,
  };

  /* ---------- INPUT ---------- */
  function Input() {
    this.current = {};
    this.buffer = [];
    const self = this;
    window.addEventListener('keydown', function (e) {
      if (!self.current[e.code]) {
        self.buffer.push({ code: e.code, age: 0 });
      }
      self.current[e.code] = true;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].indexOf(e.code) >= 0) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', function (e) {
      self.current[e.code] = false;
    });
  }
  Input.prototype.update = function () {
    for (let i = 0; i < this.buffer.length; i++) this.buffer[i].age++;
    this.buffer = this.buffer.filter(function (b) { return b.age < CFG.INPUT_BUFFER; });
  };
  Input.prototype.consume = function (code) {
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
  };
  Input.prototype.isDown = function (code) {
    const codes = Array.isArray(code) ? code : [code];
    for (let k = 0; k < codes.length; k++) {
      if (this.current[codes[k]]) return true;
    }
    return false;
  };

  /* ---------- CHARACTERS ---------- */
  const CHARACTERS = {
    praroro: {
      id: 'praroro', name: 'PRARORO', avatar: '🐱', color: '#e63946', archetype: 'Juggernaut',
      moves: {
        light:    { name: 'Jab',             type: 'light',    startup: 4,  active: 3, recovery: 8,  damage: 30,  hitstun: 12, blockstun: 6,  pushback: 4,  gaugeGain: 4, hitbox: { x: 40, y: -80, w: 55, h: 30 } },
        heavy:    { name: 'Bobby Scratch',   type: 'heavy',    startup: 10, active: 4, recovery: 18, damage: 80,  hitstun: 22, blockstun: 12, pushback: 10, gaugeGain: 8, hitbox: { x: 50, y: -70, w: 70, h: 50 } },
        special:  { name: 'Joget Gemoy',     type: 'special',  startup: 6,  active: 0, recovery: 30, damage: 0,   invincibleFrames: 36, hitbox: null },
        ultimate: { name: 'Patriotik Smash', type: 'ultimate', startup: 20, active: 8, recovery: 40, damage: 250, hitstun: 40, blockstun: 20, pushback: 20, gaugeGain: 0, hitbox: { x: 60, y: -200, w: 140, h: 200 } },
      },
    },
    fufu: {
      id: 'fufu', name: 'FUFU', avatar: '🧪', color: '#38b000', archetype: 'Zoner',
      moves: {
        light:    { name: 'Splash',            type: 'light',    startup: 5,  active: 3, recovery: 10, damage: 25,  hitstun: 12, blockstun: 6,  pushback: 4,  gaugeGain: 4, hitbox: { x: 40, y: -80, w: 50, h: 30 } },
        heavy:    { name: 'Sulfur Splash',     type: 'heavy',    startup: 12, active: 2, recovery: 22, damage: 70,  hitstun: 20, blockstun: 10, pushback: 8,  gaugeGain: 8, hitbox: { x: 45, y: -80, w: 65, h: 40 } },
        special:  { name: 'Akun Anonim',       type: 'special',  startup: 8,  active: 2, recovery: 24, damage: 50,  hitstun: 16, blockstun: 8,  pushback: 6,  gaugeGain: 6, hitbox: { x: 60, y: -90, w: 60, h: 60 } },
        ultimate: { name: '19 Juta Lapangan',  type: 'ultimate', startup: 16, active: 6, recovery: 40, damage: 220, hitstun: 40, blockstun: 20, pushback: 15, gaugeGain: 0, hitbox: { x: 50, y: -200, w: 160, h: 200 } },
      },
    },
    anies: {
      id: 'anies', name: 'ANIES-MAN', avatar: '📚', color: '#3a86ff', archetype: 'Puppeteer',
      moves: {
        light:    { name: 'Rhetoric Jab',    type: 'light',    startup: 5,  active: 3, recovery: 10, damage: 28,  hitstun: 12, blockstun: 6,  pushback: 4,  gaugeGain: 4, hitbox: { x: 40, y: -80, w: 55, h: 30 } },
        heavy:    { name: 'Rhetoric Wave',   type: 'heavy',    startup: 12, active: 5, recovery: 18, damage: 75,  hitstun: 20, blockstun: 10, pushback: 12, gaugeGain: 8, hitbox: { x: 60, y: -100, w: 90, h: 60 } },
        special:  { name: 'Gagasan Barrier', type: 'special',  startup: 6,  active: 0, recovery: 30, damage: 0,   invincibleFrames: 40, hitbox: null },
        ultimate: { name: 'Desak Konoha',    type: 'ultimate', startup: 18, active: 8, recovery: 36, damage: 230, hitstun: 45, blockstun: 20, pushback: 18, gaugeGain: 0, hitbox: { x: 50, y: -200, w: 150, h: 200 } },
      },
    },
    ganjarist: {
      id: 'ganjarist', name: 'GANJARIST', avatar: '🐂', color: '#ff7b00', archetype: 'Rushdown',
      moves: {
        light:    { name: 'Quick Jab',       type: 'light',    startup: 3,  active: 2, recovery: 7,  damage: 22,  hitstun: 10, blockstun: 5,  pushback: 3,  gaugeGain: 4, hitbox: { x: 35, y: -80, w: 50, h: 28 } },
        heavy:    { name: 'Red Bull Charge', type: 'heavy',    startup: 9,  active: 4, recovery: 16, damage: 70,  hitstun: 18, blockstun: 10, pushback: 14, gaugeGain: 8, hitbox: { x: 45, y: -80, w: 80, h: 50 } },
        special:  { name: 'Mudik Dash',      type: 'special',  startup: 4,  active: 8, recovery: 12, damage: 40,  hitstun: 14, blockstun: 8,  pushback: 6,  gaugeGain: 6, invincibleFrames: 12, hitbox: { x: 40, y: -80, w: 70, h: 50 } },
        ultimate: { name: 'Lari Maraton',    type: 'ultimate', startup: 14, active: 10, recovery: 34, damage: 240, hitstun: 45, blockstun: 20, pushback: 20, gaugeGain: 0, hitbox: { x: 40, y: -200, w: 180, h: 200 } },
      },
    },
  };

  const ROSTER_ORDER = ['praroro', 'fufu', 'anies', 'ganjarist'];

  /* ---------- FIGHTER ---------- */
  function Fighter(charData, startX, facing, controls) {
    this.data = charData;
    this.controls = controls;
    this.startX = startX;
    this.startFacing = facing;
    this.reset();
  }
  Fighter.prototype.reset = function () {
    this.x = this.startX;
    this.y = CFG.GROUND;
    this.vx = 0; this.vy = 0;
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
  };
  Object.defineProperty(Fighter.prototype, 'hurtbox', {
    get: function () {
      if (this.invincible > 0 || this.state === 'ko') return null;
      return { x: this.x - 30, y: this.y - 110, w: 60, h: 110 };
    },
  });
  Object.defineProperty(Fighter.prototype, 'activeHitbox', {
    get: function () {
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
        w: hb.w, h: hb.h,
        move: m, owner: this,
      };
    },
  });
  Fighter.prototype.update = function (input, opponent) {
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
  };
  Fighter.prototype.handleMovement = function (input) {
    const k = this.controls;
    const grounded = this.y >= CFG.GROUND;
    const backPressed = (this.facing === 1 && input.isDown(k.left)) ||
                        (this.facing === -1 && input.isDown(k.right));
    this.blocking = backPressed && grounded;
    if (!grounded) return;
    let moving = false;
    if (input.isDown(k.left))  { this.x -= (this.facing === -1 ? CFG.WALK : CFG.BACK); moving = true; }
    if (input.isDown(k.right)) { this.x += (this.facing ===  1 ? CFG.WALK : CFG.BACK); moving = true; }
    if (input.isDown(k.up)) {
      this.vy = CFG.JUMP_V;
      this.vx = 0;
      if (input.isDown(k.left))  this.vx = -CFG.WALK;
      if (input.isDown(k.right)) this.vx =  CFG.WALK;
      this.state = 'jump';
      return;
    }
    this.state = moving ? 'walk' : 'idle';
  };
  Fighter.prototype.handleActions = function (input) {
    const k = this.controls;
    if (input.consume(k.light))         this.startMove(this.data.moves.light);
    else if (input.consume(k.heavy))    this.startMove(this.data.moves.heavy);
    else if (input.consume(k.special))  this.startMove(this.data.moves.special);
    else if (this.gauge >= CFG.MAX_GAUGE && input.consume(k.ultimate)) {
      this.gauge = 0;
      this.startMove(this.data.moves.ultimate);
      announce('ULTIMATE!');
    }
    else if (input.consume(k.taunt)) {
      this.gauge = Math.min(CFG.MAX_GAUGE, this.gauge + 10);
    }
    else if (input.consume(k.striker) && !this.strikerUsed) {
      this.strikerUsed = true;
      toast(this.data.name + ' memanggil striker!');
      this.gauge = Math.min(CFG.MAX_GAUGE, this.gauge + 15);
    }
  };
  Fighter.prototype.startMove = function (move) {
    this.state = 'attack';
    this.move = move;
    this.moveFrame = 0;
    this.hitDone = false;
    if (move.invincibleFrames) this.invincible = move.invincibleFrames;
  };
  Fighter.prototype.updateAttack = function () {
    this.moveFrame++;
    const total = this.move.startup + this.move.active + this.move.recovery;
    if (this.moveFrame >= total) {
      this.state = 'idle';
      this.move = null;
    }
  };
  Fighter.prototype.applyPhysics = function () {
    const airborne = this.y < CFG.GROUND || this.vy < 0;
    if (airborne) {
      this.vy += CFG.GRAVITY;
      this.y += this.vy;
      this.x += this.vx;
      if (this.y >= CFG.GROUND) {
        this.y = CFG.GROUND;
        this.vy = 0; this.vx = 0;
        if (this.state === 'jump') this.state = 'idle';
      }
    }
    this.x = Math.max(60, Math.min(CFG.W - 60, this.x));
  };
  Fighter.prototype.takeHit = function (move, attacker, blocked) {
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
  };

  /* ---------- UI HELPERS ---------- */
  const $ = function (id) { return document.getElementById(id); };

  const UI = {
    loadingFill:  $('loading-fill'),
    loadingText:  $('loading-text'),
    p1Hp:         $('p1-hp-bar'),
    p2Hp:         $('p2-hp-bar'),
    p1Gauge:      $('p1-gauge-bar'),
    p2Gauge:      $('p2-gauge-bar'),
    p1Name:       $('p1-hud-name'),
    p2Name:       $('p2-hud-name'),
    timer:        $('timer'),
    roundInd:     $('round-indicator'),
    announcement: $('announcement'),
    p1Combo:      $('p1-combo'),
    p2Combo:      $('p2-combo'),
    p1Striker:    $('p1-striker'),
    p2Striker:    $('p2-striker'),
    toast:        $('toast'),
    roster:       $('roster'),
    p1Portrait:   $('p1-portrait'),
    p2Portrait:   $('p2-portrait'),
    p1NameLabel:  $('p1-name'),
    p2NameLabel:  $('p2-name'),
    p1Arch:       $('p1-arch'),
    p2Arch:       $('p2-arch'),
    btnStart:     $('btn-start-fight'),
    btnBack:      $('btn-back-menu'),
    selectMode:   $('select-mode-label'),
    coinAmount:   $('coin-amount'),
    resultTitle:  $('result-title'),
    resultWinner: $('result-winner'),
    statCombo:    $('stat-combo'),
    statDamage:   $('stat-damage'),
    statCoin:     $('stat-coin'),
    p2PanelLabel: $('p2-panel-label'),
    controlsHint: $('controls-hint'),
  };

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
    const el = $(id);
    if (el) el.classList.add('active');
  }
  function showOverlay(id) {
    document.querySelectorAll('.overlay').forEach(function (o) { o.classList.remove('active'); });
    if (id) {
      const el = $(id);
      if (el) el.classList.add('active');
    }
  }
  function toast(text) {
    if (!UI.toast) return;
    UI.toast.textContent = text;
    UI.toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { UI.toast.classList.remove('show'); }, 2200);
  }
  function announce(text) {
    if (!UI.announcement) return;
    UI.announcement.textContent = text;
    UI.announcement.classList.remove('show');
    void UI.announcement.offsetWidth;
    UI.announcement.classList.add('show');
  }

  /* ---------- GAME STATE ---------- */
  let input = null;
  let p1 = null, p2 = null;
  let canvas = null, ctx = null;
  let gameState = 'loading';
  let selectedP1 = null, selectedP2 = null, selectedMode = null;
  let hitstop = 0, screenShake = 0, clash = null;
  let lastTime = 0;
  let roundTimer = CFG.ROUND_TIME;
  let timerAccum = 0;
  let roundActive = false;
  let coins = 0;

  /* ---------- LOADING ---------- */
  function runLoading() {
    const steps = [
      { pct: 20,  text: 'Memuat konfigurasi...' },
      { pct: 40,  text: 'Memuat karakter...' },
      { pct: 60,  text: 'Menyiapkan arena...' },
      { pct: 80,  text: 'Menyiapkan audio...' },
      { pct: 100, text: 'Siap!' },
    ];
    let i = 0;
    function tick() {
      if (i >= steps.length) {
        setTimeout(function () {
          showScreen('main-menu');
          gameState = 'menu';
          console.log('[Fighter Konoha] menu ready');
        }, 400);
        return;
      }
      const s = steps[i++];
      if (UI.loadingFill) UI.loadingFill.style.width = s.pct + '%';
      if (UI.loadingText) UI.loadingText.textContent = s.text;
      setTimeout(tick, 350);
    }
    setTimeout(tick, 300);
  }

  /* ---------- MENU ---------- */
  function initMenu() {
    document.querySelectorAll('.menu-btn[data-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const mode = btn.dataset.mode;
        if (mode === 'toko' || mode === 'catatan') {
          toast('Fitur ' + (mode === 'toko' ? 'Toko Kemeja' : 'Buku Catatan') + ' segera hadir!');
          return;
        }
        openCharacterSelect(mode);
      });
    });
    document.querySelectorAll('.overlay .menu-btn[data-action]').forEach(function (btn) {
      btn.addEventListener('click', function () { handleOverlayAction(btn.dataset.action); });
    });
    const pauseBtn = $('pause-btn');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', function () {
        if (gameState === 'fighting') {
          gameState = 'paused';
          showOverlay('pause-menu');
        }
      });
    }
    // ESC untuk pause
    window.addEventListener('keydown', function (e) {
      if (e.code === 'Escape' && gameState === 'fighting') {
        gameState = 'paused';
        showOverlay('pause-menu');
      } else if (e.code === 'Escape' && gameState === 'paused') {
        showOverlay(null);
        gameState = 'fighting';
      }
    });
  }

  function handleOverlayAction(action) {
    switch (action) {
      case 'resume':
        showOverlay(null);
        gameState = 'fighting';
        break;
      case 'restart':
        showOverlay(null);
        startMatch();
        break;
      case 'charselect':
        showOverlay(null);
        openCharacterSelect(selectedMode || 'koalisi');
        break;
      case 'quit':
        showOverlay(null);
        showScreen('main-menu');
        gameState = 'menu';
        break;
      case 'rematch':
        showOverlay(null);
        startMatch();
        break;
      case 'back-menu':
        showOverlay(null);
        showScreen('main-menu');
        gameState = 'menu';
        break;
    }
  }

  /* ---------- CHARACTER SELECT ---------- */
  function openCharacterSelect(mode) {
    selectedMode = mode;
    selectedP1 = null;
    selectedP2 = null;

    const modeNames = {
      pilpres: 'Pilpres Mode',
      koalisi: 'Koalisi Mode (1v1)',
      latihan: 'Latihan Kader',
    };
    if (UI.selectMode) UI.selectMode.textContent = modeNames[mode] || mode;
    if (UI.p2PanelLabel) {
      UI.p2PanelLabel.textContent = (mode === 'koalisi') ? 'PLAYER 2' : 'CPU';
    }
    renderRoster();
    updateSelectUI();
    showScreen('char-select');
    gameState = 'select';
  }

  function renderRoster() {
    if (!UI.roster) return;
    UI.roster.innerHTML = '';
    ROSTER_ORDER.forEach(function (id) {
      const c = CHARACTERS[id];
      const card = document.createElement('div');
      card.className = 'roster-card';
      card.dataset.charId = id;
      card.innerHTML =
        '<span class="rc-badge" style="display:none;">P1</span>' +
        '<span class="rc-avatar">' + c.avatar + '</span>' +
        '<span class="rc-name">' + c.name + '</span>';
      card.addEventListener('click', function () { pickCharacter(id); });
      UI.roster.appendChild(card);
    });
  }

  function pickCharacter(id) {
    if (!selectedP1) {
      selectedP1 = id;
    } else if (!selectedP2) {
      selectedP2 = id;
    } else {
      selectedP1 = id;
      selectedP2 = null;
    }
    updateSelectUI();
  }

  function updateSelectUI() {
    document.querySelectorAll('.roster-card').forEach(function (card) {
      card.classList.remove('selected-p1', 'selected-p2');
      const badge = card.querySelector('.rc-badge');
      if (badge) badge.style.display = 'none';
      if (card.dataset.charId === selectedP1) {
        card.classList.add('selected-p1');
        if (badge) { badge.textContent = 'P1'; badge.style.display = ''; }
      }
      if (card.dataset.charId === selectedP2) {
        card.classList.add('selected-p2');
        if (badge) { badge.textContent = 'P2'; badge.style.display = ''; }
      }
    });

    if (selectedP1) {
      const c = CHARACTERS[selectedP1];
      UI.p1Portrait.textContent = c.avatar;
      UI.p1Portrait.classList.add('filled');
      UI.p1NameLabel.textContent = c.name;
      UI.p1Arch.textContent = c.archetype;
    } else {
      UI.p1Portrait.textContent = '?';
      UI.p1Portrait.classList.remove('filled');
      UI.p1NameLabel.textContent = '—';
      UI.p1Arch.textContent = 'Pilih karakter';
    }

    if (selectedP2) {
      const c = CHARACTERS[selectedP2];
      UI.p2Portrait.textContent = c.avatar;
      UI.p2Portrait.classList.add('filled');
      UI.p2NameLabel.textContent = c.name;
      UI.p2Arch.textContent = c.archetype;
    } else {
      UI.p2Portrait.textContent = '?';
      UI.p2Portrait.classList.remove('filled');
      UI.p2NameLabel.textContent = '—';
      UI.p2Arch.textContent = 'Pilih karakter';
    }

    if (UI.btnStart) UI.btnStart.disabled = !(selectedP1 && selectedP2);
  }

  /* ---------- MATCH ---------- */
  function startMatch() {
    showScreen('game-stage');
    canvas = $('game');
    if (!canvas) { console.error('Canvas #game tidak ditemukan'); return; }
    ctx = canvas.getContext('2d');

    const c1 = CHARACTERS[selectedP1] || CHARACTERS.praroro;
    const c2 = CHARACTERS[selectedP2] || CHARACTERS.fufu;

    // Kontrol dengan FALLBACK key
    p1 = new Fighter(c1, 400, 1, {
      left:     ['KeyA'],
      right:    ['KeyD'],
      up:       ['KeyW'],
      down:     ['KeyS'],
      light:    ['KeyJ'],
      heavy:    ['KeyK'],
      special:  ['KeyL'],
      ultimate: ['KeyU'],
      taunt:    ['KeyT'],
      striker:  ['KeyI'],
    });

    // Fallback key penting: Numpad (butuh NumLock) + tombol alternatif di kanan keyboard
    p2 = new Fighter(c2, 880, -1, {
      left:     ['ArrowLeft'],
      right:    ['ArrowRight'],
      up:       ['ArrowUp'],
      down:     ['ArrowDown'],
      light:    ['Numpad1', 'Comma'],
      heavy:    ['Numpad2', 'Period'],
      special:  ['Numpad3', 'Slash'],
      ultimate: ['Numpad4', 'Quote'],
      taunt:    ['Numpad5', 'BracketLeft'],
      striker:  ['Numpad6', 'BracketRight'],
    });

    if (UI.p1Name) UI.p1Name.textContent = c1.name;
    if (UI.p2Name) UI.p2Name.textContent = c2.name;
    if (UI.roundInd) UI.roundInd.textContent = 'ROUND 1';

    hitstop = 0;
    screenShake = 0;
    clash = null;
    roundTimer = CFG.ROUND_TIME;
    timerAccum = 0;
    roundActive = false;
    lastTime = 0;

    // Tampilkan hint kontrol
    if (UI.controlsHint) {
      UI.controlsHint.classList.add('show');
      setTimeout(function () { UI.controlsHint.classList.remove('show'); }, 5000);
    }

    gameState = 'fighting';
    announce('ROUND 1');
    setTimeout(function () { announce('FIGHT!'); roundActive = true; }, 1300);
    requestAnimationFrame(loop);
    console.log('[Fighter Konoha] match started:', c1.name, 'vs', c2.name);
  }

  /* ---------- COLLISION ---------- */
  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function startClash() {
    clash = { timer: 120, p1: 0, p2: 0, target: 10, winner: null, resolved: false };
    p1.move = null; p1.state = 'idle'; p1.hitDone = false;
    p2.move = null; p2.state = 'idle'; p2.hitDone = false;
  }

  function updateClash() {
    if (clash.resolved) return;
    clash.timer--;
    if (input.consume('KeyJ'))  clash.p1++;
    if (input.consume(['Numpad1', 'Comma'])) clash.p2++;
    if (clash.p1 >= clash.target)      resolveClash(1);
    else if (clash.p2 >= clash.target) resolveClash(2);
    else if (clash.timer <= 0) {
      resolveClash(clash.p1 > clash.p2 ? 1 : clash.p2 > clash.p1 ? 2 : 0);
    }
  }

  function resolveClash(winner) {
    clash.resolved = true;
    clash.winner = winner;
    if (winner === 1) {
      p2.stunTimer = CFG.STUN_CLASH;
      p1.gauge = Math.min(CFG.MAX_GAUGE, p1.gauge + 20);
      announce('P1 MENANG DEBAT!');
    } else if (winner === 2) {
      p1.stunTimer = CFG.STUN_CLASH;
      p2.gauge = Math.min(CFG.MAX_GAUGE, p2.gauge + 20);
      announce('P2 MENANG DEBAT!');
    } else {
      announce('SERI!');
    }
    setTimeout(function () { clash = null; }, 700);
  }

  function checkCollisions() {
    const h1 = p1.activeHitbox, h2 = p2.activeHitbox;
    const hb1 = p1.hurtbox,     hb2 = p2.hurtbox;
    const h1HitsH2 = h1 && hb2 && overlap(h1, hb2);
    const h2HitsH1 = h2 && hb1 && overlap(h2, hb1);

    if (h1HitsH2 && h2HitsH1 &&
        h1.move.type === 'heavy' && h2.move.type === 'heavy') {
      startClash();
      return;
    }
    if (h1HitsH2) {
      p1.hitDone = true;
      p2.takeHit(h1.move, p1, p2.blocking);
      hitstop = CFG.HITSTOP; screenShake = 6;
    }
    if (h2HitsH1) {
      p2.hitDone = true;
      p1.takeHit(h2.move, p2, p1.blocking);
      hitstop = CFG.HITSTOP; screenShake = 6;
    }
  }

  /* ---------- UPDATE ---------- */
  function update() {
    input.update();
    if (gameState !== 'fighting') return;
    if (clash && !clash.resolved) { updateClash(); return; }
    if (hitstop > 0) { hitstop--; return; }

    p1.update(input, p2);
    p2.update(input, p1);
    checkCollisions();

    if (roundActive) {
      timerAccum++;
      if (timerAccum >= 60) { timerAccum = 0; roundTimer--; }
      if (roundTimer <= 0) { roundTimer = 0; endRound(); }
    }
    if (p1.state === 'ko' || p2.state === 'ko') endRound();

    updateHUD();
  }

  function updateHUD() {
    if (!p1 || !p2) return;
    if (UI.p1Hp)   UI.p1Hp.style.width    = (p1.hp / CFG.MAX_HP * 100) + '%';
    if (UI.p2Hp)   UI.p2Hp.style.width    = (p2.hp / CFG.MAX_HP * 100) + '%';
    if (UI.p1Gauge)UI.p1Gauge.style.width = (p1.gauge / CFG.MAX_GAUGE * 100) + '%';
    if (UI.p2Gauge)UI.p2Gauge.style.width = (p2.gauge / CFG.MAX_GAUGE * 100) + '%';
    if (UI.p1Gauge)UI.p1Gauge.classList.toggle('full', p1.gauge >= CFG.MAX_GAUGE);
    if (UI.p2Gauge)UI.p2Gauge.classList.toggle('full', p2.gauge >= CFG.MAX_GAUGE);
    if (UI.timer)  UI.timer.textContent = roundTimer;
    if (UI.p1Striker) UI.p1Striker.classList.toggle('available', !p1.strikerUsed);
    if (UI.p2Striker) UI.p2Striker.classList.toggle('available', !p2.strikerUsed);

    if (p1.comboCount > 1) {
      UI.p1Combo.textContent = p1.comboCount + ' HIT!';
      UI.p1Combo.classList.add('show');
    } else {
      UI.p1Combo.classList.remove('show');
    }
    if (p2.comboCount > 1) {
      UI.p2Combo.textContent = p2.comboCount + ' HIT!';
      UI.p2Combo.classList.add('show');
    } else {
      UI.p2Combo.classList.remove('show');
    }
  }

  function endRound() {
    if (gameState !== 'fighting') return;
    gameState = 'result';
    roundActive = false;

    const winner = p1.hp > p2.hp ? p1 : p2.hp > p1.hp ? p2 : null;
    const winnerName = winner ? winner.data.name : 'SERI';

    announce('K.O.!');
    setTimeout(function () {
      UI.resultTitle.textContent = 'K.O.!';
      UI.resultWinner.textContent = winner ? winnerName + ' MENANG!' : 'SERI!';
      UI.statCombo.textContent = winner ? winner.maxCombo : 0;
      UI.statDamage.textContent = winner ? Math.round(winner.totalDamage) : 0;
      const reward = 50 + Math.round((winner ? winner.maxCombo : 0) * 5);
      coins += reward;
      UI.coinAmount.textContent = coins;
      UI.statCoin.textContent = '+' + reward + ' 🪙';
      showOverlay('result-screen');
    }, 1200);
  }

  /* ---------- RENDER ---------- */
  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, CFG.W, CFG.H);
    ctx.save();
    if (screenShake > 0) {
      ctx.translate((Math.random() - 0.5) * screenShake,
                    (Math.random() - 0.5) * screenShake);
      screenShake *= 0.8;
      if (screenShake < 0.5) screenShake = 0;
    }
    const grad = ctx.createLinearGradient(0, 0, 0, CFG.GROUND);
    grad.addColorStop(0, '#1a1a3e');
    grad.addColorStop(1, '#4a3a6e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CFG.W, CFG.GROUND);
    ctx.fillStyle = '#3a2818';
    ctx.fillRect(0, CFG.GROUND, CFG.W, CFG.H - CFG.GROUND);
    ctx.strokeStyle = '#6a4a2a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, CFG.GROUND);
    ctx.lineTo(CFG.W, CFG.GROUND);
    ctx.stroke();

    if (p1 && p2) { drawFighter(p1); drawFighter(p2); }
    ctx.restore();
    if (clash && !clash.resolved) drawClash();
  }

  function drawFighter(f) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(f.x, CFG.GROUND, 32, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    const blink = f.invincible > 0 && Math.floor(f.frame / 3) % 2 === 0;
    ctx.fillStyle = blink ? '#0ff' : f.data.color;
    ctx.fillRect(f.x - 30, f.y - 110, 60, 110);

    ctx.fillStyle = '#fdbcb4';
    ctx.beginPath();
    ctx.arc(f.x, f.y - 125, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(f.x, f.y - 135, 22, Math.PI, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.fillRect(f.facing === 1 ? f.x + 15 : f.x - 20, f.y - 130, 5, 5);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(f.data.name, f.x, f.y - 160);
    ctx.textAlign = 'left';

    const hb = f.activeHitbox;
    if (hb) {
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.strokeRect(hb.x, hb.y, hb.w, hb.h);
    }
  }

  function drawClash() {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 56px sans-serif';
    ctx.fillText('CLASH! ADU ARGUMEN!', CFG.W / 2, 200);
    ctx.font = 'bold 40px sans-serif';
    ctx.fillStyle = '#e63946';
    ctx.fillText('P1: ' + clash.p1 + ' / ' + clash.target, CFG.W / 2 - 280, 340);
    ctx.fillStyle = '#3a86ff';
    ctx.fillText('P2: ' + clash.p2 + ' / ' + clash.target, CFG.W / 2 + 280, 340);
    ctx.fillStyle = '#f4a300';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('Mash [J] (P1)  |  Mash [,] atau [Numpad1] (P2)', CFG.W / 2, 450);
    ctx.textAlign = 'left';
  }

  /* ---------- LOOP ---------- */
  function loop(t) {
    if (gameState === 'result' || gameState === 'paused') {
      render();
      requestAnimationFrame(loop);
      return;
    }
    if (gameState !== 'fighting') return;
    if (t - lastTime < 1000 / 60) { requestAnimationFrame(loop); return; }
    lastTime = t;
    update();
    render();
    requestAnimationFrame(loop);
  }

  /* ---------- INIT ---------- */
  function init() {
    try {
      input = new Input();
      canvas = $('game');
      if (canvas) ctx = canvas.getContext('2d');
      initMenu();

      if (UI.btnStart) {
        UI.btnStart.addEventListener('click', function () {
          if (selectedP1 && selectedP2) startMatch();
        });
      }
      if (UI.btnBack) {
        UI.btnBack.addEventListener('click', function () {
          showScreen('main-menu');
          gameState = 'menu';
        });
      }

      runLoading();
      console.log('[Fighter Konoha] init OK');
    } catch (e) {
      console.error('[Fighter Konoha] init failed:', e);
      if (UI.loadingText) UI.loadingText.textContent = 'Error: ' + e.message;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
