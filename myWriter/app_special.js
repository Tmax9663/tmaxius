/* ============================================================
跟我学 · 描红乐园
特殊儿童友好版 · 多语言 + 分级 + 贴纸册 + Combo + 完美徽章
【修复】解决坐标不匹配导致的覆盖率低问题
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
    clear: '清除',
    continueDraw: '继续描 ➡️',
    perfect: '完美！',
    great: '真棒！',
    good: '做得好！',
    nextBtn: '下一个 ➡️',
    parentTitle: '家长 / 老师设置',
    passThreshold: '过关阈值',
    brushSize: '笔粗细',
    brushColor: '笔颜色',
    sound: '音效/语音',
    vibrate: '震动',
    difficulty: '难度级别',
    customSetName: '字表名称',
    customChars: '自定义字表（逗号或换行分隔）',
    savedSets: '已保存的字表',
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
    comboText: (n) => `连击 x${n}！`,
    galleryTitle: '🖼️ 我的作品集',
    clearGallery: '清空',
    downloadAll: '📥 下载全部',
    noDrawings: '还没有作品哦，开始画画吧！',
    loadSet: '加载',
    delSet: '删除',
    confirmClear: '确定清空作品集吗？',
    confirmClearCanvas: '确定清除当前画作吗？',
    announceChar: (ch) => `今天学，${ch}`,
    setNamePlaceholder: '例如：小明一年级字表',
  },
  en: {
    todayLearn: 'Today',
    startHere: '💡 Start here',
    prev: 'Prev',
    next: 'Next',
    skip: 'Skip',
    help: 'Help',
    finish: 'Finish',
    clear: 'Clear',
    continueDraw: 'Keep drawing ➡️',
    perfect: 'Perfect!',
    great: 'Great!',
    good: 'Good job!',
    nextBtn: 'Next ➡️',
    parentTitle: 'Parent / Teacher Settings',
    passThreshold: 'Pass threshold',
    brushSize: 'Brush size',
    brushColor: 'Brush color',
    sound: 'Sound/Voice',
    vibrate: 'Vibrate',
    difficulty: 'Difficulty',
    customSetName: 'Set name',
    customChars: 'Custom characters (comma or newline)',
    savedSets: 'Saved sets',
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
    comboText: (n) => `Combo x${n}!`,
    galleryTitle: '🖼️ My Gallery',
    clearGallery: 'Clear',
    downloadAll: '📥 Download All',
    noDrawings: 'No drawings yet. Start drawing!',
    loadSet: 'Load',
    delSet: 'Del',
    confirmClear: 'Clear all gallery items?',
    confirmClearCanvas: 'Clear current drawing?',
    announceChar: (ch) => {
      if (/^[A-Za-z]$/.test(ch)) return `Today's letter: ${ch}`;
      if (/^[0-9]$/.test(ch)) return `Today's number: ${ch}`;
      return `Today's character: ${ch}`;
    },
    setNamePlaceholder: 'e.g. Grade 1 List',
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
    if (typeof text === 'string') {
      if (el.tagName === 'INPUT' && el.type === 'text') {
        el.placeholder = text;
      } else {
        el.textContent = text;
      }
    }
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

/* ---------- 持久化存储 ---------- */
const STORAGE_KEYS = {
  settings: 'miaohong_settings_v2',
  gallery: 'miaohong_gallery',
  savedSets: 'miaohong_saved_sets',
  stickers: 'miaohong_stickers',
};

const DEFAULT_SETTINGS = {
  passThreshold: 0.75,
  brushSize: 48,
  brushColor: '#FF7043',
  soundOn: true,
  vibrateOn: true,
  currentLevel: 1,
  customCharList: '',
  customSetName: '',
};

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.settings));
    if (saved) {
      Object.assign(settings, saved);
      currentLevel = saved.currentLevel || 1;
      customCharList = saved.customCharList || '';
      currentSetName = saved.customSetName || '';
      if (saved.currentLang) currentLang = saved.currentLang;
    }
  } catch (e) {}
}

