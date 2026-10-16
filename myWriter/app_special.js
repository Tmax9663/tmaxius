/* ============================================================
跟我学 · 描红乐园
特殊儿童友好版 · 多语言 + 分级 + 贴纸册 + Combo + 完美徽章
【修复】笔刷绘制顺序：先画粒子，再画笔画（笔刷在粒子上方）
============================================================ */

/* ---------- i18n ---------- */
const i18n = {
  zh: {
    todayLearn: '今天学',
    startHere: '💡 从这里开始',
    prev: '上一个',
    next: '换一个',
    skip: '下一个',
    help: '提示',
    finish: '完成',
    continueDraw: '继续描 ➡️',
    perfect: '完美！',
    great: '真棒！',
    good: '做得好！',
    nextBtn: '下一个 ➡️',
    parentTitle: '家长 / 老师设置',
    passThreshold: '过关阈值',
    brushSize: '笔粗细',
    brushColor: '笔颜色',
    sound: '音效',
    vibrate: '震动',
    difficulty: '难度级别',
    customChars: '自定义字表（逗号或换行分隔）',
    custom: '自定义',
    apply: '应用',
    close: '关闭',
    stickerBook: '📖 贴纸册',
    stickers: '张贴纸',
    combo: '连击',
    level1: '启蒙',
    level2: '基础',
    level3: '进阶',
    level4: '挑战',
    cheerPerfect: '太完美了！',
    cheerGreat: '真棒！继续加油！',
    cheerGood: '做得好！',
    comboText: (n) => `连击 x${n}！`
  },
  en: {
    todayLearn: 'Today',
    startHere: '💡 Start here',
    prev: 'Prev',
    next: 'Next',
    skip: 'Skip',
    help: 'Help',
    finish: 'Finish',
    continueDraw: 'Keep drawing ➡️',
    perfect: 'Perfect!',
    great: 'Great!',
    good: 'Good job!',
    nextBtn: 'Next ➡️',
    parentTitle: 'Parent / Teacher Settings',
    passThreshold: 'Pass threshold',
    brushSize: 'Brush size',
    brushColor: 'Brush color',
    sound: 'Sound',
    vibrate: 'Vibrate',
    difficulty: 'Difficulty',
    customChars: 'Custom characters (comma or newline)',
    custom: 'Custom',
    apply: 'Apply',
    close: 'Close',
    stickerBook: '📖 Sticker Book',
    stickers: 'stickers',
    combo: 'Combo',
    level1: 'Starter',
    level2: 'Basic',
    level3: 'Intermediate',
    level4: 'Advanced',
    cheerPerfect: 'Perfect! Amazing!',
    cheerGreat: 'Great job! Keep going!',
    cheerGood: 'Well done!',
    comboText: (n) => `Combo x${n}!`
  }
};

let currentLang = localStorage.getItem('lang') || 'zh';
function t(key) {
  const val = i18n[currentLang][key];
  return val !== undefined ? val : key;
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = t(key);
    if (typeof text === 'string') el.textContent = text;
  });
  document.getElementById('btnLang').textContent = currentLang === 'zh' ? '🇨🇳' : '🇺🇸';
  document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
}

/* ---------- 分级字表 ---------- */
const levelCharSets = {
  zh: {
    1: ['一', '二', '三', '十', '人', '大'],
    2: ['上', '下', '左', '右', '天', '地', '日', '月'],
    3: ['学', '校', '家', '爱', '我', '你', '他', '好'],
    4: ['春', '夏', '秋', '冬', '风', '花', '雪', '山', '水', '火']
  },
  en: {
    1: ['A', 'B', 'C', '1', '2', '3'],
    2: ['D', 'E', 'F', '4', '5', '6'],
    3: ['G', 'H', 'I', 'J', '7', '8', '9'],
    4: ['K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0']
  }
};

let currentLevel = parseInt(localStorage.getItem('level') || '1');
let customCharList = localStorage.getItem('customChars') || '';

