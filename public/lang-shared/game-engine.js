import { buildGameHTML } from './game-template.js';

export function initGame(LANG) {

const WORDS = LANG.words;
const CATS = LANG.categories;
const ALPHABET = LANG.alphabet;
const SENTENCES = LANG.sentences;

const STAGE_SIZE = 10;
const TOTAL_STAGES = Math.ceil(WORDS.length / STAGE_SIZE);
const STAGES_PER_PAGE = 10;
const TOTAL_PAGES = Math.ceil(TOTAL_STAGES / STAGES_PER_PAGE);

const STAGE_COLORS = [
  'linear-gradient(135deg,#dbeafe,#bfdbfe)',
  'linear-gradient(135deg,#d1fae5,#a7f3d0)',
  'linear-gradient(135deg,#ede9fe,#ddd6fe)',
  'linear-gradient(135deg,#ffedd5,#fed7aa)',
  'linear-gradient(135deg,#ccfbf1,#99f6e4)',
  'linear-gradient(135deg,#fce7f3,#fbcfe8)',
  'linear-gradient(135deg,#fef9c3,#fef08a)',
  'linear-gradient(135deg,#e0e7ff,#c7d2fe)',
  'linear-gradient(135deg,#ffe4e6,#fecdd3)',
  'linear-gradient(135deg,#ecfccb,#d9f99d)'
];
const LETTER_COLORS = ['#ef4444','#3b82f6','#22c55e','#f97316','#8b5cf6','#ec4899'];
const LETTER_BGS = ['#fef2f2','#eff6ff','#f0fdf4','#fff7ed','#f5f3ff','#fdf2f8','#fefce8','#f0fdfa','#fef2f2','#eff6ff','#f0fdf4','#fff7ed','#f5f3ff','#fdf2f8','#fefce8','#f0fdfa','#fef2f2','#eff6ff','#f0fdf4','#fff7ed','#f5f3ff','#fdf2f8','#fefce8','#f0fdfa','#fef2f2','#eff6ff','#f0fdf4','#fff7ed','#f5f3ff','#fdf2f8','#fefce8','#f0fdfa','#fef2f2'];
const CHEERS = ['!נָכוֹן','!יָפֶה','!מְצוּיָן','!מוּשְׁלָם','!כּוֹל הַכָּבוֹד'];

let FREE_STAGES = 50;
let isPremium = false;
let hasShownLoginPrompt = false;
let currentPage = 0;
let currentStage = 0;
let learnIndex = 0;
let quizIndex = 0;
let quizCorrect = 0;
let quizAnswered = false;
let stageWords = [];
let shuffledQuiz = [];
let isMixMode = false;
let isReverse = false;
let sentenceQuizData = [], sentenceIndex = 0, sentenceCorrect = 0, sentenceAnswered = false;
let abcQuizLetters = [], abcQuizIndex = 0, abcQuizCorrect = 0, abcQuizAnswered = false;
let abcQuizCurrentSound = '';

// --- Inject HTML ---
document.getElementById('game-root').innerHTML = buildGameHTML(LANG);

// --- Expose globals needed by inline onclick handlers ---
window.currentStage = currentStage;
Object.defineProperty(window, 'currentStage', {
  get: () => currentStage,
  set: (v) => { currentStage = v; }
});
Object.defineProperty(window, 'isReverse', {
  get: () => isReverse,
  set: (v) => { isReverse = v; }
});

// --- localStorage ---
const PROMO_KEY = LANG.storagePrefix + '_promo_stages';
const PROGRESS_KEY = LANG.storagePrefix + '_game_progress';

function loadPromoLevel() {
  try { return parseInt(localStorage.getItem(PROMO_KEY)) || 50; } catch { return 50; }
}
function savePromoLevel(n) {
  localStorage.setItem(PROMO_KEY, n.toString());
  FREE_STAGES = n;
}
FREE_STAGES = loadPromoLevel();

function migrateProgress(progress) {
  let migrated = false;
  for (const key of Object.keys(progress)) {
    const v = progress[key];
    if (typeof v === 'number') {
      progress[key] = { fwd: v, rev: 0 };
      migrated = true;
    } else if (v && (v[LANG.storagePrefix] !== undefined) && v.fwd === undefined) {
      progress[key] = { fwd: v[LANG.storagePrefix] || 0, rev: v.heb || 0 };
      migrated = true;
    } else if (v && v.heb !== undefined && v.rev === undefined) {
      progress[key] = { fwd: v.fwd || 0, rev: v.heb || 0 };
      migrated = true;
    }
  }
  if (migrated) localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  return progress;
}

function loadProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
    return migrateProgress(raw);
  } catch { return {}; }
}
function saveProgress(data) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
}

function getStageTotal(progress, i) {
  const s = progress[i];
  if (!s) return 0;
  if (typeof s === 'number') return s;
  return (s.fwd || 0) + (s.rev || 0);
}

function isStageUnlocked(progress, i) {
  if (i <= 1) return true;
  return getStageTotal(progress, i - 1) >= 7;
}

// --- Promo / Lock ---
window.redeemPromo = function() {
  const input = document.getElementById('promoInput');
  const msg = document.getElementById('promoMsg');
  const code = input.value.trim();
  msg.style.display = '';
  if (code === 'free10!') {
    savePromoLevel(Math.max(FREE_STAGES, 10));
    msg.style.color = 'var(--success)';
    msg.textContent = '10 שלבים ראשונים נפתחו בהצלחה!';
    setTimeout(() => { goHome(); }, 1500);
  } else if (code === 'free20@') {
    savePromoLevel(Math.max(FREE_STAGES, 20));
    msg.style.color = 'var(--success)';
    msg.textContent = '20 שלבים ראשונים נפתחו בהצלחה!';
    setTimeout(() => { goHome(); }, 1500);
  } else if (code === 'freeall*') {
    savePromoLevel(100);
    isPremium = true;
    msg.style.color = 'var(--success)';
    msg.textContent = 'כל 100 השלבים נפתחו בהצלחה!';
    setTimeout(() => { goHome(); }, 1500);
  } else {
    msg.style.color = 'var(--danger)';
    msg.textContent = 'קוד לא תקין';
    input.value = '';
  }
};