function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify({
      passThreshold: settings.passThreshold,
      brushSize: settings.brushSize,
      brushColor: settings.brushColor,
      soundOn: settings.soundOn,
      vibrateOn: settings.vibrateOn,
      currentLevel: currentLevel,
      customCharList: customCharList,
      customSetName: currentSetName,
      currentLang: currentLang,
    }));
  } catch (e) {}
}

let savedCharSets = [];
let currentSetName = '';

function loadSavedSets() {
  try {
    savedCharSets = JSON.parse(localStorage.getItem(STORAGE_KEYS.savedSets) || '[]');
  } catch (e) { savedCharSets = []; }
}

function saveSavedSets() {
  try {
    localStorage.setItem(STORAGE_KEYS.savedSets, JSON.stringify(savedCharSets));
  } catch (e) {}
}

function addCharSet(name, chars) {
  const idx = savedCharSets.findIndex(s => s.name === name);
  const entry = { name, chars, lang: currentLang, timestamp: Date.now() };
  if (idx >= 0) {
    savedCharSets[idx] = entry;
  } else {
    savedCharSets.push(entry);
  }
  saveSavedSets();
}

function deleteCharSet(name) {
  savedCharSets = savedCharSets.filter(s => s.name !== name);
  saveSavedSets();
}

function loadGallery() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.gallery) || '[]'); }
  catch { return []; }
}
function saveGallery(arr) {
  try { localStorage.setItem(STORAGE_KEYS.gallery, JSON.stringify(arr)); }
  catch (e) {
    if (arr.length > 10) {
      arr = arr.slice(0, Math.floor(arr.length / 2));
      try { localStorage.setItem(STORAGE_KEYS.gallery, JSON.stringify(arr)); }
      catch (e2) {}
    }
  }
}
function addToGallery(imageData, coveragePct, stars) {
  const entry = {
    char: charList[currentIndex],
    lang: currentLang,
    level: currentLevel,
    timestamp: Date.now(),
    imageData: imageData,
    coverage: coveragePct,
    stars: stars,
  };
  let gallery = loadGallery();
  gallery.unshift(entry);
  if (gallery.length > 40) gallery = gallery.slice(0, 40);
  saveGallery(gallery);
}

function getStickerKey() {
  return `${STORAGE_KEYS.stickers}_${currentLang}_${currentLevel}`;
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

let currentLevel = 1;
let customCharList = '';

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

let charList = [];

const urlParams = new URLSearchParams(location.search);
if (urlParams.get('w')) {
  const raw = decodeURIComponent(urlParams.get('w'));
  const arr = raw.split(/[,，\s]+/).filter(Boolean);
  if (arr.length) charList = arr;
}

const settings = {
  passThreshold: 0.75,
  brushSize: 48,
  brushColor: '#FF7043',
  soundOn: true,
  vibrateOn: true,
};

let currentIndex = 0;
let coverage = 0;
let passed = false;
let starsEarned = 0;
const STARS_PER_CHAR = 3;

let comboCount = 0;
let lastHitTime = 0;
const COMBO_WINDOW = 400;

let autoSkipTimer = null;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// 【关键修复】全局变量存储当前画布的逻辑尺寸 (CSS像素)，确保粒子生成和命中检测使用同一坐标系
let logicalWidth = 0;
let logicalHeight = 0;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  
  // 更新内部分辨率
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  
  // 缩放上下文以匹配 DPR，这样我们可以用 CSS 像素坐标绘图
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // 记录逻辑尺寸
  logicalWidth = rect.width;
  logicalHeight = rect.height;
  
  // 【关键修复】如果已经有字在显示，重新生成粒子以适应新尺寸
  if (charList.length > 0 && particles.length > 0) {
     buildParticlesFromChar(charList[currentIndex]);
  }
  
  redrawStrokes();
}
window.addEventListener('resize', resizeCanvas);

