/* ============================================================
   Trace With Me · Fun Tracing
   Special-needs-friendly edition · English version
   Fully working — includes canvas-layout race fixes
   ============================================================ */

/* ---------- Default character list ---------- */
let charList = ['A', 'B', 'C', '1', '2', '3', 'a', 'b', 'c'];

(function parseUrlChars() {
  try {
    const p = new URLSearchParams(location.search);
    const raw = p.get('w');
    if (raw) {
      const arr = decodeURIComponent(raw).split(/[,，\s]+/).filter(Boolean);
      if (arr.length) charList = arr;
    }
  } catch (e) { /* ignore */ }
})();

/* ---------- Settings ---------- */
const settings = {
  passThreshold: 0.75,
  brushSize: 22,
  brushColor: '#FF7043',
  soundOn: true,
  vibrateOn: true,
};

/* ---------- State ---------- */
let currentIndex = 0;
let coverage = 0;
let passed = false;
let starsEarned = 0;
const STARS_PER_CHAR = 3;

/* ---------- Canvas ---------- */
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let strokes = [];

/* ---------- Resize (guarded) ---------- */
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) return;   // layout not ready

  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(rect.width  * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap  = 'round';
  ctx.lineJoin = 'round';

  // Rebuild particles for new size so they stay inside the canvas
  if (particles.length && charList[currentIndex]) {
    buildParticlesFromChar(charList[currentIndex]);
  }
  redrawStrokes();
}

/* ---------- Particle ---------- */
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.baseR = 9;
    this.hit = false;
    this.burst = 0;
  }
  draw() {
    if (this.burst > 0) {
      const t = this.burst;
      const rr = this.baseR * (1 + t * 1.6);
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = '#FFD54F';
      ctx.beginPath();
      ctx.arc(this.x, this.y, rr, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFB300';
      for (let k = 0; k < 6; k++) {
        const ang = (k / 6) * Math.PI * 2;
        const d = this.baseR * (1 + t * 3);
        ctx.beginPath();
        ctx.arc(this.x + Math.cos(ang) * d,
                this.y + Math.sin(ang) * d,
                2.5 * (1 - t), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (this.hit) {
      ctx.fillStyle = '#C8E6C9';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.baseR * 0.9, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.baseR, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#B0BEC5';
      ctx.stroke();
    }
  }
}

/* ---------- Text -> particles ---------- */
function buildParticlesFromChar(ch) {
  const size = 320;
  const off = document.createElement('canvas');
  off.width = size;
  off.height = size;
  const octx = off.getContext('2d');

  octx.fillStyle = '#000';
  octx.textAlign = 'center';
  octx.textBaseline = 'middle';
  octx.font = `900 ${Math.round(size * 0.78)}px Verdana, Arial, sans-serif`;
  octx.fillText(ch, size / 2, size / 2 + size * 0.03);

  const data = octx.getImageData(0, 0, size, size).data;
  const grid = 34;
  const pts = [];
  for (let y = 0; y < size; y += grid) {
    for (let x = 0; x < size; x += grid) {
      const idx = (y * size + x) * 4 + 3;
      if (data[idx] > 128) pts.push({ nx: x / size, ny: y / size });
    }
  }

  const rect = canvas.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) {
    console.warn('[Trace] canvas has no size yet — will retry');
    particles = [];
    return;
  }

  const pad = 60;
  const w = rect.width - pad * 2;
  const h = rect.height - pad * 2;

  particles = pts.map(p => new Particle(pad + p.nx * w, pad + p.ny * h));
  particles.sort((a, b) => (a.y - b.y) || (a.x - b.x));

  // Fallback if font failed: draw a ring of dots so something is always visible
  if (particles.length === 0) {
    console.warn('[Trace] no particles generated — using fallback ring');
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const R  = Math.min(rect.width, rect.height) * 0.28;
    for (let k = 0; k < 20; k++) {
      const a = (k / 20) * Math.PI * 2;
      particles.push(new Particle(cx + Math.cos(a) * R, cy + Math.sin(a) * R));
    }
  }
}

/* ---------- Redraw ---------- */
function redrawStrokes() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const s of strokes) drawStroke(s);
  for (const p of particles) p.draw();
}

function drawStroke(s) {
  ctx.strokeStyle = s.color;
  ctx.lineWidth   = s.size;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  s.points.forEach((pt, i) => {
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else         ctx.lineTo(pt.x, pt.y);
  });
  ctx.stroke();
}

/* ---------- Drawing ---------- */
let drawing = false;
let currentStroke = null;

function pointFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  let clientX, clientY;
  if (e.touches && e.touches.length) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else if (e.changedTouches && e.changedTouches.length) {
    clientX = e.changedTouches[0].clientX;
    clientY = e.changedTouches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  return { x: clientX - rect.left, y: clientY - rect.top };
}

function startDraw(e) {
  e.preventDefault();
  if (passed) return;
  drawing = true;
  currentStroke = {
    color: settings.brushColor,
    size: settings.brushSize,
    points: [],
  };
  strokes.push(currentStroke);
  const p = pointFromEvent(e);
  currentStroke.points.push(p);
  hitParticles(p, settings.brushSize);
  redrawStrokes();
  hideStartHint();
}

function moveDraw(e) {
  if (!drawing) return;
  e.preventDefault();
  const p = pointFromEvent(e);
  currentStroke.points.push(p);
  hitParticles(p, settings.brushSize);
  redrawStrokes();
}

function endDraw(e) {
  if (!drawing) return;
  drawing = false;
  currentStroke = null;
  checkWin();
}

/* ---------- Hit detection ---------- */
function hitParticles(pt, brushR) {
  let newlyHit = 0;
  for (const p of particles) {
    if (p.hit) continue;
    const dx = p.x - pt.x;
    const dy = p.y - pt.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < p.baseR + brushR * 0.35) {
      p.hit = true;
      p.burst = 0.001;
      newlyHit++;
    }
  }
  if (newlyHit > 0) {
    playDing();
    vibrate(20);
    updateProgress();
  }
  animateBursts();
}

let burstRaf = null;
function animateBursts() {
  if (burstRaf) return;
  const step = () => {
    let active = false;
    for (const p of particles) {
      if (p.burst > 0 && p.burst < 1) {
        p.burst += 0.08;
        if (p.burst > 1) p.burst = 1;
        active = true;
      }
    }
    redrawStrokes();
    if (active) {
      burstRaf = requestAnimationFrame(step);
    } else {
      burstRaf = null;
    }
  };
  burstRaf = requestAnimationFrame(step);
}

/* ---------- Progress & pass ---------- */
function updateProgress() {
  const total = particles.length || 1;
  const hit   = particles.filter(p => p.hit).length;
  coverage = hit / total;
  const pct = Math.round(coverage * 100);

  const C = 2 * Math.PI * 24;
  const ring = document.getElementById('ringFill');
  ring.setAttribute('stroke-dasharray', `${C} ${C}`);
  ring.setAttribute('stroke-dashoffset', `${C * (1 - coverage)}`);
  document.getElementById('ringText').textContent = pct + '%';

  const newStars = Math.min(
    STARS_PER_CHAR,
    Math.floor(coverage / (settings.passThreshold / STARS_PER_CHAR))
  );
  if (newStars > starsEarned) {
    starsEarned = newStars;
    renderStars(true);
    playDing(880);
    vibrate([20, 30, 20]);
  }
}

function renderStars() {
  const box = document.getElementById('stars');
  box.innerHTML = '';
  for (let i = 0; i < STARS_PER_CHAR; i++) {
    const s = document.createElement('span');
    s.className = 'star' + (i < starsEarned ? ' on' : '');
    s.textContent = '⭐';
    box.appendChild(s);
  }
}

function checkWin() {
  if (passed) return;
  if (coverage >= settings.passThreshold) {
    passed = true;
    particles.forEach(p => {
      if (!p.hit) { p.hit = true; p.burst = 0.001; }
    });
    animateBursts();
    updateProgress();
    showCelebrate();
  }
}

/* ---------- Celebrate ---------- */
const celebrate = document.getElementById('celebrate');
function showCelebrate() {
  celebrate.classList.add('show');
  playCheer();
  vibrate([60, 40, 60]);
  clearTimeout(showCelebrate._t);
  showCelebrate._t = setTimeout(() => {
    celebrate.classList.remove('show');
    nextChar();
  }, 2600);
}

/* ---------- Char switching ---------- */
function loadChar(index) {
  if (!charList.length) return;
  currentIndex = ((index % charList.length) + charList.length) % charList.length;
  const ch = charList[currentIndex];
  document.getElementById('taskChar').textContent = ch;

  strokes = [];
  coverage = 0;
  passed = false;
  starsEarned = 0;
  renderStars();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  buildParticlesFromChar(ch);
  redrawStrokes();
  updateProgress();
  showStartHint();

  const C = 2 * Math.PI * 24;
  const ring = document.getElementById('ringFill');
  ring.setAttribute('stroke-dasharray', `${C} ${C}`);
  ring.setAttribute('stroke-dashoffset', `${C}`);
  document.getElementById('ringText').textContent = '0%';
}

function nextChar() { loadChar(currentIndex + 1); }
function prevChar() { loadChar(currentIndex - 1); }