window.showLockMsg = function(stageNum) {
  const msg = `כדי לפתוח שלב ${stageNum + 1}, צריך לצבור לפחות 7 נקודות במבחנים של שלב ${stageNum}`;
  document.getElementById('lockMsgText').textContent = msg;
  document.getElementById('lockMsgOverlay').classList.add('visible');
  sayNative(msg);
};
window.closeLockMsg = function() {
  document.getElementById('lockMsgOverlay').classList.remove('visible');
};

window.showLoginOverlay = function() {
  document.getElementById('loginOverlay').classList.add('visible');
};
window.dismissLoginOverlay = function() {
  document.getElementById('loginOverlay').classList.remove('visible');
};
window.doOverlayLogin = async function() {
  if (window._loginWithGoogle) {
    const user = await window._loginWithGoogle();
    if (user) window.dismissLoginOverlay();
  }
};

// --- Audio ---
let audioCtx;
function getCtx() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); return audioCtx; }
function playClick() {
  const c = getCtx(), t = c.currentTime, o = c.createOscillator(), g = c.createGain();
  o.type = 'sine'; o.frequency.value = 600; g.gain.setValueAtTime(.15, t); g.gain.exponentialRampToValueAtTime(.001, t + .08);
  o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + .08);
}
function playCorrect() {
  const c = getCtx(), t = c.currentTime;
  [523, 659].forEach((f, i) => { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(.2, t + i * .12); g.gain.exponentialRampToValueAtTime(.001, t + i * .12 + .15); o.connect(g); g.connect(c.destination); o.start(t + i * .12); o.stop(t + i * .12 + .15); });
}
function playWrong() {
  const c = getCtx(), t = c.currentTime, o = c.createOscillator(), g = c.createGain();
  o.type = 'square'; o.frequency.value = 200; g.gain.setValueAtTime(.12, t); g.gain.exponentialRampToValueAtTime(.001, t + .25);
  o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + .25);
}

// --- TTS ---
window.sayWord = function(text) {
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text || document.getElementById('wordForeign').textContent);
  u.lang = LANG.ttsLang; u.rate = 0.85;
  speechSynthesis.speak(u);
};
window.sayNative = function(text) {
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LANG.nativeLang.ttsLang; u.rate = 0.85;
  speechSynthesis.speak(u);
};
const sayWord = window.sayWord;
const sayNative = window.sayNative;

// --- Confetti ---
function miniConfetti(x, y) {
  const c = document.getElementById('confetti'); c.width = innerWidth; c.height = innerHeight;
  const ctx = c.getContext('2d');
  const P = [], cols = ['#22c55e', '#4f6df5', '#eab308', '#ec4899'];
  for (let i = 0; i < 25; i++) P.push({ x: x || c.width / 2, y: y || c.height / 2, vx: (Math.random() - .5) * 10, vy: Math.random() * -10 - 2, s: Math.random() * 5 + 3, c: cols[Math.floor(Math.random() * cols.length)], l: 1 });
  let f = 0; (function d() { ctx.clearRect(0, 0, c.width, c.height); let a = false; P.forEach(p => { if (p.l <= 0) return; a = true; p.x += p.vx; p.y += p.vy; p.vy += .5; p.l -= .025; ctx.globalAlpha = p.l; ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, p.s, p.s * .6); }); ctx.globalAlpha = 1; if (a && f < 80) { f++; requestAnimationFrame(d); } else ctx.clearRect(0, 0, c.width, c.height); })();
}

function bigConfetti() {
  const c = document.getElementById('confetti'); c.width = innerWidth; c.height = innerHeight;
  const ctx = c.getContext('2d');
  const P = [], cols = ['#4f6df5', '#22c55e', '#f97316', '#ef4444', '#eab308', '#8b5cf6', '#ec4899'];
  for (let i = 0; i < 120; i++) P.push({ x: c.width / 2 + (Math.random() - .5) * 200, y: c.height / 2, vx: (Math.random() - .5) * 16, vy: Math.random() * -18 - 4, s: Math.random() * 8 + 4, c: cols[Math.floor(Math.random() * cols.length)], l: 1 });
  let f = 0; (function d() { ctx.clearRect(0, 0, c.width, c.height); let a = false; P.forEach(p => { if (p.l <= 0) return; a = true; p.x += p.vx; p.y += p.vy; p.vy += .4; p.l -= .012; ctx.globalAlpha = p.l; ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, p.s, p.s * .6); }); ctx.globalAlpha = 1; if (a && f < 200) { f++; requestAnimationFrame(d); } else ctx.clearRect(0, 0, c.width, c.height); })();
}

// --- Screen Navigation ---
let _showScreen = function(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  el.classList.add('active');
  el.scrollTop = 0;
  if (id === 'alphabet') buildAlphabetGrid();
};
window.showScreen = function(id) { _showScreen(id); };

function goHome() {
  _showScreen('home');
  renderStageGrid();
}
window.goHome = goHome;

window.goToNextPage = function() {
  if (currentPage < TOTAL_PAGES - 1) currentPage++;
  goHome();
};

// --- Alphabet ---
const ABC_PROGRESS_KEY = LANG.storagePrefix + '_abc_progress';
let isAbcReverse = false;

function loadAbcProgress() {
  try { return JSON.parse(localStorage.getItem(ABC_PROGRESS_KEY)) || { fwd: 0, rev: 0 }; }
  catch { return { fwd: 0, rev: 0 }; }
}
function saveAbcProgress(data) {
  localStorage.setItem(ABC_PROGRESS_KEY, JSON.stringify(data));
}

