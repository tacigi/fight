// Contoh: ambil elemen HUD
const UI = {
  p1Hp: document.getElementById('p1-hp-bar'),
  p2Hp: document.getElementById('p2-hp-bar'),
  p1Gauge: document.getElementById('p1-gauge-bar'),
  p2Gauge: document.getElementById('p2-gauge-bar'),
  p1Name: document.getElementById('p1-hud-name'),
  p2Name: document.getElementById('p2-hud-name'),
  timer: document.getElementById('timer'),
  announcement: document.getElementById('announcement'),
  p1Combo: document.getElementById('p1-combo'),
  p2Combo: document.getElementById('p2-combo'),
  toast: document.getElementById('toast'),
};

// Update HUD tiap frame
function updateHUD() {
  UI.p1Hp.style.width = (p1.hp / CFG.MAX_HP * 100) + '%';
  UI.p2Hp.style.width = (p2.hp / CFG.MAX_HP * 100) + '%';
  UI.p1Gauge.style.width = (p1.gauge / CFG.MAX_GAUGE * 100) + '%';
  UI.p2Gauge.style.width = (p2.gauge / CFG.MAX_GAUGE * 100) + '%';

  UI.p1Gauge.classList.toggle('full', p1.gauge >= CFG.MAX_GAUGE);
  UI.p2Gauge.classList.toggle('full', p2.gauge >= CFG.MAX_GAUGE);
}

// Fungsi announce (ROUND 1, FIGHT, K.O.)
function announce(text) {
  UI.announcement.textContent = text;
  UI.announcement.classList.remove('show');
  void UI.announcement.offsetWidth; // reflow
  UI.announcement.classList.add('show');
}

// Fungsi toast
function toast(text) {
  UI.toast.textContent = text;
  UI.toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => UI.toast.classList.remove('show'), 2200);
}

// Screen manager
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// Overlay manager
function showOverlay(id) {
  document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));
  if (id) document.getElementById(id).classList.add('active');
}