function getCharListForLevel(level, lang) {
  if (level === 'custom' || level === 5) {
    const raw = customCharList;
    if (raw) {
      const arr = raw.split(/[,，\s\n]+/).filter(Boolean);
      if (arr.length) return arr;
    }
    return levelCharSets[lang][1];
  }
  return levelCharSets[lang][level] || levelCharSets[lang][1];
}

let charList = getCharListForLevel(currentLevel, currentLang);

const urlParams = new URLSearchParams(location.search);
if (urlParams.get('w')) {
  const raw = decodeURIComponent(urlParams.get('w'));
  const arr = raw.split(/[,，\s]+/).filter(Boolean);
  if (arr.length) charList = arr;
}

/* ---------- 设置 ---------- */
const settings = {
  passThreshold: 0.75,
  brushSize: 28,
  brushColor: '#FF7043',
  soundOn: true,
  vibrateOn: true,
};

/* ---------- 状态 ---------- */
let currentIndex = 0;
let coverage = 0;
let passed = false;
let starsEarned = 0;
const STARS_PER_CHAR = 3;

/* ---------- Combo ---------- */
let comboCount = 0;
let lastHitTime = 0;
const COMBO_WINDOW = 400;

/* ---------- 自动跳转 ---------- */
let autoSkipTimer = null;

/* ---------- 贴纸册 ---------- */
function getStickerKey() {
  return `stickers_${currentLang}_${currentLevel}`;
}
function loadStickers() {
  try { return JSON.parse(localStorage.getItem(getStickerKey()) || '[]'); }
  catch { return []; }
}
function saveStickers(arr) {
  localStorage.setItem(getStickerKey(), JSON.stringify(arr));
}
function addSticker(ch) {
  const arr = loadStickers();
  if (!arr.includes(ch)) {
    arr.push(ch);
    saveStickers(arr);
  }
  return arr;
}

/* ---------- 画布 ---------- */
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  redrawStrokes();
}
window.addEventListener('resize', resizeCanvas);