function showAbcMenu() {
  const p = loadAbcProgress();
  const fwd = p.fwd || 0, rev = p.rev || 0;
  const total = ALPHABET.length;
  document.getElementById('abcScoreFwd').textContent = fwd > 0 ? `(${fwd}/${total})` : '';
  document.getElementById('abcScoreRev').textContent = rev > 0 ? `(${rev}/${total})` : '';
  document.getElementById('abcTotalScore').textContent = `${fwd + rev}/${total * 2}`;
  _showScreen('abcChoice');
}
window.showAbcMenu = showAbcMenu;

window.showAbcLearn = function() {
  _showScreen('alphabet');
  buildAlphabetGrid();
};

function buildAlphabetGrid() {
  const grid = document.getElementById('letterGrid');
  if (grid.children.length > 0) return;
  ALPHABET.forEach((l, i) => {
    const color = LETTER_COLORS[i % LETTER_COLORS.length];
    const card = document.createElement('div');
    card.className = 'letter-card';
    card.style.background = LETTER_BGS[i] || LETTER_BGS[0];
    card.innerHTML = `<div class="letter-big" style="color:${color}">${l.upper}</div><div class="letter-small">${l.lower}</div><div class="letter-native">${l.native}</div><div class="letter-emoji">${l.em}</div><div class="letter-word">${l.word}</div><div class="letter-native">${l.wordNative}</div>`;
    card.onclick = () => {
      document.querySelectorAll('.letter-card').forEach(c => c.classList.remove('active-letter'));
      card.classList.add('active-letter');
      playClick();
      sayWord(l.sound);
      setTimeout(() => sayWord(l.word), 1000);
      setTimeout(() => sayNative(l.wordNative), 2200);
    };
    grid.appendChild(card);
  });
}

window.showAbcDictionary = function() {
  const list = document.getElementById('abcDictList');
  list.innerHTML = '';
  ALPHABET.forEach(l => {
    const row = document.createElement('div');
    row.className = 'dict-row';
    row.innerHTML = `<div class="dict-emoji">${l.em}</div><div class="dict-words"><div class="dict-foreign" style="font-size:1.8rem">${l.upper} ${l.lower}</div><div class="dict-native">${l.native} — ${l.word} (${l.wordNative})</div></div>`;
    const sp = document.createElement('button');
    sp.className = 'dict-speak';
    sp.textContent = '🔊';
    sp.onclick = () => { sayWord(l.sound); setTimeout(() => sayWord(l.word), 1000); setTimeout(() => sayNative(l.wordNative), 2200); };
    row.appendChild(sp);
    list.appendChild(row);
  });
  _showScreen('abcDictionary');
};

window.startAbcQuiz = function(reverse) {
  isAbcReverse = !!reverse;
  abcQuizLetters = [...ALPHABET].sort(() => Math.random() - .5);
  abcQuizIndex = 0;
  abcQuizCorrect = 0;
  _showScreen('abcQuiz');
  showAbcQuestion();
};

function showAbcQuestion() {
  abcQuizAnswered = false;
  document.getElementById('abcCorrection').style.display = 'none';
  const letter = abcQuizLetters[abcQuizIndex];
  abcQuizCurrentSound = letter.sound;
  window.abcQuizCurrentSound = letter.sound;

  const questionEl = document.getElementById('abcQuizLetter');
  if (isAbcReverse) {
    questionEl.textContent = letter.native;
    questionEl.style.direction = LANG.nativeLang.dir;
    questionEl.style.fontSize = '2.5rem';
  } else {
    questionEl.textContent = letter.upper;
    questionEl.style.direction = 'ltr';
    questionEl.style.fontSize = '4rem';
  }

  document.getElementById('abcQuizCounter').textContent = `${abcQuizIndex + 1} / ${abcQuizLetters.length}`;
  document.getElementById('abcQuizProgress').style.width = `${((abcQuizIndex + 1) / abcQuizLetters.length) * 100}%`;
  document.getElementById('abcQuizScore').textContent = `✅ ${abcQuizCorrect} / ${abcQuizIndex}`;

  const others = ALPHABET.filter(l => l.upper !== letter.upper).sort(() => Math.random() - .5).slice(0, 3);
  const options = [letter, ...others].sort(() => Math.random() - .5);

  const container = document.getElementById('abcQuizOptions');
  container.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quiz-opt';
    if (isAbcReverse) {
      btn.textContent = opt.upper;
      btn.style.direction = 'ltr';
      btn.style.fontSize = '1.8rem';
    } else {
      btn.textContent = opt.native;
      btn.style.direction = LANG.nativeLang.dir;
    }
    btn.onclick = () => pickAbcAnswer(btn, opt.upper === letter.upper, letter);
    container.appendChild(btn);
  });
}

function pickAbcAnswer(btn, isCorrect, letter) {
  if (abcQuizAnswered) return;
  abcQuizAnswered = true;
  document.querySelectorAll('#abcQuizOptions .quiz-opt').forEach(b => b.classList.add('disabled'));

  const correctText = isAbcReverse ? letter.upper : letter.native;

  if (isCorrect) {
    btn.classList.add('correct');
    abcQuizCorrect++;
    playCorrect();
    const r = btn.getBoundingClientRect();
    miniConfetti(r.left + r.width / 2, r.top + r.height / 2);
  } else {
    btn.classList.add('wrong');
    playWrong();
    document.querySelectorAll('#abcQuizOptions .quiz-opt').forEach(b => {
      if (b.textContent === correctText) b.classList.add('show-correct');
    });
    const cor = document.getElementById('abcCorrection');
    cor.style.display = '';
    cor.innerHTML = `<span style="font-size:2rem;font-weight:900;color:var(--primary)">${letter.upper}</span> <span style="direction:${LANG.nativeLang.dir}">${letter.native}</span>`;
    sayWord(letter.sound);
  }
  document.getElementById('abcQuizScore').textContent = `✅ ${abcQuizCorrect} / ${abcQuizIndex + 1}`;

  setTimeout(() => {
    if (abcQuizIndex < abcQuizLetters.length - 1) {
      abcQuizIndex++;
      showAbcQuestion();
    } else {
      showAbcResults();
    }
  }, isCorrect ? 1000 : 2500);
}

