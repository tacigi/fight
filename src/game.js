/* ============================================================
   FIGHTER KONOHA — Main Game Loop
   Imports: config, input, characters, fighter
   ============================================================ */

import { CFG } from './config.js';
import { Input } from './input.js';
import { CHARACTERS, ROSTER_ORDER } from './characters.js';
import { Fighter } from './fighter.js';

/* ---------- GLOBAL ERROR HANDLER ---------- */
window.addEventListener('error', (e) => {
  console.error('[FK] Error:', e.message, 'at', e.filename + ':' + e.lineno);
  let box = document.getElementById('fatal-error');
  if (!box) {
    box = document.createElement('div');
    box.id = 'fatal-error';
    document.body.appendChild(box);
  }
  box.textContent = 'Error: ' + e.message + ' (baris ' + e.lineno + ')';
  box.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#b02a37;color:#fff;padding:10px;font-family:monospace;font-size:12px;text-align:center;z-index:9999;';
});

console.log('[FK] script loaded');

/* ---------- UI REFS ---------- */
const $ = (id) => document.getElementById(id);

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
  p2PanelLabel: $('p2-panel-label')
};

/* ---------- UI FUNCTIONS ---------- */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  const el = $(id);
  if (el) el.classList.add('active');
}

function showOverlay(id) {
  document.querySelectorAll('.overlay').forEach((o) => o.classList.remove('active'));
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
  toast._t = setTimeout(() => UI.toast.classList.remove('show'), 2200);
}

function announce(text) {
  if (!UI.announcement) return;
  UI.announcement.textContent = text;
  UI.announcement.classList.remove('show');
  void UI.announcement.offsetWidth;
  UI.announcement.classList.add('show');
}

// Expose ke fighter.js
window.FK_announce = announce;
window.FK_toast = toast;

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
    { pct: 100, text: 'Siap!' }
  ];
  let i = 0;
  function tick() {
    if (i >= steps.length) {
      setTimeout(() => {
        showScreen('main-menu');
        gameState = 'menu';
        console.log('[FK] menu ready');
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
  document.querySelectorAll('.menu-btn[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      if (mode === 'toko' || mode === 'catatan') {
        toast('Fitur ' + (mode === 'toko' ? 'Toko Kemeja' : 'Buku Catatan') + ' segera hadir!');
        return;
      }
      openCharacterSelect(mode);
    });
  });

  document.querySelectorAll('.overlay .menu-btn[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => handleOverlayAction(btn.dataset.action));
  });

  const pauseBtn = $('pause-btn');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      if (gameState === 'fighting') {
        gameState = 'paused';
        showOverlay('pause-menu');
      }
    });
  }

  window.addEventListener('keydown', (e) => {
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
    latihan: 'Latihan Kader'
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
  ROSTER_ORDER.forEach((id) => {
    const c = CHARACTERS[id];
    const card = document.createElement('div');
    card.className = 'roster-card';
    card.dataset.charId = id;
    card.innerHTML =
      '<span class="rc-badge" style="display:none;">P1</span>' +
      '<span class="rc-avatar">' + c.avatar + '</span>' +
      '<span class="rc-name">' + c.name + '</span>';
    card.addEventListener('click', () => pickCharacter(id));
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
  document.querySelectorAll('.roster-card').forEach((card) => {
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
  if (!canvas) { console.error('[FK] Canvas #game tidak ditemukan'); return; }
  ctx = canvas.getContext('2d');

  const c1 = CHARACTERS[selectedP1] || CHARACTERS.praroro;
  const c2 = CHARACTERS[selectedP2] || CHARACTERS.fufu;

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
    striker:  ['KeyI']
  });

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
    striker:  ['Numpad6', 'BracketRight']
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

  gameState = 'fighting';
  announce('ROUND 1');
  setTimeout(() => {
    announce('FIGHT!');
    roundActive = true;
  }, 1300);
  requestAnimationFrame(loop);
  console.log('[FK] match started:', c1.name, 'vs', c2.name);
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
  if (input.consume('KeyJ')) clash.p1++;
  if (input.consume(['Numpad1', 'Comma'])) clash.p2++;
  if (clash.p1 >= clash.target) resolveClash(1);
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
  setTimeout(() => { clash = null; }, 700);
}

function checkCollisions() {
  const h1 = p1.activeHitbox, h2 = p2.activeHitbox;
  const hb1 = p1.hurtbox, hb2 = p2.hurtbox;
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
    hitstop = CFG.HITSTOP;
    screenShake = 6;
  }
  if (h2HitsH1) {
    p2.hitDone = true;
    p1.takeHit(h2.move, p2, p1.blocking);
    hitstop = CFG.HITSTOP;
    screenShake = 6;
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
    if (timerAccum >= 60) {
      timerAccum = 0;
      roundTimer--;
    }
    if (roundTimer <= 0) {
      roundTimer = 0;
      endRound();
    }
  }

  if (p1.state === 'ko' || p2.state === 'ko') endRound();

  updateHUD();
}

function updateHUD() {
  if (!p1 || !p2) return;
  if (UI.p1Hp)     UI.p1Hp.style.width     = (p1.hp / CFG.MAX_HP * 100) + '%';
  if (UI.p2Hp)     UI.p2Hp.style.width     = (p2.hp / CFG.MAX_HP * 100) + '%';
  if (UI.p1Gauge)  UI.p1Gauge.style.width  = (p1.gauge / CFG.MAX_GAUGE * 100) + '%';
  if (UI.p2Gauge)  UI.p2Gauge.style.width  = (p2.gauge / CFG.MAX_GAUGE * 100) + '%';
  if (UI.p1Gauge)  UI.p1Gauge.classList.toggle('full', p1.gauge >= CFG.MAX_GAUGE);
  if (UI.p2Gauge)  UI.p2Gauge.classList.toggle('full', p2.gauge >= CFG.MAX_GAUGE);
  if (UI.timer)    UI.timer.textContent = roundTimer;
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
  setTimeout(() => {
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
    ctx.translate(
      (Math.random() - 0.5) * screenShake,
      (Math.random() - 0.5) * screenShake
    );
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

  if (p1 && p2) {
    drawFighter(p1);
    drawFighter(p2);
  }

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
  if (t - lastTime < 1000 / 60) {
    requestAnimationFrame(loop);
    return;
  }
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
      UI.btnStart.addEventListener('click', () => {
        if (selectedP1 && selectedP2) startMatch();
      });
    }
    if (UI.btnBack) {
      UI.btnBack.addEventListener('click', () => {
        showScreen('main-menu');
        gameState = 'menu';
      });
    }

    runLoading();
    console.log('[FK] init OK');
  } catch (e) {
    console.error('[FK] init failed:', e);
    if (UI.loadingText) UI.loadingText.textContent = 'Error: ' + e.message;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
