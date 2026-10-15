/* ============================================================
   跟我学 · 描红乐园
   特殊儿童友好版 · 基于原「造字工作坊」改造
   ============================================================ */

/* ---------- 默认字表（可被 URL ?w= 或家长面板覆盖） ---------- */
let charList = ['A', 'B', 'C', '1', '2', '3', '一', '二', '三'];
const urlParams = new URLSearchParams(location.search);
if (urlParams.get('w')) {
  const raw = decodeURIComponent(urlParams.get('w'));
  const arr = raw.split(/[,，\s]+/).filter(Boolean);
  if (arr.length) charList = arr;
}

/* ---------- 设置（家长面板可改） ---------- */
const settings = {
  passThreshold: 0.75,   // 75% 覆盖即过关
  brushSize: 22,
  brushColor: '#FF7043',
  soundOn: true,
  vibrateOn: true,
};

/* ---------- 状态 ---------- */
let currentIndex = 0;
let coverage = 0;          // 0~1
let passed = false;
let starsEarned = 0;       // 本字已收集星星数（0~3）
const STARS_PER_CHAR = 3;  // 每个字最多 3 颗星

/* ---------- 画布 ---------- */
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

/* 让 canvas 内部分辨率与 CSS 尺寸一致，避免模糊 */
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

/* ---------- 粒子（描红点） ---------- */
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.baseR = 9;
    this.r = 9;
    this.hit = false;
    this.burst = 0;      // 命中后的爆裂动画进度 0~1
  }
  draw() {
    if (this.burst > 0) {
      // 命中后：扩散 + 淡出
      const t = this.burst;
      const rr = this.baseR * (1 + t * 1.6);
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = '#FFD54F';
      ctx.beginPath();
      ctx.arc(this.x, this.y, rr, 0, Math.PI * 2);
      ctx.fill();

      // 小星星飞散
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
      // 已覆盖：显示为柔和填充
      ctx.fillStyle = '#C8E6C9';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.baseR * 0.9, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 未覆盖：空心大圆点，深色高对比
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
let strokes = [];   // 用户笔画历史，用于重绘

/* ---------- 文字 → 粒子 ---------- */
function buildParticlesFromChar(ch) {
  const size = 320;                    // 内部采样尺寸
  const off = document.createElement('canvas');
  off.width = size; off.height = size;
  const octx = off.getContext('2d');

  // 无衬线粗体，字大且居中
  octx.fillStyle = '#000';
  octx.textAlign = 'center';
  octx.textBaseline = 'middle';
  octx.font = `900 ${size * 0.78}px Verdana, "PingFang SC", "Microsoft YaHei", sans-serif`;
  octx.fillText(ch, size / 2, size / 2 + size * 0.03);

  const data = octx.getImageData(0, 0, size, size).data;

  // 网格采样：每 grid 像素取一个点
  const grid = 34;
  const pts = [];
  for (let y = 0; y < size; y += grid) {
    for (let x = 0; x < size; x += grid) {
      const idx = (y * size + x) * 4 + 3;
      if (data[idx] > 128) {
        // 归一化到画布坐标
        pts.push({
          nx: x / size,
          ny: y / size,
        });
      }
    }
  }

  // 缩放到画布可视区域（留边距）
  const rect = canvas.getBoundingClientRect();
  const pad = 60;
  const w = rect.width - pad * 2;
  const h = rect.height - pad * 2;

  particles = pts.map(p => new Particle(pad + p.nx * w, pad + p.ny * h));
  // 对起点做排序：优先左上 → 右下，让"从哪开始"更自然
  particles.sort((a, b) => (a.y - b.y) || (a.x - b.x));
}

/* ---------- 重绘 ---------- */
function redrawStrokes() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 先画所有已完成笔画
  for (const s of strokes) {
    drawStroke(s);
  }
  // 再画粒子（未命中的点覆盖在笔画上方，视觉上更醒目）
  for (const p of particles) p.draw();
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

/* ---------- 当前笔画 ---------- */
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
  if (passed) return;   // 已过关的字不再让乱画
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

/* ---------- 命中检测 ---------- */
function hitParticles(pt, brushR) {
  let newlyHit = 0;
  for (const p of particles) {
    if (p.hit) continue;
    const dx = p.x - pt.x;
    const dy = p.y - pt.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // 笔刷中心进入点的内圈即算命中（宽容）
    if (dist < p.baseR + brushR * 0.35) {
      p.hit = true;
      p.burst = 0.001;   // 触发爆裂动画
      newlyHit++;
    }
  }
  if (newlyHit > 0) {
    playDing();
    vibrate(20);
    updateProgress();
  }
  // 更新爆裂动画
  animateBursts();
}

/* 用 requestAnimationFrame 推进爆裂动画 */
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

/* ---------- 进度 & 过关 ---------- */
function updateProgress() {
  const total = particles.length || 1;
  const hit = particles.filter(p => p.hit).length;
  coverage = hit / total;
  const pct = Math.round(coverage * 100);

  // 更新光环
  const C = 2 * Math.PI * 24; // r=24
  const ring = document.getElementById('ringFill');
  ring.setAttribute('stroke-dasharray', `${C} ${C}`);
  ring.setAttribute('stroke-dashoffset', `${C * (1 - coverage)}`);
  document.getElementById('ringText').textContent = pct + '%';

  // 星星：每达到 1/3 阈值给一颗
  const newStars = Math.min(STARS_PER_CHAR, Math.floor(coverage / (settings.passThreshold / STARS_PER_CHAR)));
  if (newStars > starsEarned) {
    starsEarned = newStars;
    renderStars(true);
    // 每得一颗星给一次小奖励音
    if (newStars > 0) {
      playDing(880);
      vibrate([20, 30, 20]);
    }
  }
}

function renderStars(animate) {
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
    // 把剩余未命中的点自动补全（视觉上收尾）
    particles.forEach(p => {
      if (!p.hit) {
        p.hit = true;
        p.burst = 0.001;
      }
    });
    animateBursts();
    updateProgress();
    showCelebrate();
  }
}

/* ---------- 庆祝层 ---------- */
const celebrate = document.getElementById('celebrate');
function showCelebrate() {
  celebrate.classList.add('show');
  playCheer();
  vibrate([60, 40, 60]);
  // 自动 2.6 秒后进下一字（也可点按钮）
  clearTimeout(showCelebrate._t);
  showCelebrate._t = setTimeout(() => {
    celebrate.classList.remove('show');
    nextChar();
  }, 2600);
}
document.getElementById('btnCelebrateNext').addEventListener('click', () => {
  clearTimeout(showCelebrate._t);
  celebrate.classList.remove('show');
  nextChar();
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
  renderStars(false);

  // 清空 canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 构建粒子
  buildParticlesFromChar(ch);
  redrawStrokes();
  updateProgress();

  // 起点提示
  showStartHint();

  // 重置光环
  const C = 2 * Math.PI * 24;
  const ring = document.getElementById('ringFill');
  ring.setAttribute('stroke-dasharray', `${C} ${C}`);
  ring.setAttribute('stroke-dashoffset', `${C}`);
  document.getElementById('ringText').textContent = '0%';
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
function hideStartHint() {
  startHint.classList.remove('show');
}

/* ---------- 音效（WebAudio，无需素材） ---------- */
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
  notes.forEach((f, i) => {
    setTimeout(() => playDing(f), i * 120);
  });
}
function vibrate(p) {
  if (!settings.vibrateOn) return;
  if (navigator.vibrate) navigator.vibrate(p);
}

/* ---------- 事件绑定 ---------- */
canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mousemove', moveDraw);
window.addEventListener('mouseup', endDraw);

canvas.addEventListener('touchstart', startDraw, { passive: false });
canvas.addEventListener('touchmove', moveDraw, { passive: false });
canvas.addEventListener('touchend', endDraw);
canvas.addEventListener('touchcancel', endDraw);

/* ---------- 底栏按钮 ---------- */
document.getElementById('btnNext').addEventListener('click', nextChar);
document.getElementById('btnPrev').addEventListener('click', prevChar);
document.getElementById('btnSkip').addEventListener('click', nextChar);

/* ---------- 提示按钮：闪一下起点 ---------- */
document.getElementById('btnHelp').addEventListener('click', () => {
  showStartHint();
  playDing(880);
});

/* ---------- 家长面板：长按 🏠 3 秒 ---------- */
const btnHome = document.getElementById('btnHome');
const parentPanel = document.getElementById('parentPanel');
let homeTimer = null;

function openParent() {
  parentPanel.classList.add('show');
  // 同步当前设置
  document.getElementById('passThreshold').value = settings.passThreshold * 100;
  document.getElementById('passThresholdVal').textContent = Math.round(settings.passThreshold * 100) + '%';
  document.getElementById('brushSize').value = settings.brushSize;
  document.getElementById('brushSizeVal').textContent = settings.brushSize;
  document.getElementById('brushColor').value = settings.brushColor;
  document.getElementById('soundOn').checked = settings.soundOn;
  document.getElementById('vibrateOn').checked = settings.vibrateOn;
  document.getElementById('customChars').value = charList.join(',');
}

function bindLongPress(el, onLong) {
  let t = null;
  const start = () => { t = setTimeout(onLong, 3000); };
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

/* 实时预览滑块 */
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

  const raw = document.getElementById('customChars').value.trim();
  if (raw) {
    const arr = raw.split(/[,，\s]+/).filter(Boolean);
    if (arr.length) {
      charList = arr;
      currentIndex = 0;
    }
  }
  parentPanel.classList.remove('show');
  loadChar(0);
});

/* ---------- 启动 ---------- */
window.addEventListener('load', () => {
  resizeCanvas();
  loadChar(0);
});