function showAbcResults() {
  const p = loadAbcProgress();
  const key = isAbcReverse ? 'rev' : 'fwd';
  if (abcQuizCorrect > (p[key] || 0)) {
    p[key] = abcQuizCorrect;
    saveAbcProgress(p);
  }

  const pct = abcQuizCorrect / abcQuizLetters.length;
  let stars, msg;
  if (pct === 1) { stars = '⭐⭐⭐'; msg = '!מושלם! כל הכבוד'; }
  else if (pct >= 0.8) { stars = '⭐⭐'; msg = '!עבודה מצוינת'; }
  else if (pct >= 0.5) { stars = '⭐'; msg = 'לא רע, נסה שוב!'; }
  else { stars = ''; msg = 'בוא ננסה ללמוד שוב'; }
  document.getElementById('abcResultStars').textContent = stars;
  document.getElementById('abcResultScore').textContent = `${abcQuizCorrect} / ${abcQuizLetters.length}`;
  document.getElementById('abcResultScore').style.color = pct >= 0.8 ? 'var(--success)' : pct >= 0.5 ? 'var(--primary)' : 'var(--danger)';
  document.getElementById('abcResultMsg').textContent = msg;
  _showScreen('abcResults');
  if (pct >= 0.8) bigConfetti();
}

// --- Stage Grid ---
window.changePage = function(dir) {
  currentPage = Math.max(0, Math.min(TOTAL_PAGES - 1, currentPage + dir));
  renderStageGrid();
};

function renderStageGrid() {
  const grid = document.getElementById('stageGrid');
  const progress = loadProgress();
  let totalPts = 0, completed = 0;
  for (let i = 0; i < TOTAL_STAGES; i++) {
    const t = getStageTotal(progress, i);
    if (t > 0) { totalPts += t; completed++; }
  }
  grid.innerHTML = '';
  const start = currentPage * STAGES_PER_PAGE;
  const end = Math.min(start + STAGES_PER_PAGE, TOTAL_STAGES);
  for (let i = start; i < end; i++) {
    const btn = document.createElement('button');
    btn.className = 'stage-btn';
    const total = getStageTotal(progress, i);
    if (total > 0) {
      btn.classList.add('completed');
      if (total === STAGE_SIZE * 2) btn.classList.add('perfect');
    }
    const cat = CATS[i] || '';
    const catParts = cat.match(/^(\S+)\s(.+)$/);
    const catHtml = catParts ? `<span class="stage-emoji">${catParts[1]}</span> ${catParts[2]}` : cat;
    btn.innerHTML = `<span class="stage-num">${i + 1}</span><span class="stage-cat">${catHtml}</span>` +
      (total > 0 ? `<span class="stage-score">${total}/${STAGE_SIZE * 2}</span>` : '');
    if (i >= FREE_STAGES && !isPremium) {
      btn.classList.add('locked');
      const overlay = document.createElement('div');
      overlay.className = 'locked-overlay';
      overlay.textContent = '🔒';
      btn.appendChild(overlay);
      btn.onclick = () => _showScreen('paywall');
    } else {
      btn.onclick = () => startLearn(i);
    }
    if (total === 0) {
      const pageIdx = Math.floor(i / STAGES_PER_PAGE);
      btn.style.background = STAGE_COLORS[pageIdx] || STAGE_COLORS[0];
    }
    grid.appendChild(btn);
  }
  document.getElementById('prevPage').disabled = currentPage === 0;
  document.getElementById('nextPage').disabled = currentPage === TOTAL_PAGES - 1;
  document.getElementById('prevPageBottom').disabled = currentPage === 0;
  document.getElementById('nextPageBottom').disabled = currentPage === TOTAL_PAGES - 1;
  const dots = document.getElementById('pageDots');
  const dotsBottom = document.getElementById('pageDotsBottom');
  dots.innerHTML = '';
  dotsBottom.innerHTML = '';
  for (let p = 0; p < TOTAL_PAGES; p++) {
    const d = document.createElement('button');
    d.className = 'page-dot' + (p === currentPage ? ' active' : '');
    d.onclick = () => { currentPage = p; renderStageGrid(); };
    dots.appendChild(d);
    const d2 = d.cloneNode(true);
    d2.onclick = () => { currentPage = p; renderStageGrid(); };
    dotsBottom.appendChild(d2);
  }
  document.getElementById('totalScore').textContent = `⭐ ${totalPts} נקודות`;
  const unlockedWords = completed * STAGE_SIZE;
  document.getElementById('progressBadge').textContent = `📖 ${unlockedWords}/${WORDS.length} מילים`;
  const pageStart = currentPage * STAGES_PER_PAGE;
  const pageEnd = Math.min(pageStart + STAGES_PER_PAGE, TOTAL_STAGES);
  const mb = document.getElementById('mixBtn');
  mb.style.display = '';
  mb.textContent = `🔀 מִבְחָן מְעוֹרְבָּב: שלבים ${pageStart + 1}-${pageEnd}`;
  document.getElementById('abcBtn').style.display = currentPage === 0 ? '' : 'none';
  const sb = document.getElementById('sentenceBtn');
  if (SENTENCES[currentPage]) {
    sb.style.display = '';
    sb.textContent = `📝 מִבְחָן מִשְׁפָּטִים: שלבים ${pageStart + 1}-${pageEnd}`;
  } else { sb.style.display = 'none'; }
  document.querySelectorAll('.ad-container').forEach(el => {
    el.style.display = isPremium ? 'none' : '';
  });
}