/* ---------- 粒子 ---------- */
class Particle {
  constructor(x, y, r = 9) {
    this.x = x; this.y = y;
    this.baseR = r; this.r = r;
    this.hit = false; this.burst = 0;
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

let particles = [];
let strokes = [];

/* ---------- 文字 → 粒子（高精度采样） ---------- */
function buildParticlesFromChar(ch) {
  const size = 600;
  const off = document.createElement('canvas');
  off.width = size; off.height = size;
  const octx = off.getContext('2d');
  octx.fillStyle = '#000';
  octx.textAlign = 'center';
  octx.textBaseline = 'middle';
  octx.font = `900 ${size * 0.75}px "PingFang SC", "Microsoft YaHei", "SimHei", "Verdana", sans-serif`;
  octx.fillText(ch, size / 2, size / 2);
  const data = octx.getImageData(0, 0, size, size).data;
  const grid = 16;
  const particleR = grid * 0.6;
  const pts = [];
  for (let y = 0; y < size; y += grid) {
    for (let x = 0; x < size; x += grid) {
      const idx = (y * size + x) * 4 + 3;
      if (data[idx] > 128) {
        pts.push({ nx: x / size, ny: y / size, r: particleR });
      }
    }
  }
  const rect = canvas.getBoundingClientRect();
  const pad = 24;
  const w = rect.width - pad * 2;
  const h = rect.height - pad * 2;
  particles = pts.map(p => new Particle(pad + p.nx * w, pad + p.ny * h, p.r));
  particles.sort((a, b) => (a.y - b.y) || (a.x - b.x));
}

/* ---------- 重绘 ---------- */
function redrawStrokes() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // 【修复】先画粒子（作为背景参考）
  for (const p of particles) p.draw();
  // 【修复】再画笔画（在粒子上方）
  for (const s of strokes) drawStroke(s);
}
function drawStroke(s) {
  ctx.strokeStyle = s.color;
  ctx.lineWidth = s.size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  s.points.forEach((pt, i) => {
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.stroke();
}

/* ---------- 笔画事件 ---------- */
let drawing = false;
let currentStroke = null;

function pointFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  let clientX, clientY;
  if (e.touches && e.touches.length) {
    clientX = e.touches[0].clientX; clientY = e.touches[0].clientY;
  } else if (e.changedTouches && e.changedTouches.length) {
    clientX = e.changedTouches[0].clientX; clientY = e.changedTouches[0].clientY;
  } else {
    clientX = e.clientX; clientY = e.clientY;
  }
  return { x: clientX - rect.left, y: clientY - rect.top };
}

function startDraw(e) {
  e.preventDefault();
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

/* ---------- 命中 + Combo ---------- */
function hitParticles(pt, brushR) {
  let newlyHit = 0;
  for (const p of particles) {
    if (p.hit) continue;
    const dx = p.x - pt.x;
    const dy = p.y - pt.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < p.baseR + brushR * 0.45) {
      p.hit = true;
      p.burst = 0.001;
      newlyHit++;
    }
  }
  if (newlyHit > 0) {
    const now = performance.now();
    if (now - lastHitTime < COMBO_WINDOW) {
      comboCount += newlyHit;
    } else {
      comboCount = newlyHit;
    }
    lastHitTime = now;
    if (comboCount >= 3) showCombo(comboCount);
    playDing();
    vibrate(20);
    updateProgress();
  }
  animateBursts();
}

const comboFloat = document.getElementById('comboFloat');
let comboTimer = null;
function showCombo(n) {
  const level = Math.min(4, Math.floor((n - 3) / 3) + 1);
  comboFloat.textContent = t('comboText')(n);
  comboFloat.className = 'combo-float show combo-' + level;
  clearTimeout(comboTimer);
  comboTimer = setTimeout(() => {
    comboFloat.classList.remove('show');
  }, 900);
}

/* ---------- 爆裂动画 ---------- */
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
    if (active) burstRaf = requestAnimationFrame(step);
    else burstRaf = null;
  };
  burstRaf = requestAnimationFrame(step);
}

/* ---------- 进度 ---------- */
function updateProgress() {
  const total = particles.length || 1;
  const hit = particles.filter(p => p.hit).length;
  coverage = hit / total;
  const pct = Math.round(coverage * 100);
  const C = 2 * Math.PI * 24;
  const ring = document.getElementById('ringFill');
  ring.setAttribute('stroke-dasharray', `${C} ${C}`);
  ring.setAttribute('stroke-dashoffset', `${C * (1 - coverage)}`);
  document.getElementById('ringText').textContent = pct + '%';
  const newStars = Math.min(STARS_PER_CHAR, Math.floor(coverage / (settings.passThreshold / STARS_PER_CHAR)));
  if (newStars > starsEarned) {
    starsEarned = newStars;
    renderStars();
    if (newStars > 0) {
      playDing(880);
      vibrate([20, 30, 20]);
    }
  }
  
  if (passed && coverage >= 0.95 && !perfectTriggered) {
    perfectTriggered = true;
    perfectBadge.classList.add('show');
    setTimeout(() => perfectBadge.classList.remove('show'), 2400);
    playCheer();
    speak(t('cheerPerfect'));
    vibrate([60, 40, 60, 40, 60]);
  }
  
  const celebrateEl = document.getElementById('celebrate');
  const isCelebrating = celebrateEl.classList.contains('show');
  
  if (passed && coverage >= 0.95 && !isCelebrating && !autoSkipTimer) {
    const delay = coverage >= 0.98 ? 1200 : 2000;
    autoSkipTimer = setTimeout(() => {
      autoSkipTimer = null;
      nextChar();
    }, delay);
    btnFinish.style.display = 'none';
  }
}

let perfectTriggered = false;

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
    updateProgress();
    showCelebrate();
    if (coverage < 0.95) {
      btnFinish.style.display = 'block';
    }
  }
}