class Particle {
  constructor(x, y, r = 5) {
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
      ctx.fillStyle = '#81C784';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.baseR, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(255,112,67,0.6)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.baseR, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.arc(this.x + this.baseR * 0.2,
              this.y - this.baseR * 0.2,
              this.baseR * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

let particles = [];
let strokes = [];

function buildParticlesFromChar(ch) {
  const textPixel = 40;
  const off = document.createElement('canvas');
  off.width = textPixel;
  off.height = textPixel;
  const octx = off.getContext('2d');
  octx.fillStyle = '#000';
  octx.textAlign = 'center';
  octx.textBaseline = 'middle';
  octx.font = `900 ${textPixel * 0.85}px "PingFang SC", "Microsoft YaHei", "SimHei", "Verdana", sans-serif`;
  octx.fillText(ch, textPixel / 2, textPixel / 2);
  const data = octx.getImageData(0, 0, textPixel, textPixel).data;
  const pts = [];
  for (let y = 0; y < textPixel; y++) {
    for (let x = 0; x < textPixel; x++) {
      const idx = (y * textPixel + x) * 4 + 3;
      if (data[idx] > 128) {
        pts.push({ x: x, y: y });
      }
    }
  }
  
  // 【关键修复】使用逻辑尺寸 (logicalWidth/Height) 而不是每次调用 getBoundingClientRect
  // 这确保了粒子位置与绘制坐标完全一致
  const pad = 30;
  const w = logicalWidth - pad * 2;
  const h = logicalHeight - pad * 2;
  
  // 防止尺寸为负数
  if (w <= 0 || h <= 0) return; 

  const scaleX = w / textPixel;
  const scaleY = h / textPixel;
  const actualScale = Math.min(scaleX, scaleY);
  const offsetX = pad + (w - textPixel * actualScale) / 2;
  const offsetY = pad + (h - textPixel * actualScale) / 2;
  
  // 粒子半径随缩放比例调整，保证视觉大小合适且不重叠过多
  const particleR = Math.max(3, Math.min(6, actualScale * 0.4));
  
  particles = pts.map(p => new Particle(
    offsetX + p.x * actualScale,
    offsetY + p.y * actualScale,
    particleR
  ));
  particles.sort((a, b) => (a.y - b.y) || (a.x - b.x));
}

function redrawStrokes() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const p of particles) p.draw();
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
  // 返回相对于 Canvas 左上角的坐标 (CSS Pixels)
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

function hitParticles(pt, brushR) {
  let newlyHit = 0;
  // 【优化】增加命中容差，确保即使稍微偏离也能算命中
  const tolerance = brushR * 0.5; 
  
  for (const p of particles) {
    if (p.hit) continue;
    const dx = p.x - pt.x;
    const dy = p.y - pt.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // 如果距离小于 (粒子半径 + 笔刷半径的一半)，则判定为命中
    if (dist < (p.baseR + tolerance)) {
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
      captureAndSaveToGallery();
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
    captureAndSaveToGallery();
  }
}

let gallerySavedForCurrentChar = false;

function captureAndSaveToGallery() {
  if (gallerySavedForCurrentChar) return;
  gallerySavedForCurrentChar = true;
  try {
    const imageData = canvas.toDataURL('image/jpeg', 0.55);
    addToGallery(imageData, Math.round(coverage * 100), starsEarned);
  } catch (e) {
    console.warn('Gallery save failed:', e);
  }
}

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
  gallerySavedForCurrentChar = false;
  
  if (autoSkipTimer) {
    clearTimeout(autoSkipTimer);
    autoSkipTimer = null;
  }
  
  renderStars();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 确保在生成粒子前，逻辑尺寸是最新的
  const rect = canvas.getBoundingClientRect();
  logicalWidth = rect.width;
  logicalHeight = rect.height;
  
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
  
  speakCharacter(ch);
}

function nextChar() { loadChar(currentIndex + 1); }
function prevChar() { loadChar(currentIndex - 1); }

const startHint = document.getElementById('startHint');
function showStartHint() {
  if (!particles.length) return;
  const first = particles[0];
  startHint.style.left = first.x + 'px';
  startHint.style.top  = (first.y - 40) + 'px';
  startHint.classList.add('show');
}
function hideStartHint() { startHint.classList.remove('show'); }

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

function speak(text) {
  if (!settings.soundOn) return;
  if ('speechSynthesis' in window) {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = currentLang === 'zh' ? 'zh-CN' : 'en-US';
      u.rate = 0.85;
      u.pitch = 1.4;
      u.volume = 0.9;
      speechSynthesis.speak(u);
    } catch (e) {}
  }
}

function speakCharacter(ch) {
  if (!settings.soundOn) return;
  if (!('speechSynthesis' in window)) return;
  try {
    setTimeout(() => {
      try {
        speechSynthesis.cancel();
        const text = t('announceChar')(ch);
        const u = new SpeechSynthesisUtterance(text);
        u.lang = currentLang === 'zh' ? 'zh-CN' : 'en-US';
        u.rate = 0.8;
        u.pitch = 1.5;
        u.volume = 0.9;
        speechSynthesis.speak(u);
      } catch (e) {}
    }, 150);
  } catch (e) {}
}

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

document.getElementById('btnClear').addEventListener('click', () => {
  if (confirm(t('confirmClearCanvas'))) {
    strokes = [];
    particles.forEach(p => {
      p.hit = false;
      p.burst = 0;
    });
    coverage = 0;
    passed = false;
    starsEarned = 0;
    gallerySavedForCurrentChar = false;
    
    if (autoSkipTimer) {
      clearTimeout(autoSkipTimer);
      autoSkipTimer = null;
    }
    
    redrawStrokes();
    updateProgress();
    renderStars();
    showStartHint();
    btnFinish.style.display = 'none';
    
    const C = 2 * Math.PI * 24;
    const ring = document.getElementById('ringFill');
    ring.setAttribute('stroke-dasharray', `${C} ${C}`);
    ring.setAttribute('stroke-dashoffset', `${C}`);
    document.getElementById('ringText').textContent = '0%';
  }
});

const btnFinish = document.getElementById('btnFinish');
btnFinish.addEventListener('click', () => {
  particles.forEach(p => {
    if (!p.hit) {
      p.hit = true;
      p.burst = 0.001;
    }
  });
  animateBursts();
  coverage = 1;
  starsEarned = STARS_PER_CHAR;
  renderStars();
  updateProgress();
  captureAndSaveToGallery();
  btnFinish.style.display = 'none';
  setTimeout(() => nextChar(), 600);
});

document.getElementById('btnLang').addEventListener('click', () => {
  currentLang = currentLang === 'zh' ? 'en' : 'zh';
  localStorage.setItem('lang', currentLang);
  applyI18n();
  charList = getCharListForLevel(currentLevel, currentLang);
  currentIndex = 0;
  saveSettings();
  loadChar(0);
});

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

const galleryPanel = document.getElementById('galleryPanel');
document.getElementById('btnGallery').addEventListener('click', () => {
  renderGallery();
  galleryPanel.classList.add('show');
});
document.getElementById('btnCloseGallery').addEventListener('click', () => {
  galleryPanel.classList.remove('show');
});
document.getElementById('btnClearGallery').addEventListener('click', () => {
  if (confirm(t('confirmClear'))) {
    saveGallery([]);
    renderGallery();
  }
});

document.getElementById('btnDownloadGallery').addEventListener('click', async () => {
  const gallery = loadGallery();
  if (gallery.length === 0) {
    alert(t('noDrawings'));
    return;
  }
  
  try {
    const zip = new JSZip();
    const folder = zip.folder('myworks');
    
    const dateGroups = {};
    gallery.forEach(item => {
      const date = new Date(item.timestamp);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      if (!dateGroups[dateKey]) dateGroups[dateKey] = [];
      dateGroups[dateKey].push(item);
    });
    
    for (const [dateKey, items] of Object.entries(dateGroups)) {
      const dateFolder = folder.folder(dateKey);
      items.forEach((item, idx) => {
        const date = new Date(item.timestamp);
        const timeStr = `${String(date.getHours()).padStart(2,'0')}-${String(date.getMinutes()).padStart(2,'0')}-${String(date.getSeconds()).padStart(2,'0')}`;
        const filename = `${timeStr}_${item.char}_${item.coverage}pct_${item.stars}stars.jpg`;
        
        const base64Data = item.imageData.split(',')[1];
        dateFolder.file(filename, base64Data, {base64: true});
      });
    }
    
    const content = await zip.generateAsync({type: 'blob'});
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `myworks_${new Date().getTime()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Download failed:', e);
    alert('Download failed. Please try again.');
  }
});

function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  const emptyEl = document.getElementById('galleryEmpty');
  const gallery = loadGallery();
  grid.innerHTML = '';
  
  if (gallery.length === 0) {
    emptyEl.style.display = 'block';
    grid.style.display = 'none';
    return;
  }
  emptyEl.style.display = 'none';
  grid.style.display = 'grid';
  
  gallery.forEach(item => {
    const div = document.createElement('div');
    div.className = 'gallery-item';
    
    const img = document.createElement('img');
    img.src = item.imageData;
    img.alt = item.char;
    
    const charName = document.createElement('div');
    charName.className = 'char-name';
    charName.textContent = item.char;
    
    const stats = document.createElement('div');
    stats.className = 'stats';
    const starsStr = '⭐'.repeat(item.stars || 0) + '☆'.repeat(STARS_PER_CHAR - (item.stars || 0));
    const date = new Date(item.timestamp);
    const dateStr = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2,'0')}`;
    stats.innerHTML = `<span class="pct">${item.coverage}%</span> · <span class="stars-mini">${starsStr}</span><br><span style="color:#aaa;font-size:10px;">${dateStr}</span>`;
    
    div.appendChild(img);
    div.appendChild(charName);
    div.appendChild(stats);
    grid.appendChild(div);
  });
}

const btnHome = document.getElementById('btnHome');
const parentPanel = document.getElementById('parentPanel');

btnHome.addEventListener('click', openParent);

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
  document.getElementById('customSetName').value = currentSetName;
  document.getElementById('customSetName').placeholder = t('setNamePlaceholder');
  renderSavedSets();
}