window.resetProgress = function() {
  if (confirm('?האם אתה בטוח שברצונך למחוק את כל ההתקדמות')) {
    localStorage.removeItem(PROGRESS_KEY);
    goHome();
  }
};

window.startPageMixQuiz = function() {
  const pool = [];
  const start = currentPage * STAGES_PER_PAGE;
  const end = Math.min(start + STAGES_PER_PAGE, TOTAL_STAGES);
  for (let i = start; i < end; i++) pool.push(...WORDS.slice(i * STAGE_SIZE, i * STAGE_SIZE + STAGE_SIZE));
  if (pool.length < 10) return;
  isMixMode = true; isReverse = Math.random() > 0.5;
  stageWords = pool.sort(() => Math.random() - .5).slice(0, 10);
  quizIndex = 0; quizCorrect = 0;
  shuffledQuiz = [...stageWords];
  _showScreen('quiz'); showQuizQuestion();
};

// --- Learn ---
function startLearn(stage) {
  currentStage = stage; isMixMode = false;
  stageWords = WORDS.slice(stage * STAGE_SIZE, stage * STAGE_SIZE + STAGE_SIZE);
  document.getElementById('stageMenuTitle').textContent = `שָׁלָב ${stage + 1}`;
  document.getElementById('stageMenuCat').textContent = CATS[stage] || '';
  const progress = loadProgress();
  const s = progress[stage] || { fwd: 0, rev: 0 };
  const fwd = s.fwd || 0, rev = s.rev || 0;
  document.getElementById('scoreFwd').textContent = fwd > 0 ? `(${fwd}/${STAGE_SIZE})` : '';
  document.getElementById('scoreRev').textContent = rev > 0 ? `(${rev}/${STAGE_SIZE})` : '';
  document.getElementById('stageTotalScore').textContent = `${fwd + rev}/${STAGE_SIZE * 2}`;
  _showScreen('choice');
  if (window._trackEvent) window._trackEvent('stage_open', { stage: stage + 1 });
}
window.startLearn = startLearn;

window.startLearnGo = function() {
  learnIndex = 0;
  _showScreen('learn');
  showLearnWord();
  if (window._trackEvent) window._trackEvent('learn_start', { stage: currentStage + 1 });
};

function showLearnWord() {
  const w = stageWords[learnIndex];
  document.getElementById('wordForeign').textContent = w.foreign;
  document.getElementById('wordNative').textContent = '';
  document.getElementById('wordNative').classList.remove('visible');
  const icon = document.getElementById('wordIcon');
  icon.textContent = '';
  icon.classList.remove('visible');
  document.getElementById('tapHint').style.display = '';
  document.getElementById('learnCounter').textContent = `${learnIndex + 1} / ${stageWords.length}`;
  document.getElementById('learnProgress').style.width = `${((learnIndex + 1) / stageWords.length) * 100}%`;
  document.getElementById('nextWordBtn').textContent = learnIndex < stageWords.length - 1 ? 'הבא ➡️' : 'סיום ✅';
  document.getElementById('prevWordBtn').style.display = learnIndex > 0 ? '' : 'none';
}

window.revealTranslation = function() {
  const w = stageWords[learnIndex];
  document.getElementById('wordNative').textContent = w.native;
  document.getElementById('wordIcon').textContent = w.em || '';
  document.getElementById('wordNative').classList.add('visible');
  document.getElementById('wordIcon').classList.add('visible');
  document.getElementById('tapHint').style.display = 'none';
  sayWord(w.foreign);
  setTimeout(() => sayNative(w.native), 1200);
};

window.prevWord = function() {
  if (learnIndex > 0) { playClick(); learnIndex--; showLearnWord(); }
};

window.nextWord = function() {
  playClick();
  if (learnIndex < stageWords.length - 1) { learnIndex++; showLearnWord(); }
  else { _showScreen('choice'); }
};

// --- Quiz ---
function getSmartDistractors(w) {
  const sameStage = stageWords.filter(x => x.foreign !== w.foreign);
  const stageIdx = WORDS.indexOf(stageWords[0]);
  const pageStart = Math.floor(stageIdx / (STAGE_SIZE * 10)) * STAGE_SIZE * 10;
  const pageEnd = Math.min(pageStart + STAGE_SIZE * 10, WORDS.length);
  const sameTopic = WORDS.slice(pageStart, pageEnd).filter(x => x.foreign !== w.foreign && !stageWords.includes(x));
  const fromStage = sameStage.sort(() => Math.random() - .5).slice(0, 2);
  const fromTopic = sameTopic.sort(() => Math.random() - .5).slice(0, 1);
  const result = [...fromStage, ...fromTopic];
  while (result.length < 3) {
    const fallback = WORDS.filter(x => x.foreign !== w.foreign && !result.includes(x)).sort(() => Math.random() - .5)[0];
    if (fallback) result.push(fallback);
  }
  return result;
}

window.startQuiz = function(reverse) {
  isReverse = !!reverse;
  quizIndex = 0; quizCorrect = 0;
  shuffledQuiz = [...stageWords].sort(() => Math.random() - 0.5);
  _showScreen('quiz');
  showQuizQuestion();
};

