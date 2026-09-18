/* ============================================================
   FIGHTER KONOHA — Main Game Loop
   Fitur: CROUCH + CPU AI + 2 tipe serangan (tangan/kaki)
   ============================================================ */

import { CFG, CONTROLS, CONTROLS_LABELS, KEY_DISPLAY } from './config.js';
import { Input } from './input.js';
import { CHARACTERS, ROSTER_ORDER } from './characters.js';
import { Fighter } from './fighter.js';
import { AudioManager } from './audio.js';
import { CpuController } from './ai.js';

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
  p2PanelLabel: $('p2-panel-label'),
  optMaster:    $('opt-master'),
  optSfx:       $('opt-sfx'),
  optMusic:     $('opt-music'),
  optMusicOn:   $('opt-music-on'),
  controlsTable:$('controls-table'),
  settingsBack: $('settings-back')
};

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

window.FK_announce = announce;
window.FK_toast = toast;

const audio = new AudioManager();
window.FK_sfx = audio;

function unlockAudioOnce() {
  audio.unlock();
  window.removeEventListener('pointerdown', unlockAudioOnce);
  window.removeEventListener('keydown', unlockAudioOnce);
}
window.addEventListener('pointerdown', unlockAudioOnce);
window.addEventListener('keydown', unlockAudioOnce);

let input = null;
let p1 = null, p2 = null;
let canvas = null, ctx = null;
let gameState = 'loading';
let selectedP1 = null, selectedP2 = null, selectedMode = null;
let hitstop = 0, screenShake = 0, clash = null;
let lastTime = 0;
let rafId = null;
let roundTimer = CFG.ROUND_TIME;
let timerAccum = 0;
let roundActive = false;
let coins = 0;
let settingsReturn = null;
let bgPattern = null;
let p2IsCpu = false;
let p2Ai = null;

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

function initMenu() {
  document.querySelectorAll('.menu-btn[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      audio.menuClick();
      const mode = btn.dataset.mode;
      if (mode === 'toko' || mode === 'catatan') {
        toast('Fitur ' + (mode === 'toko' ? 'Toko Kemeja' : 'Buku Catatan') + ' segera hadir!');
        return;
      }
      openCharacterSelect(mode);
    });
  });

  document.querySelectorAll('.overlay .menu-btn[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      audio.menuClick();
      handleOverlayAction(btn.dataset.action);
    });
  });

  const pauseBtn = $('pause-btn');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      if (gameState === 'fighting') {
        audio.menuClick();
        gameState = 'paused';
        showOverlay('pause-menu');
      }
    });
  }

  const btnMenuSettings = $('btn-open-settings');
  if (btnMenuSettings) {
    btnMenuSettings.addEventListener('click', () => {
      audio.menuClick();
      openSettings('menu');
    });
  }
  const btnPauseSettings = $('btn-pause-settings');
  if (btnPauseSettings) {
    btnPauseSettings.addEventListener('click', () => {
      audio.menuClick();
      openSettings('pause');
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && gameState === 'fighting') {
      gameState = 'paused';
      showOverlay('pause-menu');
    } else if (e.code === 'Escape' && gameState === 'paused') {
      showOverlay(null);
      gameState = 'fighting';
    } else if (e.code === 'Escape' && gameState === 'settings') {
      closeSettings();
    }
  });

  initSettingsUI();
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

function initSettingsUI() {
  if (UI.optMaster) {
    UI.optMaster.value = Math.round(audio.settings.master * 100);
    UI.optMaster.addEventListener('input', (e) => audio.setMaster(e.target.value / 100));
  }
  if (UI.optSfx) {
    UI.optSfx.value = Math.round(audio.settings.sfx * 100);
    UI.optSfx.addEventListener('input', (e) => { audio.setSfx(e.target.value / 100); audio.hitLight(); });
  }
  if (UI.optMusic) {
    UI.optMusic.value = Math.round(audio.settings.music * 100);
    UI.optMusic.addEventListener('input', (e) => audio.setMusic(e.target.value / 100));
  }
  if (UI.optMusicOn) {
    UI.optMusicOn.checked = audio.settings.musicOn;
    UI.optMusicOn.addEventListener('change', (e) => audio.setMusicOn(e.target.checked));
  }
  if (UI.settingsBack) {
    UI.settingsBack.addEventListener('click', () => { audio.menuBack(); closeSettings(); });
  }
  renderControlsTable();
}