function renderSavedSets() {
  const list = document.getElementById('savedSetsList');
  list.innerHTML = '';
  if (savedCharSets.length === 0) {
    list.innerHTML = '<div style="color:#999;font-size:12px;padding:8px;text-align:center;">-</div>';
    return;
  }
  savedCharSets.forEach(set => {
    const item = document.createElement('div');
    item.className = 'saved-set-item';
    
    const name = document.createElement('span');
    name.className = 'set-name';
    name.textContent = set.name;
    
    const chars = document.createElement('span');
    chars.className = 'set-chars';
    chars.textContent = set.chars.slice(0, 10).join(' ') + (set.chars.length > 10 ? '...' : '');
    chars.title = set.chars.join(', ');
    
    const loadBtn = document.createElement('button');
    loadBtn.textContent = t('loadSet');
    loadBtn.addEventListener('click', () => {
      customCharList = set.chars;
      currentSetName = set.name;
      currentLevel = 'custom';
      document.getElementById('customChars').value = customCharList;
      document.getElementById('customSetName').value = currentSetName;
      document.getElementById('difficultyLevel').value = 'custom';
    });
    
    const delBtn = document.createElement('button');
    delBtn.className = 'del';
    delBtn.textContent = t('delSet');
    delBtn.addEventListener('click', () => {
      if (confirm(`${t('delSet')} "${set.name}"?`)) {
        deleteCharSet(set.name);
        renderSavedSets();
      }
    });
    
    item.appendChild(name);
    item.appendChild(chars);
    item.appendChild(loadBtn);
    item.appendChild(delBtn);
    list.appendChild(item);
  });
}

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
  const setName = document.getElementById('customSetName').value.trim();

  currentLevel = newLevel === 'custom' ? 'custom' : parseInt(newLevel, 10);
  customCharList = rawCustom;
  currentSetName = setName;
  
  if (setName && customCharList) {
    const arr = customCharList.split(/[,，\s\n]+/).filter(Boolean);
    if (arr.length) {
      addCharSet(setName, arr);
    }
  }

  saveSettings();

  charList = getCharListForLevel(currentLevel, currentLang);
  currentIndex = 0;

  parentPanel.classList.remove('show');
  loadChar(0);
});

window.addEventListener('load', () => {
  loadSavedSets();
  loadSettings();
  
  if (charList.length === 0) {
    charList = getCharListForLevel(currentLevel, currentLang);
  }
  
  applyI18n();
  
  // 初始化时先获取尺寸
  const rect = canvas.getBoundingClientRect();
  logicalWidth = rect.width;
  logicalHeight = rect.height;
  
  resizeCanvas();
  loadChar(0);
});