function showQuizQuestion() {
  quizAnswered = false;
  document.getElementById('correction').style.display = 'none';
  const w = shuffledQuiz[quizIndex];
  const qEl = document.getElementById('quizWord');
  qEl.textContent = isReverse ? w.native : w.foreign;
  qEl.style.direction = isReverse ? 'rtl' : 'ltr';
  const emojiEl = document.getElementById('quizEmoji');
  if (isReverse && w.em) {
    emojiEl.textContent = w.em;
    emojiEl.style.display = '';
  } else {
    emojiEl.style.display = 'none';
  }
  document.getElementById('quizCounter').textContent = `${quizIndex + 1} / ${shuffledQuiz.length}`;
  document.getElementById('quizProgress').style.width = `${((quizIndex + 1) / shuffledQuiz.length) * 100}%`;
  document.getElementById('quizScore').textContent = `✅ ${quizCorrect} / ${quizIndex}`;

  const distractors = getSmartDistractors(w);
  const options = [w, ...distractors].sort(() => Math.random() - 0.5);
  const cardBgs = ['#eff6ff', '#f0fdf4', '#fff7ed', '#fdf2f8'];
  const container = document.getElementById('quizOptions');
  container.innerHTML = '';
  container.className = 'quiz-options visual-grid';

  options.forEach((opt, idx) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.style.background = cardBgs[idx % cardBgs.length];
    const text = isReverse ? opt.foreign : opt.native;
    const dir = isReverse ? 'ltr' : 'rtl';
    card.dir = dir;
    const emojiHtml = isReverse ? '' : `<div class="card-emoji">${opt.em || ''}</div>`;
    card.innerHTML = `${emojiHtml}<div class="card-text" style="direction:${dir}">${text}</div>`;
    const sp = document.createElement('button');
    sp.className = 'card-speak';
    sp.textContent = '🔊';
    sp.onclick = (e) => { e.stopPropagation(); isReverse ? sayWord(opt.foreign) : sayNative(opt.native); };
    card.appendChild(sp);
    card.onclick = () => pickAnswer(card, opt.foreign === w.foreign, w);
    container.appendChild(card);
  });
}

function pickAnswer(btn, isCorrect, word) {
  if (quizAnswered) return;
  quizAnswered = true;
  document.querySelectorAll('.quiz-opt,.quiz-card').forEach(b => b.classList.add('disabled'));

  if (isCorrect) {
    btn.classList.add('correct');
    quizCorrect++;
    playCorrect();
    const r = btn.getBoundingClientRect();
    miniConfetti(r.left + r.width / 2, r.top + r.height / 2);
    const cheer = CHEERS[Math.floor(Math.random() * CHEERS.length)];

    setTimeout(() => {
      const quizScreen = document.getElementById('quiz');
      quizScreen.querySelectorAll('.counter,.progress-bar,.score-display,.quiz-word,.speak-btn,.quiz-options,.correction').forEach(el => el.classList.add('quiz-dim'));
      const overlay = document.createElement('div');
      overlay.className = 'spotlight-overlay';
      overlay.id = 'spotlightOverlay';
      overlay.style.background = 'rgba(0,0,0,.3)';
      document.body.appendChild(overlay);
      const spot = document.createElement('div');
      spot.className = 'spotlight-card';
      spot.id = 'spotlightCard';
      spot.innerHTML = `<div style="font-size:1.4rem;font-weight:800;color:var(--success);margin-bottom:8px">${cheer}</div><div class="card-emoji">${word.em || ''}</div><div class="card-foreign">${word.foreign}</div><div class="card-native">${word.native}</div>`;
      document.body.appendChild(spot);
      bigConfetti();
      sayNative(cheer.replace('!', ''));
      setTimeout(() => sayWord(word.foreign), 1000);
      setTimeout(() => sayNative(word.native), 2200);
    }, 500);
  } else {
    btn.classList.add('wrong');
    playWrong();
    const correctText = isReverse ? word.foreign : word.native;
    document.querySelectorAll('.quiz-opt,.quiz-card').forEach(b => {
      const txt = b.querySelector('.card-text');
      if ((txt ? txt.textContent : b.textContent) === correctText) b.classList.add('show-correct');
    });

    setTimeout(() => {
      const quizScreen = document.getElementById('quiz');
      quizScreen.querySelectorAll('.counter,.progress-bar,.score-display,.quiz-word,.speak-btn,.quiz-options,.correction').forEach(el => el.classList.add('quiz-dim'));
      const overlay = document.createElement('div');
      overlay.className = 'spotlight-overlay';
      overlay.id = 'spotlightOverlay';
      document.body.appendChild(overlay);
      const spot = document.createElement('div');
      spot.className = 'spotlight-card';
      spot.id = 'spotlightCard';
      spot.innerHTML = `<div class="card-emoji">${word.em || ''}</div><div class="card-foreign">${word.foreign}</div><div class="card-native">${word.native}</div>`;
      document.body.appendChild(spot);
      sayWord(word.foreign);
      setTimeout(() => sayNative(word.native), 1200);
    }, 600);
  }
  document.getElementById('quizScore').textContent = `✅ ${quizCorrect} / ${quizIndex + 1}`;

  setTimeout(() => {
    const spot = document.getElementById('spotlightCard');
    const overlay = document.getElementById('spotlightOverlay');
    if (spot) spot.remove();
    if (overlay) overlay.remove();
    document.querySelectorAll('.quiz-dim').forEach(el => el.classList.remove('quiz-dim'));
    if (quizIndex < shuffledQuiz.length - 1) { quizIndex++; showQuizQuestion(); }
    else { showResults(); }
  }, 4000);
}