/* ---------- 庆祝 ---------- */
const celebrate = document.getElementById('celebrate');
const perfectBadge = document.getElementById('perfectBadge');

function showCelebrate() {
  const isPerfect = coverage >= 0.95;
  let cheerKey;
  if (isPerfect) {
    cheerKey = 'cheerPerfect';
    perfectBadge.classList.add('show');
    setTimeout(() => perfectBadge.classList.remove('show'), 2400);
    perfectTriggered = true;
  } else if (coverage >= 0.9) {
    cheerKey = 'cheerGreat';
  } else {
    cheerKey = 'cheerGood';
  }
  
  document.getElementById('celebrateText').textContent = t(cheerKey);

  celebrate.classList.add('show');
  playCheer();
  speak(t(cheerKey));
  vibrate([60, 40, 60]);

  clearTimeout(showCelebrate._t);
  showCelebrate._t = setTimeout(() => {
    celebrate.classList.remove('show');
    updateProgress();
  }, 2600);
}

document.getElementById('btnCelebrateNext').addEventListener('click', () => {
  clearTimeout(showCelebrate._t);
  celebrate.classList.remove('show');
  updateProgress();
});

/* ---------- 字切换 ---------- */
function loadChar(index) {
  currentIndex = ((index % charList.length) + charList.length) % charList.length;
  const ch = charList[currentIndex];
  document.getElementById('taskChar').textContent = ch;
  strokes = [];
  coverage = 0;
  passed = false;
  starsEarned = 0;
  comboCount = 0;
  lastHitTime = 0;
  perfectTriggered = false;
  
  if (autoSkipTimer) {
    clearTimeout(autoSkipTimer);
    autoSkipTimer = null;
  }
  
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
  btnFinish.style.display = 'none';
}
function nextChar() { loadChar(currentIndex + 1); }
function prevChar() { loadChar(currentIndex - 1); }

/* ---------- 起点提示 ---------- */
const startHint = document.getElementById('startHint');
function showStartHint() {
  if (!particles.length) return;
  const first = particles[0];
  startHint.style.left = first.x + 'px';
  startHint.style.top  = (first.y - 40) + 'px';
  startHint.classList.add('show');
}
function hideStartHint() { startHint.classList.remove('show'); }

/* ---------- 音效 ---------- */
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { audioCtx = null; }
  }
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
  const notes = [523, 659, 784, 1047];
  notes.forEach((f, i) => setTimeout(() => playDing(f), i * 120));
}
function vibrate(p) {
  if (!settings.vibrateOn) return;
  if (navigator.vibrate) navigator.vibrate(p);
}

/* ---------- 语音鼓励 ---------- */
function speak(text) {
  if (!settings.soundOn) return;
  if ('speechSynthesis' in window) {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = currentLang === 'zh' ? 'zh-CN' : 'en-US';
      u.rate = 0.95; u.pitch = 1.1;
      speechSynthesis.speak(u);
    } catch (e) {}
  }
}

/* ---------- 事件绑定 ---------- */
canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mousemove', moveDraw);
window.addEventListener('mouseup', endDraw);
canvas.addEventListener('touchstart', startDraw, { passive: false });
canvas.addEventListener('touchmove', moveDraw, { passive: false });
canvas.addEventListener('touchend', endDraw);
canvas.addEventListener('touchcancel', endDraw);

document.getElementById('btnNext').addEventListener('click', nextChar);
document.getElementById('btnPrev').addEventListener('click', prevChar);
document.getElementById('btnSkip').addEventListener('click', nextChar);
document.getElementById('btnHelp').addEventListener('click', () => {
  showStartHint(); playDing(880);
});

/* ---------- 完成按钮 ---------- */
const btnFinish = document.getElementById('btnFinish');
btnFinish.addEventListener('click', () => {
  particles.forEach(p => {
    if (!p.hit) {
      p.hit = true;
      p.burst = 0.001;
    }
  });
  animateBursts();
  btnFinish.style.display = 'none';
  nextChar();
});