function renderControlsTable() {
  if (!UI.controlsTable) return;
  const rowsHtml = CONTROLS_LABELS.map((row) => {
    const p1Keys = CONTROLS.p1[row.key].map((c) => KEY_DISPLAY[c] || c).join(' / ');
    const p2Keys = CONTROLS.p2[row.key].map((c) => KEY_DISPLAY[c] || c).join(' / ');
    return (
      '<div class="ctrl-row">' +
        '<span class="ctrl-label">' + row.label + '</span>' +
        '<span class="ctrl-key ctrl-p1">' + p1Keys + '</span>' +
        '<span class="ctrl-key ctrl-p2">' + p2Keys + '</span>' +
      '</div>'
    );
  }).join('');
  UI.controlsTable.innerHTML =
    '<div class="ctrl-row ctrl-head">' +
      '<span class="ctrl-label">Aksi</span>' +
      '<span class="ctrl-key">Player 1</span>' +
      '<span class="ctrl-key">Player 2 / CPU</span>' +
    '</div>' + rowsHtml;
}

function openSettings(from) {
  settingsReturn = from;
  gameState = 'settings';
  if (UI.optMaster) UI.optMaster.value = Math.round(audio.settings.master * 100);
  if (UI.optSfx) UI.optSfx.value = Math.round(audio.settings.sfx * 100);
  if (UI.optMusic) UI.optMusic.value = Math.round(audio.settings.music * 100);
  if (UI.optMusicOn) UI.optMusicOn.checked = audio.settings.musicOn;
  showOverlay('settings-menu');
}

function closeSettings() {
  if (settingsReturn === 'pause') {
    showOverlay('pause-menu');
    gameState = 'paused';
  } else {
    showOverlay(null);
    gameState = 'menu';
  }
  settingsReturn = null;
}