function showResults() {
  if (!isMixMode) {
    const progress = loadProgress();
    const stageData = progress[currentStage] || { fwd: 0, rev: 0 };
    if (typeof stageData === 'number') {
      progress[currentStage] = { fwd: stageData, rev: 0 };
    }
    const key = isReverse ? 'rev' : 'fwd';
    const prev = (progress[currentStage] && progress[currentStage][key]) || 0;
    if (quizCorrect > prev) {
      if (!progress[currentStage]) progress[currentStage] = { fwd: 0, rev: 0 };
      progress[currentStage][key] = quizCorrect;
      saveProgress(progress);
      if (window._saveToCloud) window._saveToCloud(progress);
    }
  }

  const pct = quizCorrect / shuffledQuiz.length;
  let stars, msg;
  if (pct === 1) { stars = '⭐⭐⭐'; msg = '!מושלם! כל הכבוד'; }
  else if (pct >= 0.8) { stars = '⭐⭐'; msg = '!עבודה מצוינת'; }
  else if (pct >= 0.5) { stars = '⭐'; msg = 'לא רע, נסה שוב!'; }
  else { stars = ''; msg = 'בוא ננסה ללמוד שוב'; }

  document.getElementById('resultStars').textContent = stars;
  document.getElementById('resultScore').textContent = `${quizCorrect} / ${shuffledQuiz.length}`;
  document.getElementById('resultScore').style.color = pct >= 0.8 ? 'var(--success)' : pct >= 0.5 ? 'var(--primary)' : 'var(--danger)';
  document.getElementById('resultMsg').textContent = msg;
  const encourageEl = document.getElementById('nextPageEncourage');
  const stageBtnEl = document.getElementById('resultStageBtn');
  if (isMixMode && pct >= 0.8 && currentPage < TOTAL_PAGES - 1) {
    encourageEl.style.display = '';
    stageBtnEl.style.display = 'none';
  } else {
    encourageEl.style.display = 'none';
    stageBtnEl.style.display = '';
  }
  _showScreen('results');
  if (pct >= 0.8) bigConfetti();
  if (window._trackEvent) window._trackEvent('quiz_complete', { stage: currentStage + 1, score: quizCorrect, direction: isReverse ? 'rev' : 'fwd' });

  if (!hasShownLoginPrompt && window._isLoggedIn && !window._isLoggedIn()) {
    const progress = loadProgress();
    const completedCount = Object.keys(progress).length;
    if (completedCount >= 3) {
      hasShownLoginPrompt = true;
      setTimeout(() => window.showLoginOverlay(), 1500);
    }
  }
}

// --- Dictionary ---
window.showDictionary = function() {
  const list = document.getElementById('dictList');
  list.innerHTML = '';
  const cat = CATS[currentStage] || '';
  document.getElementById('dictTitle').textContent = `📖 מִלּוֹן - ${cat}`;
  stageWords.forEach(w => {
    const row = document.createElement('div');
    row.className = 'dict-row';
    row.innerHTML = `<div class="dict-emoji">${w.em || ''}</div><div class="dict-words"><div class="dict-foreign">${w.foreign}</div><div class="dict-native">${w.native}</div></div>`;
    const sp = document.createElement('button');
    sp.className = 'dict-speak';
    sp.textContent = '🔊';
    sp.onclick = () => { sayWord(w.foreign); setTimeout(() => sayNative(w.native), 1200); };
    row.appendChild(sp);
    list.appendChild(row);
  });
  _showScreen('dictionary');
};

// --- Sentence Quiz ---
window.startSentenceQuiz = function() {
  const page = typeof currentPage !== 'undefined' ? currentPage : 0;
  if (!SENTENCES[page]) return;
  sentenceQuizData = [...SENTENCES[page]].sort(() => Math.random() - .5).slice(0, 10);
  sentenceIndex = 0;
  sentenceCorrect = 0;
  _showScreen('sentenceQuiz');
  showSentenceQuestion();
};

function showSentenceQuestion() {
  sentenceAnswered = false;
  document.getElementById('sentenceCorrection').style.display = 'none';
  const s = sentenceQuizData[sentenceIndex];
  document.getElementById('sentenceForeign').textContent = s.foreign;
  document.getElementById('sentenceCounter').textContent = `${sentenceIndex + 1} / ${sentenceQuizData.length}`;
  document.getElementById('sentenceProgress').style.width = `${((sentenceIndex + 1) / sentenceQuizData.length) * 100}%`;
  document.getElementById('sentenceScore').textContent = `✅ ${sentenceCorrect} / ${sentenceIndex}`;

  const cardBgs = ['#eff6ff', '#f0fdf4', '#fff7ed', '#fdf2f8'];
  const correct = { native: s.native, em: s.em };
  const options = [correct, ...s.wrong].sort(() => Math.random() - .5);
  const container = document.getElementById('sentenceOptions');
  container.innerHTML = '';
  container.className = 'sentence-options';
  container.style.display = 'grid';
  container.style.gridTemplateColumns = '1fr 1fr';
  container.style.gap = '10px';
  options.forEach((opt, idx) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.dir = 'rtl';
    card.style.background = cardBgs[idx % cardBgs.length];
    card.innerHTML = `<div class="card-emoji">${opt.em || ''}</div><div class="card-text" style="font-size:1.4rem">${opt.native}</div>`;
    const sp = document.createElement('button');
    sp.className = 'card-speak';
    sp.textContent = '🔊';
    sp.onclick = (e) => { e.stopPropagation(); sayNative(opt.native); };
    card.appendChild(sp);
    card.onclick = () => pickSentenceAnswer(card, opt.native === s.native, s);
    container.appendChild(card);
  });
}