/* ---------- 语言切换 ---------- */
document.getElementById('btnLang').addEventListener('click', () => {
  currentLang = currentLang === 'zh' ? 'en' : 'zh';
  localStorage.setItem('lang', currentLang);
  applyI18n();
  charList = getCharListForLevel(currentLevel, currentLang);
  currentIndex = 0;
  loadChar(0);
});

/* ---------- 贴纸册 ---------- */
const stickerPanel = document.getElementById('stickerPanel');
document.getElementById('btnSticker').addEventListener('click', () => {
  renderStickerBook();
  stickerPanel.classList.add('show');
});
document.getElementById('btnCloseSticker').addEventListener('click', () => {
  stickerPanel.classList.remove('show');
});

function renderStickerBook() {
  const grid = document.getElementById('stickerGrid');
  const arr = loadStickers();
  grid.innerHTML = '';
  const allChars = getCharListForLevel(currentLevel, currentLang);
  allChars.forEach(ch => {
    const cell = document.createElement('div');
    cell.className = 'sticker-cell' + (arr.includes(ch) ? ' earned' : '');
    cell.textContent = ch;
    grid.appendChild(cell);
  });
  document.getElementById('stickerCount').textContent = arr.length;
}

/* ---------- 家长面板 ---------- */
const btnHome = document.getElementById('btnHome');
const parentPanel = document.getElementById('parentPanel');

function openParent() {
  parentPanel.classList.add('show');
  document.getElementById('passThreshold').value = settings.passThreshold * 100;
  document.getElementById('passThresholdVal').textContent = Math.round(settings.passThreshold * 100) + '%';
  document.getElementById('brushSize').value = settings.brushSize;
  document.getElementById('brushSizeVal').textContent = settings.brushSize;
  document.getElementById('brushColor').value = settings.brushColor;
  document.getElementById('soundOn').checked = settings.soundOn;
  document.getElementById('vibrateOn').checked = settings.vibrateOn;
  document.getElementById('difficultyLevel').value = currentLevel;
  document.getElementById('customChars').value = customCharList;
}

function bindLongPress(el, onLong) {
  let t = null;
  const start = () => { t = setTimeout(onLong, 2000); };
  const cancel = () => { clearTimeout(t); };
  el.addEventListener('mousedown', start);
  el.addEventListener('touchstart', start, { passive: true });
  ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(ev =>
    el.addEventListener(ev, cancel));
}
bindLongPress(btnHome, openParent);

document.getElementById('btnCloseParent').addEventListener('click', () => {
  parentPanel.classList.remove('show');
});

document.getElementById('passThreshold').addEventListener('input', e => {
  document.getElementById('passThresholdVal').textContent = e.target.value + '%';
});
document.getElementById('brushSize').addEventListener('input', e => {
  document.getElementById('brushSizeVal').textContent = e.target.value;
});

document.getElementById('btnApply').addEventListener('click', () => {
  settings.passThreshold = parseInt(document.getElementById('passThreshold').value, 10) / 100;
  settings.brushSize = parseInt(document.getElementById('brushSize').value, 10);
  settings.brushColor = document.getElementById('brushColor').value;
  settings.soundOn = document.getElementById('soundOn').checked;
  settings.vibrateOn = document.getElementById('vibrateOn').checked;

  const newLevel = document.getElementById('difficultyLevel').value;
  const rawCustom = document.getElementById('customChars').value.trim();

  currentLevel = newLevel === 'custom' ? 'custom' : parseInt(newLevel, 10);
  customCharList = rawCustom;
  localStorage.setItem('level', currentLevel);
  localStorage.setItem('customChars', customCharList);

  charList = getCharListForLevel(currentLevel, currentLang);
  currentIndex = 0;

  parentPanel.classList.remove('show');
  loadChar(0);
});

/* ---------- 启动 ---------- */
window.addEventListener('load', () => {
  applyI18n();
  resizeCanvas();
  loadChar(0);
});