function openCharacterSelect(mode) {
  selectedMode = mode;
  selectedP1 = null;
  selectedP2 = null;

  const modeNames = {
    pilpres: 'Pilpres Mode (vs CPU)',
    koalisi: 'Koalisi Mode (2 Pemain)',
    latihan: 'Latihan Kader (vs CPU)'
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
    card.addEventListener('click', () => { audio.menuClick(); pickCharacter(id); });
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
      if (badge) { badge.textContent = (selectedMode === 'koalisi' ? 'P2' : 'CPU'); badge.style.display = ''; }
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

function startMatch() {
  showScreen('game-stage');
  canvas = $('game');
  if (!canvas) { console.error('[FK] Canvas #game tidak ditemukan'); return; }
  ctx = canvas.getContext('2d');
  if (!bgPattern) bgPattern = buildBackground();

  const c1 = CHARACTERS[selectedP1] || CHARACTERS.praroro;
  const c2 = CHARACTERS[selectedP2] || CHARACTERS.fufu;

  p2IsCpu = (selectedMode !== 'koalisi');
  p2Ai = p2IsCpu ? new CpuController(CONTROLS.p2) : null;

  p1 = new Fighter(c1, 400, 1, CONTROLS.p1);
  p2 = new Fighter(c2, 880, -1, CONTROLS.p2);

  if (UI.p1Name) UI.p1Name.textContent = c1.name;
  if (UI.p2Name) UI.p2Name.textContent = c2.name + (p2IsCpu ? ' [CPU]' : '');
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
  audio.roundStart();
  setTimeout(() => {
    announce('FIGHT!');
    audio.roundStart();
    roundActive = true;
  }, 1300);

  if (rafId !== null) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(loop);
  console.log('[FK] match started:', c1.name, 'vs', c2.name, p2IsCpu ? '(CPU)' : '(P2)');
}

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
  if (input.consume('KeyJ')) { clash.p1++; audio.clashHit(); }
  if (p2IsCpu) {
    if (p2Ai && p2Ai.autoClash()) { clash.p2++; audio.clashHit(); }
  } else {
    if (input.consume(['Numpad1', 'KeyZ'])) { clash.p2++; audio.clashHit(); }
  }
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
    audio.special();
  } else if (winner === 2) {
    p1.stunTimer = CFG.STUN_CLASH;
    p2.gauge = Math.min(CFG.MAX_GAUGE, p2.gauge + 20);
    announce('P2 MENANG DEBAT!');
    audio.special();
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

  if (h1HitsH2 && h2HitsH1 && h1.move.heavy && h2.move.heavy) {
    startClash();
    return;
  }
  if (h1HitsH2) {
    p1.hitDone = true;
    const blocked = p2.blocking;
    p2.takeHit(h1.move, p1, blocked);
    hitstop = CFG.HITSTOP;
    screenShake = 6;
    playHitSfx(h1.move, blocked);
  }
  if (h2HitsH1) {
    p2.hitDone = true;
    const blocked = p1.blocking;
    p1.takeHit(h2.move, p2, blocked);
    hitstop = CFG.HITSTOP;
    screenShake = 6;
    playHitSfx(h2.move, blocked);
  }
}

function playHitSfx(move, blocked) {
  if (blocked) { audio.hitBlock(); return; }
  if (move.limb === 'leg') {
    if (move.heavy) audio.kickHeavy();
    else audio.kickLight();
  } else {
    if (move.heavy) audio.hitHeavy();
    else audio.hitLight();
  }
}

function update() {
  input.update();
  if (gameState !== 'fighting') return;
  if (clash && !clash.resolved) { updateClash(); return; }
  if (hitstop > 0) { hitstop--; return; }

  p1.update(input, p2);

  if (p2IsCpu && p2Ai) {
    p2Ai.think(p2, p1);
    p2.update(p2Ai, p1);
  } else {
    p2.update(input, p1);
  }

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

function buildBackground() {
  const off = document.createElement('canvas');
  off.width = CFG.W;
  off.height = CFG.H;
  const c = off.getContext('2d');

  const sky = c.createLinearGradient(0, 0, 0, CFG.GROUND);
  sky.addColorStop(0, '#1a1440');
  sky.addColorStop(0.55, '#3a2a6e');
  sky.addColorStop(1, '#6a3a5e');
  c.fillStyle = sky;
  c.fillRect(0, 0, CFG.W, CFG.GROUND);

  const sunGrad = c.createRadialGradient(CFG.W * 0.78, 130, 10, CFG.W * 0.78, 130, 110);
  sunGrad.addColorStop(0, 'rgba(255,210,120,0.9)');
  sunGrad.addColorStop(1, 'rgba(255,210,120,0)');
  c.fillStyle = sunGrad;
  c.fillRect(0, 0, CFG.W, CFG.GROUND);
  c.fillStyle = '#ffe6a0';
  c.beginPath();
  c.arc(CFG.W * 0.78, 130, 46, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = '#241a4a';
  c.beginPath();
  c.moveTo(0, CFG.GROUND);
  c.lineTo(0, 340);
  c.lineTo(180, 220);
  c.lineTo(360, 320);
  c.lineTo(560, 200);
  c.lineTo(760, 310);
  c.lineTo(960, 240);
  c.lineTo(1120, 330);
  c.lineTo(CFG.W, 260);
  c.lineTo(CFG.W, CFG.GROUND);
  c.closePath();
  c.fill();

  c.fillStyle = '#160f30';
  let bx = -20;
  let seed = 7;
  function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
  while (bx < CFG.W + 20) {
    const bw = 50 + rnd() * 70;
    const bh = 90 + rnd() * 170;
    const by = CFG.GROUND - bh;
    c.fillRect(bx, by, bw, bh);
    c.fillStyle = 'rgba(255,210,120,0.55)';
    for (let wy = by + 12; wy < CFG.GROUND - 12; wy += 20) {
      for (let wx = bx + 8; wx < bx + bw - 8; wx += 16) {
        if (rnd() > 0.45) c.fillRect(wx, wy, 6, 8);
      }
    }
    c.fillStyle = '#160f30';
    bx += bw + 14;
  }

  const floorGrad = c.createLinearGradient(0, CFG.GROUND, 0, CFG.H);
  floorGrad.addColorStop(0, '#4a3320');
  floorGrad.addColorStop(1, '#241708');
  c.fillStyle = floorGrad;
  c.fillRect(0, CFG.GROUND, CFG.W, CFG.H - CFG.GROUND);

  c.strokeStyle = 'rgba(0,0,0,0.35)';
  c.lineWidth = 2;
  for (let lx = 0; lx < CFG.W; lx += 64) {
    c.beginPath();
    c.moveTo(lx, CFG.GROUND);
    c.lineTo(lx - 40, CFG.H);
    c.stroke();
  }

  c.strokeStyle = '#8a6a3a';
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(0, CFG.GROUND);
  c.lineTo(CFG.W, CFG.GROUND);
  c.stroke();

  return off;
}

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

  if (bgPattern) ctx.drawImage(bgPattern, 0, 0);

  if (p1 && p2) {
    drawFighter(p1);
    drawFighter(p2);
  }

  ctx.restore();

  if (clash && !clash.resolved) drawClash();
}

function drawFighter(f) {
  const t = f.frame;
  const grounded = f.y >= CFG.GROUND;
  const walking = f.state === 'walk';
  const crouch = f.crouching && grounded;
  const bob = grounded && !crouch
    ? Math.sin(t * (walking ? 0.35 : 0.08)) * (walking ? 5 : 2)
    : 0;
  const facing = f.facing;
  const cx = f.x;
  const cy = f.y - bob;
  const color = f.data.color || '#e63946';
  const isKO = f.state === 'ko';
  const isHit = f.hitstun > 0 || f.stunTimer > 0;
  const isBlock = f.blocking && grounded;
  const isAttack = f.state === 'attack';
  const attackLimb = f.attackLimb;
  const blink = f.invincible > 0 && Math.floor(t / 3) % 2 === 0;

  ctx.save();

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, CFG.GROUND + 4, crouch ? 42 : 34, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  if (isKO) {
    ctx.translate(cx, CFG.GROUND - 14);
    ctx.rotate(facing === 1 ? -Math.PI / 2 : Math.PI / 2);
    drawBody(0, 0, color, facing, { legSpread: 6, armSpread: 30, headTilt: 20 }, {});
    ctx.restore();
    return;
  }

  ctx.translate(cx, cy);

  let lean = 0;
  if (isHit) lean = -facing * 8;
  if (!grounded) lean = facing * 4;
  if (isAttack) {
    if (attackLimb === 'hand') lean = facing * 8;
    else if (attackLimb === 'leg') lean = -facing * 4;
  }

  const legPhase = walking ? Math.sin(t * 0.35) : 0;
  const pose = {
    legSpread: crouch
      ? 20
      : (grounded ? (walking ? 14 + legPhase * 10 : (isBlock ? 6 : 10)) : 4),
    armSpread: crouch ? 10 : (isBlock ? 4 : 16),
    headTilt: isHit ? -facing * 10 : 0,
    lean: crouch ? 0 : lean
  };

  const flags = { isBlock, isAttack, isHit, attackLimb };

  if (crouch) {
    ctx.save();
    ctx.scale(1, 0.62);
    drawBody(0, 0, blink ? '#0ff' : color, facing, pose, flags);
    ctx.restore();
  } else {
    drawBody(0, 0, blink ? '#0ff' : color, facing, pose, flags);
  }

  const labelY = crouch ? -110 : -168;
  const avatarY = crouch ? -130 : -190;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 3;
  ctx.fillText(f.data.name, 0, labelY);
  ctx.font = '18px sans-serif';
  ctx.fillText(f.data.avatar || '', 0, avatarY);
  ctx.shadowBlur = 0;
  ctx.textAlign = 'left';

  ctx.restore();

  const hb = f.activeHitbox;
  if (hb) {
    ctx.strokeStyle = 'rgba(255,60,60,0.85)';
    ctx.lineWidth = 2;
    ctx.strokeRect(hb.x, hb.y, hb.w, hb.h);
  }
}

function drawBody(ox, oy, color, facing, pose, flags) {
  flags = flags || {};
  const lean = pose.lean || 0;

  ctx.save();
  ctx.translate(ox, oy);
  ctx.transform(1, 0, 0, 1, lean * 0.15, 0);

  if (flags.attackLimb === 'leg') {
    ctx.fillStyle = shade(color, -30);
    if (facing === 1) {
      ctx.fillRect(-pose.legSpread - 8, -60, 14, 60);
    } else {
      ctx.fillRect(pose.legSpread - 6, -60, 14, 60);
    }
    const kickLen = 58;
    const kickY = -55;
    ctx.fillStyle = shade(color, -10);
    if (facing === 1) {
      ctx.fillRect(14, kickY, kickLen, 16);
    } else {
      ctx.fillRect(-14 - kickLen, kickY, kickLen, 16);
    }
  } else {
    ctx.fillStyle = shade(color, -30);
    ctx.fillRect(-pose.legSpread - 8, -60, 14, 60);
    ctx.fillRect(pose.legSpread - 6, -60, 14, 60);
  }

  ctx.fillStyle = color;
  roundRect(-26, -118, 52, 62, 8);
  ctx.fill();

  ctx.fillStyle = shade(color, -15);
  const armY = -108;

  if (flags.isBlock) {
    ctx.fillRect(facing === 1 ? 2 : -34, armY + 6, 32, 14);
    ctx.fillRect(facing === 1 ? -10 : -22, armY + 18, 32, 14);
  } else if (flags.attackLimb === 'hand') {
    const punchLen = 46;
    if (facing === 1) {
      ctx.fillRect(20, armY, punchLen, 16);
    } else {
      ctx.fillRect(-20 - punchLen, armY, punchLen, 16);
    }
    ctx.fillStyle = shade(color, -25);
    if (facing === 1) {
      ctx.fillRect(-30, armY + 12, 16, 24);
    } else {
      ctx.fillRect(14, armY + 12, 16, 24);
    }
  } else {
    const frontArmX = facing === 1 ? 20 : -20 - pose.armSpread;
    ctx.fillRect(frontArmX, armY, pose.armSpread, 14);
    ctx.fillRect(facing === 1 ? -40 : 40 - 16, armY + 14, 16, 26);
  }

  ctx.fillStyle = '#fdbcb4';
  ctx.beginPath();
  ctx.arc(pose.headTilt || 0, -140, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = shade(color, -60);
  ctx.beginPath();
  ctx.arc((pose.headTilt || 0), -148, 22, Math.PI, 2 * Math.PI);
  ctx.fill();

  ctx.fillStyle = '#000';
  ctx.fillRect((pose.headTilt || 0) + (facing === 1 ? 8 : -13), -144, 5, 5);

  if (flags.isHit) {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc((pose.headTilt || 0) + (facing === 1 ? 8 : -13), -132, 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function shade(hex, pct) {
  const num = parseInt(hex.replace('#', ''), 16);
  let r = (num >> 16) + pct, g = ((num >> 8) & 0xff) + pct, b = (num & 0xff) + pct;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
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
  ctx.fillText('Mash [J] (P1)  |  ' + (p2IsCpu ? 'CPU mash otomatis' : 'Mash [Z] atau [Num1] (P2)'), CFG.W / 2, 450);

  ctx.textAlign = 'left';
}

function loop(t) {
  if (gameState === 'result' || gameState === 'paused' || gameState === 'settings') {
    render();
    rafId = requestAnimationFrame(loop);
    return;
  }
  if (gameState !== 'fighting') { rafId = null; return; }
  if (t - lastTime < 1000 / 60) {
    rafId = requestAnimationFrame(loop);
    return;
  }
  lastTime = t;
  update();
  render();
  rafId = requestAnimationFrame(loop);
}

function init() {
  try {
    input = new Input();
    canvas = $('game');
    if (canvas) ctx = canvas.getContext('2d');
    initMenu();

    if (UI.btnStart) {
      UI.btnStart.addEventListener('click', () => {
        if (selectedP1 && selectedP2) { audio.menuClick(); startMatch(); }
      });
    }
    if (UI.btnBack) {
      UI.btnBack.addEventListener('click', () => {
        audio.menuBack();
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