function pickSentenceAnswer(btn, isCorrect, sentence) {
  if (sentenceAnswered) return;
  sentenceAnswered = true;
  document.querySelectorAll('.quiz-card').forEach(b => b.classList.add('disabled'));

  if (isCorrect) {
    btn.classList.add('correct');
    sentenceCorrect++;
    playCorrect();
    const r = btn.getBoundingClientRect();
    miniConfetti(r.left + r.width / 2, r.top + r.height / 2);
    const cheer = CHEERS[Math.floor(Math.random() * CHEERS.length)];
    setTimeout(() => {
      const screen = document.getElementById('sentenceQuiz');
      screen.querySelectorAll('.counter,.progress-bar,.score-display,.sentence-foreign,.speak-btn,.sentence-options,.sentence-correction').forEach(el => el.classList.add('quiz-dim'));
      const overlay = document.createElement('div');
      overlay.className = 'spotlight-overlay';
      overlay.id = 'spotlightOverlay';
      overlay.style.background = 'rgba(0,0,0,.3)';
      document.body.appendChild(overlay);
      const spot = document.createElement('div');
      spot.className = 'spotlight-card';
      spot.id = 'spotlightCard';
      spot.innerHTML = `<div style="font-size:1.4rem;font-weight:800;color:var(--success);margin-bottom:8px">${cheer}</div><div class="card-emoji">${sentence.em || ''}</div><div class="card-foreign">${sentence.foreign}</div><div class="card-native">${sentence.native}</div>`;
      document.body.appendChild(spot);
      bigConfetti();
      sayNative(cheer.replace('!', ''));
      setTimeout(() => sayWord(sentence.foreign), 1000);
      setTimeout(() => sayNative(sentence.native), 2200);
    }, 500);
  } else {
    btn.classList.add('wrong');
    playWrong();
    document.querySelectorAll('.quiz-card').forEach(b => {
      const txt = b.querySelector('.card-text');
      if (txt && txt.textContent === sentence.native) b.classList.add('show-correct');
    });
    setTimeout(() => {
      const screen = document.getElementById('sentenceQuiz');
      screen.querySelectorAll('.counter,.progress-bar,.score-display,.sentence-foreign,.speak-btn,.sentence-options,.sentence-correction').forEach(el => el.classList.add('quiz-dim'));
      const overlay = document.createElement('div');
      overlay.className = 'spotlight-overlay';
      overlay.id = 'spotlightOverlay';
      document.body.appendChild(overlay);
      const spot = document.createElement('div');
      spot.className = 'spotlight-card';
      spot.id = 'spotlightCard';
      spot.innerHTML = `<div class="card-emoji">${sentence.em || ''}</div><div class="card-foreign">${sentence.foreign}</div><div class="card-native">${sentence.native}</div>`;
      document.body.appendChild(spot);
      sayWord(sentence.foreign);
      setTimeout(() => sayNative(sentence.native), 1200);
    }, 600);
  }
  document.getElementById('sentenceScore').textContent = `✅ ${sentenceCorrect} / ${sentenceIndex + 1}`;

  setTimeout(() => {
    const spot = document.getElementById('spotlightCard');
    const overlay = document.getElementById('spotlightOverlay');
    if (spot) spot.remove();
    if (overlay) overlay.remove();
    document.querySelectorAll('.quiz-dim').forEach(el => el.classList.remove('quiz-dim'));
    if (sentenceIndex < sentenceQuizData.length - 1) { sentenceIndex++; showSentenceQuestion(); }
    else { showSentenceResults(); }
  }, 4000);
}

function showSentenceResults() {
  const pct = sentenceCorrect / sentenceQuizData.length;
  let stars, msg;
  if (pct === 1) { stars = '⭐⭐⭐'; msg = '!מוּשְׁלָם! כָּל הַכָּבוֹד'; }
  else if (pct >= .8) { stars = '⭐⭐'; msg = '!עֲבוֹדָה מְצוּיֶנֶת'; }
  else if (pct >= .5) { stars = '⭐'; msg = 'לֹא רַע, נַסֶּה שׁוּב!'; }
  else { stars = ''; msg = 'בּוֹא נְנַסֶּה לִלְמוֹד שׁוּב'; }
  document.getElementById('sentenceResultStars').textContent = stars;
  document.getElementById('sentenceResultScore').textContent = `${sentenceCorrect} / ${sentenceQuizData.length}`;
  document.getElementById('sentenceResultScore').style.color = pct >= .8 ? 'var(--success)' : pct >= .5 ? 'var(--primary)' : 'var(--danger)';
  document.getElementById('sentenceResultMsg').textContent = msg;
  _showScreen('sentenceResults');
  if (pct >= .8) bigConfetti();
}

// --- Touch ---
document.addEventListener('touchmove', e => {
  if (!e.target.closest('.screen[style*="overflow"],.stage-grid,.screen')) return;
}, { passive: true });

// --- Init ---
renderStageGrid();

// --- Firebase ---
(async function initFirebase() {
  try {
    const fb = await import('/lang-shared/firebase-config.js');
    const { userReadyPromise, loginWithGoogle, isLoggedIn, loadCloudProgress, saveCloudProgress, loadPremiumStatus, trackEvent } = fb;
    window._trackEvent = trackEvent;
    window._isLoggedIn = isLoggedIn;
    window._loginWithGoogle = loginWithGoogle;

    async function syncProgress() {
      const cloudData = await loadCloudProgress(LANG.firebaseGameId);
      if (cloudData && cloudData.stages) {
        const local = loadProgress();
        let merged = { ...local };
        for (const [k, v] of Object.entries(cloudData.stages)) {
          if (!merged[k] || v > merged[k]) merged[k] = parseInt(v);
        }
        saveProgress(merged);
      }
    }

    window._saveToCloud = async function(data) {
      await saveCloudProgress(LANG.firebaseGameId, { stages: data, updatedAt: new Date().toISOString() });
    };

    const user = await userReadyPromise;
    if (user) {
      isPremium = await loadPremiumStatus();
      await syncProgress();
      renderStageGrid();
    }

    window.handlePayment = async function(method) {
      if (window._isLoggedIn && !window._isLoggedIn()) {
        if (confirm('כדי לבצע רכישה, יש להתחבר תחילה עם Google.\n\nלהתחבר עכשיו?')) {
          const user = await window._loginWithGoogle();
          if (!user) return;
        } else { return; }
      }
      alert('שירות התשלום יהיה זמין בקרוב!\nPayment service coming soon.\n\nנעדכן כשהשירות יהיה מוכן.');
    };

    window.shareApp = function() {
      const url = window.location.origin;
      if (navigator.share) {
        navigator.share({ title: LANG.shareTitle, text: LANG.shareText, url }).catch(() => {});
      } else {
        window.open('https://wa.me/?text=' + encodeURIComponent(LANG.shareText + '\n' + url), '_blank');
      }
    };

  } catch (e) { console.warn('Firebase init failed, running offline:', e); }
})();

// --- Service Worker cleanup ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
  caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
}

} // end initGame
