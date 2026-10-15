/* Trace With Me — special-needs tracing app (English) */

/* ---------- Char list ---------- */
var charList = ['A', 'B', 'C', '1', '2', '3', 'a', 'b', 'c'];
(function () {
  try {
    var p = new URLSearchParams(location.search);
    var raw = p.get('w');
    if (raw) {
      var arr = decodeURIComponent(raw).split(/[,，\s]+/).filter(Boolean);
      if (arr.length) charList = arr;
    }
  } catch (e) {}
})();

/* ---------- Settings ---------- */
var settings = {
  passThreshold: 0.75,
  brushSize: 22,
  brushColor: '#FF7043',
  soundOn: true,
  vibrateOn: true
};

/* ---------- State ---------- */
var currentIndex = 0;
var coverage = 0;
var passed = false;
var starsEarned = 0;
var STARS_PER_CHAR = 3;
var particles = [];
var strokes = [];
var drawing = false;
var currentStroke = null;
var burstRaf = null;
var audioCtx = null;

/* ---------- Canvas ---------- */
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

/* ---------- Particle ---------- */
function Particle(x, y) {
  this.x = x;
  this.y = y;
  this.baseR = 9;
  this.hit = false;
  this.burst = 0;
}
Particle.prototype.draw = function () {
  if (this.burst > 0) {
    var t = this.burst;
    var rr = this.baseR * (1 + t * 1.6);
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = '#FFD54F';
    ctx.beginPath();
    ctx.arc(this.x, this.y, rr, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFB300';
    for (var k = 0; k < 6; k++) {
      var ang = (k / 6) * Math.PI * 2;
      var d = this.baseR * (1 + t * 3);
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
};

/* ---------- Canvas sizing ---------- */
function resizeCanvas() {
  var rect = canvas.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) return;
  var dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(rect.width  * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap  = 'round';
  ctx.lineJoin = 'round';
  if (particles.length && charList[currentIndex]) {
    buildParticlesFromChar(charList[currentIndex]);
  }
  redraw();
}
window.addEventListener('resize', function () {
  clearTimeout(window._rzT);
  window._rzT = setTimeout(resizeCanvas, 120);
});

/* ---------- Build particles from a character ---------- */
function buildParticlesFromChar(ch) {
  var size = 320;
  var off = document.createElement('canvas');
  off.width = size;
  off.height = size;
  var octx = off.getContext('2d');

  octx.fillStyle = '#000';
  octx.textAlign = 'center';
  octx.textBaseline = 'middle';
  octx.font = '900 ' + Math.round(size * 0.78) + 'px Verdana, Arial, sans-serif';
  octx.fillText(ch, size / 2, size / 2 + size * 0.03);

  var data = octx.getImageData(0, 0, size, size).data;
  var grid = 34;
  var pts = [];
  for (var y = 0; y < size; y += grid) {
    for (var x = 0; x < size; x += grid) {
      var idx = (y * size + x) * 4 + 3;
      if (data[idx] > 128) pts.push({ nx: x / size, ny: y / size });
    }
  }

  var rect = canvas.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) {
    particles = [];
    return;
  }

  var pad = 60;
  var w = rect.width  - pad * 2;
  var h = rect.height - pad * 2;

  particles = [];
  for (var i = 0; i < pts.length; i++) {
    particles.push(new Particle(pad + pts[i].nx * w, pad + pts[i].ny * h));
  }
  particles.sort(function (a, b) { return (a.y - b.y) || (a.x - b.x); });

  if (particles.length === 0) {
    // Fallback ring so something is always visible
    var cx = rect.width / 2, cy = rect.height / 2;
    var R = Math.min(rect.width, rect.height) * 0.28;
    for (var k = 0; k < 20; k++) {
      var a = (k / 20) * Math.PI * 2;
      particles.push(new Particle(cx + Math.cos(a) * R, cy + Math.sin(a) * R));
    }
  }
}

/* ---------- Redraw ---------- */
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (var i = 0; i < strokes.length; i++) drawStroke(strokes[i]);
  for (var j = 0; j < particles.length; j++) particles[j].draw();
}

function drawStroke(s) {
  ctx.strokeStyle = s.color;
  ctx.lineWidth = s.size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (var i = 0; i < s.points.length; i++) {
    var pt = s.points[i];
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  }
  ctx.stroke();
}

/* ---------- Input ---------- */
function pointFromEvent(e) {
  var rect = canvas.getBoundingClientRect();
  var clientX, clientY;
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
  currentStroke = { color: settings.brushColor, size: settings.brushSize, points: [] };
  strokes.push(currentStroke);
  var p = pointFromEvent(e);
  currentStroke.points.push(p);
  hitParticles(p, settings.brushSize);
  redraw();
  hideStartHint();
}
function moveDraw(e) {
  if (!drawing) return;
  e.preventDefault();
  var p = pointFromEvent(e);
  currentStroke.points.push(p);
  hitParticles(p, settings.brushSize);
  redraw();
}
function endDraw(e) {
  if (!drawing) return;
  drawing = false;
  currentStroke = null;
  checkWin();
}

canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mousemove', moveDraw);
window.addEventListener('mouseup', endDraw);
canvas.addEventListener('touchstart', startDraw, { passive: false });
canvas.addEventListener('touchmove', moveDraw, { passive: false });
canvas.addEventListener('touchend', endDraw);
canvas.addEventListener('touchcancel', endDraw);

/* ---------- Hit detection ---------- */
function hitParticles(pt, brushR) {
  var newlyHit = 0;
  for (var i = 0; i < particles.length; i++) {
    var p = particles[i];
    if (p.hit) continue;
    var dx = p.x - pt.x;
    var dy = p.y - pt.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
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

function animateBursts() {
  if (burstRaf) return;
  var step = function () {
    var active = false;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (p.burst > 0 && p.burst < 1) {
        p.burst += 0.08;
        if (p.burst > 1) p.burst = 1;
        active = true;
      }
    }
    redraw();
    if (active) burstRaf = requestAnimationFrame(step);
    else burstRaf = null;
  };
  burstRaf = requestAnimationFrame(step);
}

/* ---------- Progress ---------- */
function updateProgress() {
  var total = particles.length || 1;
  var hit = 0;
  for (var i = 0; i < particles.length; i++) if (particles[i].hit) hit++;
  coverage = hit / total;
  var pct = Math.round(coverage * 100);

  var C = 2 * Math.PI * 24;
  var ring = document.getElementById('ringFill');
  if (ring) {
    ring.setAttribute('stroke-dasharray', C + ' ' + C);
    ring.setAttribute('stroke-dashoffset', String(C * (1 - coverage)));
  }
  var rt = document.getElementById('ringText');
  if (rt) rt.textContent = pct + '%';

  var newStars = Math.min(STARS_PER_CHAR,
    Math.floor(coverage / (settings.passThreshold / STARS_PER_CHAR)));
  if (newStars > starsEarned) {
    starsEarned = newStars;
    renderStars();
    playDing(880);
    vibrate([20, 30, 20]);
  }
}

function renderStars() {
  var box = document.getElementById('stars');
  if (!box) return;
  box.innerHTML = '';
  for (var i = 0; i < STARS_PER_CHAR; i++) {
    var s = document.createElement('span');
    s.className = 'star' + (i < starsEarned ? ' on' : '');
    s.textContent = '⭐';
    box.appendChild(s);
  }
}

function checkWin() {
  if (passed) return;
  if (coverage >= settings.passThreshold) {
    passed = true;
    for (var i = 0; i < particles.length; i++) {
      if (!particles[i].hit) {
        particles[i].hit = true;
        particles[i].burst = 0.001;
      }
    }
    animateBursts();
    updateProgress();
    showCelebrate();
  }
}

/* ---------- Celebrate ---------- */
function showCelebrate() {
  var el = document.getElementById('celebrate');
  if (!el) { nextChar(); return; }
  el.classList.add('show');
  playCheer();
  vibrate([60, 40, 60]);
  clearTimeout(showCelebrate._t);
  showCelebrate._t = setTimeout(function () {
    el.classList.remove('show');
    nextChar();
  }, 2600);
}

/* ---------- Load a character ---------- */
function loadChar(index) {
  if (!charList.length) return;
  currentIndex = ((index % charList.length) + charList.length) % charList.length;
  var ch = charList[currentIndex];
  var tc = document.getElementById('taskChar');
  if (tc) tc.textContent = ch;

  strokes = [];
  coverage = 0;
  passed = false;
  starsEarned = 0;
  renderStars();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  buildParticlesFromChar(ch);
  redraw();
  updateProgress();
  showStartHint();

  var C = 2 * Math.PI * 24;
  var ring = document.getElementById('ringFill');
  if (ring) {
    ring.setAttribute('stroke-dasharray', C + ' ' + C);
    ring.setAttribute('stroke-dashoffset', String(C));
  }
  var rt = document.getElementById('ringText');
  if (rt) rt.textContent = '0%';
}

function nextChar() { loadChar(currentIndex + 1); }
function prevChar() { loadChar(currentIndex - 1); }

/* ---------- Start hint ---------- */
function showStartHint() {
  var el = document.getElementById('startHint');
  if (!el) return;
  if (!particles.length) { el.classList.remove('show'); return; }
  var first = particles[0];
  el.style.left = first.x + 'px';
  el.style.top  = (first.y - 40) + 'px';
  el.classList.add('show');
}
function hideStartHint() {
  var el = document.getElementById('startHint');
  if (el) el.classList.remove('show');
}

/* ---------- Audio ---------- */
function ensureAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { audioCtx = null; }
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function playDing(freq) {
  if (!settings.soundOn) return;
  freq = freq || 660;
  var ac = ensureAudio();
  if (!ac) return;
  var o = ac.createOscillator();
  var g = ac.createGain();
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
  var notes = [523, 659, 784, 1047];
  for (var i = 0; i < notes.length; i++) {
    (function (f, i) { setTimeout(function () { playDing(f); }, i * 120); })(notes[i], i);
  }
}
function vibrate(p) {
  if (!settings.vibrateOn) return;
  if (navigator.vibrate) navigator.vibrate(p);
}

/* ---------- UI bindings ---------- */
function bind(id, event, fn) {
  var el = document.getElementById(id);
  if (el) el.addEventListener(event, fn);
}

bind('btnNext', 'click', nextChar);
bind('btnPrev', 'click', prevChar);
bind('btnSkip', 'click', nextChar);
bind('btnHelp', 'click', function () { showStartHint(); playDing(880); });
bind('btnCelebrateNext', 'click', function () {
  var el = document.getElementById('celebrate');
  if (el) el.classList.remove('show');
  clearTimeout(showCelebrate._t);
  nextChar();
});

/* ---------- Parent panel ---------- */
function openParent() {
  var panel = document.getElementById('parentPanel');
  if (!panel) return;
  panel.classList.add('show');
  setVal('passThreshold', Math.round(settings.passThreshold * 100));
  setTxt('passThresholdVal', Math.round(settings.passThreshold * 100) + '%');
  setVal('brushSize', settings.brushSize);
  setTxt('brushSizeVal', settings.brushSize);
  setVal('brushColor', settings.brushColor);
  var s = document.getElementById('soundOn');   if (s) s.checked = settings.soundOn;
  var v = document.getElementById('vibrateOn'); if (v) v.checked = settings.vibrateOn;
  setVal('customChars', charList.join(','));
}
function setVal(id, v) { var el = document.getElementById(id); if (el) el.value = v; }
function setTxt(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }

function bindLongPress(el, onLong) {
  if (!el) return;
  var t = null;
  var start  = function () { t = setTimeout(onLong, 3000); };
  var cancel = function () { clearTimeout(t); };
  el.addEventListener('mousedown', start);
  el.addEventListener('touchstart', start, { passive: true });
  ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(function (ev) {
    el.addEventListener(ev, cancel);
  });
}
bindLongPress(document.getElementById('btnHome'), openParent);

bind('btnCloseParent', 'click', function () {
  var panel = document.getElementById('parentPanel');
  if (panel) panel.classList.remove('show');
});
bind('passThreshold', 'input', function (e) {
  setTxt('passThresholdVal', e.target.value + '%');
});
bind('brushSize', 'input', function (e) {
  setTxt('brushSizeVal', e.target.value);
});
bind('btnApply', 'click', function () {
  var g = function (id) { return document.getElementById(id); };
  settings.passThreshold = parseInt(g('passThreshold').value, 10) / 100;
  settings.brushSize     = parseInt(g('brushSize').value, 10);
  settings.brushColor    = g('brushColor').value;
  settings.soundOn       = g('soundOn').checked;
  settings.vibrateOn     = g('vibrateOn').checked;

  var raw = g('customChars').value.trim();
  if (raw) {
    var arr = raw.split(/[,，\s]+/).filter(Boolean);
    if (arr.length) { charList = arr; currentIndex = 0; }
  }
  var panel = document.getElementById('parentPanel');
  if (panel) panel.classList.remove('show');
  loadChar(0);
});

/* ---------- Boot ---------- */
function boot() {
  void canvas.offsetHeight;
  requestAnimationFrame(function () {
    var rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) {
      setTimeout(boot, 60);
      return;
    }
    resizeCanvas();
    loadChar(0);
  });
}
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  boot();
} else {
  document.addEventListener('DOMContentLoaded', boot);
}