/* ---------- Start hint ---------- */
const startHint = document.getElementById('startHint');
function showStartHint() {
  if (!particles.length) { startHint.classList.remove('show'); return; }
  const first = particles[0];
  startHint.style.left = first.x + 'px';
  startHint.style.top  = (first.y - 40) + 'px';
  startHint.classList.add('show');
}
function hideStartHint() {
  startHint.classList.remove('show');
}

/* ---------- Sound ---------- */
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { audioCtx = null; }
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function playDing(freq = 660) {
  if (!settings.soundOn) return;
  const ac = ensureAudio(); if (!ac) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.001, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.25, ac.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.28);
  o.connect(g); g.connect(ac.destination);
  o.start(); o.stop(ac.currentTime + 0.3);
}
function playCheer() {
  if (!settings.soundOn) return;
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playDing(f), i * 120));
}
function vibrate(p) {
  if (!settings.vibrateOn) return;
  if (navigator.vibrate) navigator.vibrate(p);
}

/* ---------- Events ---------- */
canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mousemove', moveDraw);
window.addEventListener('mouseup', endDraw);

canvas.addEventListener('touchstart', startDraw, { passive: false });
canvas.addEventListener('touchmove', moveDraw, { passive: false });
canvas.addEventListener('touchend', endDraw);
canvas.addEventListener('touchcancel', endDraw);

/* ---------- UI bindings (guarded so a missing node never kills the app) ---------- */
function bind(id, event, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener(event, fn);
}

bind('btnNext', 'click', nextChar);
bind('btnPrev', 'click', prevChar);
bind('btnSkip', 'click', nextChar);

bind('btnHelp', 'click', () => {
  showStartHint();
  playDing(880);
});

bind('btnCelebrateNext', 'click', () => {
  clearTimeout(showCelebrate._t);
  celebrate.classList.remove('show');
  nextChar();
});

/* ---------- Parent panel ---------- */
const parentPanel = document.getElementById('parentPanel');

function openParent() {
  if (!parentPanel) return;
  parentPanel.classList.add('show');
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  const txt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('passThreshold', Math.round(settings.passThreshold * 100));
  txt('passThresholdVal', Math.round(settings.passThreshold * 100) + '%');
  set('brushSize', settings.brushSize);
  txt('brushSizeVal', settings.brushSize);
  set('brushColor', settings.brushColor);
  const s = document.getElementById('soundOn');   if (s) s.checked = settings.soundOn;
  const v = document.getElementById('vibrateOn'); if (v) v.checked = settings.vibrateOn;
  set('customChars', charList.join(','));
}

function bindLongPress(el, onLong) {
  if (!el) return;
  let t = null;
  const start  = () => { t = setTimeout(onLong, 3000); };
  const cancel = () => { clearTimeout(t); };
  el.addEventListener('mousedown', start);
  el.addEventListener('touchstart', start, { passive: true });
  ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(ev =>
    el.addEventListener(ev, cancel));
}

bindLongPress(document.getElementById('btnHome'), openParent);

bind('btnCloseParent', 'click', () => parentPanel && parentPanel.classList.remove('show'));

bind('passThreshold', 'input', e => {
  const el = document.getElementById('passThresholdVal');
  if (el) el.textContent = e.target.value + '%';
});
bind('brushSize', 'input', e => {
  const el = document.getElementById('brushSizeVal');
  if (el) el.textContent = e.target.value;
});

bind('btnApply', 'click', () => {
  const g = id => document.getElementById(id);
  settings.passThreshold = parseInt(g('passThreshold').value, 10) / 100;
  settings.brushSize     = parseInt(g('brushSize').value, 10);
  settings.brushColor    = g('brushColor').value;
  settings.soundOn       = g('soundOn').checked;
  settings.vibrateOn     = g('vibrateOn').checked;

  const raw = g('customChars').value.trim();
  if (raw) {
    const arr = raw.split(/[,，\s]+/).filter(Boolean);
    if (arr.length) { charList = arr; currentIndex = 0; }
  }
  if (parentPanel) parentPanel.classList.remove('show');
  loadChar(0);
});

/* ---------- Boot (layout-safe) ---------- */
function bootWhenReady() {
  void canvas.offsetHeight;             // force reflow
  requestAnimationFrame(() => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) {
      setTimeout(bootWhenReady, 60);
      return;
    }
    resizeCanvas();
    loadChar(0);
  });
}

window.addEventListener('resize', () => {
  clearTimeout(window._rzT);
  window._rzT = setTimeout(resizeCanvas, 120);
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  bootWhenReady();
} else {
  document.addEventListener('DOMContentLoaded', bootWhenReady);
}
