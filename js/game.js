// Blubberbucht – Spiellogik
'use strict';

const APP_VERSION = '1.5.0'; // bei jeder Veröffentlichung erhöhen (auch CACHE in sw.js)
const TRAY = 6, BOWLS = 4, BOWL_PRICE = 650, BOOSTER_PRICE = 200;
const SAVE_KEY = 'blubberbucht-v1';
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = n => Math.floor(Math.random() * n);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---------- Speicherstand ----------
const DEFAULTS = { level: 1, boosters: { net: 1, brush: 1, shuffle: 1 }, caught: {}, aquarium: [], sound: true, music: true, vib: true, seen: 3, coins: 100 };
let save = loadSave();
function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    return { ...DEFAULTS, ...s, boosters: { ...DEFAULTS.boosters, ...(s.boosters || {}) } };
  } catch { return structuredClone(DEFAULTS); }
}
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch {} }
const vib = ms => { if (save.vib && navigator.vibrate) navigator.vibrate(ms); };

// ---------- Level-Aufbau ----------
// Schwierigkeit: jedes 5. Level „Schwer“, jedes 10. „Extrem schwer“
const DIFF = { s: .5, smax: 5, sl: 60, t0: 9, t: .35, tmax: 18, hardS: 1, hardT: 3, extS: 2, extT: 5 };
const unlockedCount = L => Math.min(SPECIES.length, 3 + Math.floor((L - 1) * .6));
const tierOf = L => L >= 10 && L % 10 === 0 ? 2 : L >= 5 && L % 5 === 0 ? 1 : 0;
const TIER_NAME = ['', 'Schwer', 'Extrem schwer'];
function levelParams(L) {
  const tier = tierOf(L);
  const baseS = Math.min(3 + Math.floor(L * DIFF.s), DIFF.smax + Math.floor(L / DIFF.sl));
  return {
    tier,
    T: Math.min(DIFF.t0 + Math.floor(L * DIFF.t), DIFF.tmax) + [0, DIFF.hardT, DIFF.extT][tier],
    S: Math.min(unlockedCount(L), baseS + [0, DIFF.hardS, DIFF.extS][tier]),
    timed: L >= 6 && L % 6 === 0 && tier === 0,
  };
}

const COLS_X = [17.5, 50, 82.5], R0 = 16.2;

let G = null;

function genLevel(L) {
  const p = levelParams(L);
  const board = $('#board');
  const A = clamp(board.clientHeight / Math.max(1, board.clientWidth), .85, 1.6);
  const H = 100 * A, T = p.T;
  // Blasengrößen (1–3 Tiere), zusammen genau T*3 Tiere
  const caps = []; let total = 0;
  while (total < T * 3) { const c = Math.min(T * 3 - total, [1, 2, 2, 3, 3, 3][rand(6)]); caps.push(c); total += c; }
  shuffle(caps);
  const bubbles = caps.map((cap, i) => ({ id: i, cap, items: [], r: R0 * [0, .74, .88, 1][cap], jx: (Math.random() - .5) * 4, x: 50, y: -50 }));
  // Spalten: Index 0 = ganz unten, weiter oben warten Blasen außerhalb des Bildes
  const cols = [[], [], []];
  bubbles.forEach((b, i) => cols[i % 3].push(b.id));

  const unlocked = SPECIES.slice(0, unlockedCount(L)).map(s => s.id);
  const newest = unlocked[unlocked.length - 1];
  const chosen = [newest, ...shuffle(unlocked.filter(s => s !== newest))].slice(0, Math.min(p.S, T));
  const list = [];
  for (let t = 0; t < T; t++) { const sp = chosen[t % chosen.length]; list.push(sp, sp, sp); }
  shuffle(list);

  const cr = {}; let n = 0;
  for (const b of bubbles) for (let k = 0; k < b.cap; k++) {
    const uid = 'c' + (n++);
    cr[uid] = { uid, sp: list.pop(), rot: (Math.random() - .5) * 16, flip: Math.random() < .2 };
    b.items.push(uid);
  }
  // Zielkarten-Stapel: feste, zufällige Reihenfolge aller Dreiergruppen (hilft dem Spieler nicht)
  const counts = {}; Object.values(cr).forEach(c => counts[c.sp] = (counts[c.sp] || 0) + 1);
  const q = []; for (const sp in counts) for (let i = 0; i < counts[sp] / 3; i++) q.push(sp);
  return { level: L, H, bubbles, cols, cr, nextB: bubbles.length, total: n, collected: 0, species: chosen, queue: shuffle(q),
    bowls: Array.from({ length: BOWLS }, (_, i) => ({ sp: null, items: [], completing: false, locked: i >= 2 })),
    tray: [], pending: 0, over: false, paused: false, timed: p.timed, tier: p.tier,
    timeLeft: p.timed ? Math.ceil(n * 2.4) + 15 : 0, extraTime: false, usedBoosters: 0 };
}

// ---------- Hilfsfunktionen zum Zustand ----------
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
// Nur Blasen, die (fast) ganz im Bild sind, lassen sich antippen
function isBlocked(b) { return b.y < b.r * .55; }
// Schwerkraft: Blasen jeder Spalte liegen von unten nach oben aufeinander
function relayout() {
  const byId = new Map(G.bubbles.map(b => [b.id, b]));
  G.cols.forEach((col, c) => {
    let y = G.H - (c === 1 ? R0 * .95 : 1.5), prev = null;
    for (const id of col) {
      const b = byId.get(id);
      y -= prev ? (prev.r + b.r) * .94 : b.r;
      b.x = clamp(COLS_X[c] + b.jx, b.r, 100 - b.r); b.y = y;
      prev = b;
    }
  });
}
// leere Blasen entfernen -> die darüber rutschen nach
function dropEmpty() {
  G.bubbles = G.bubbles.filter(b => b.items.length);
  const alive = new Set(G.bubbles.map(b => b.id));
  G.cols = G.cols.map(col => col.filter(id => alive.has(id)));
  relayout();
}
function bubbleOf(uid) { return G.bubbles.find(b => b.items.includes(uid)); }
function countWhere(sp, onlyFree = false) {
  let n = 0;
  for (const b of G.bubbles) { if (onlyFree && isBlocked(b)) continue; for (const u of b.items) if (G.cr[u].sp === sp) n++; }
  return n;
}
const trayCount = sp => G.tray.filter(u => G.cr[u].sp === sp).length;
const openBowlFor = sp => G.bowls.find(w => w.sp === sp && !w.completing && w.items.length < 3);

function assignTargets() {
  for (const bw of G.bowls) {
    if (bw.sp || bw.completing || bw.locked) continue;
    bw.sp = G.queue.shift() || null;
  }
}
function settle() {
  assignTargets();
  for (const bw of G.bowls) {
    if (!bw.sp || bw.completing || bw.locked) continue;
    for (let i = 0; i < G.tray.length && bw.items.length < 3; i++) {
      if (G.cr[G.tray[i]].sp === bw.sp) { bw.items.push(G.tray[i]); G.tray.splice(i, 1); i--; }
    }
    if (bw.items.length === 3) completeBowl(bw);
  }
}
function trayInsert(uid) {
  const sp = G.cr[uid].sp;
  let idx = -1;
  G.tray.forEach((u, i) => { if (G.cr[u].sp === sp) idx = i; });
  if (idx < 0) G.tray.push(uid); else G.tray.splice(idx + 1, 0, uid);
}
function canMove() {
  return G.bubbles.some(b => b.items.length && !isBlocked(b) && b.items.some(u => openBowlFor(G.cr[u].sp)));
}

// ---------- Darstellung ----------
const BOWL_SVG = `<svg class="bowl-svg" viewBox="0 0 100 86" preserveAspectRatio="none">
  <defs><linearGradient id="bw-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bdf0ff" stop-opacity=".55"/><stop offset="1" stop-color="#4fb8f0" stop-opacity=".75"/></linearGradient></defs>
  <path d="M24 16 C2 30 2 70 30 80 L70 80 C98 70 98 30 76 16 Z" fill="rgba(210,245,255,.28)" stroke="rgba(255,255,255,.85)" stroke-width="2.5"/>
  <path d="M14 34 C10 52 14 70 30 78 L70 78 C86 70 90 52 86 34 Q50 40 14 34Z" fill="url(#bw-water)"/>
  <path d="M22 70 Q50 62 78 70 L70 78 L30 78Z" fill="#e8d9a8" opacity=".9"/>
  <ellipse cx="50" cy="15" rx="28" ry="6" fill="rgba(220,248,255,.35)" stroke="#fff" stroke-width="3"/>
  <path d="M18 40 Q16 56 24 66" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".7"/>
</svg>`;

function crHTML(uid, style = '') {
  const c = G.cr[uid];
  return `<div class="cr" data-uid="${uid}" style="${style}">${creatureSVG(c.sp, `style="transform:rotate(${c.rot}deg)${c.flip ? ' scaleX(-1)' : ''}"`)}</div>`;
}
const POS = {
  1: [[.5, .5, .64]],
  2: [[.35, .38, .54], [.63, .64, .54]],
  3: [[.3, .35, .47], [.7, .37, .47], [.5, .7, .47]],
};

function renderBoard() {
  const board = $('#board'), stage = $('#stage');
  const W = board.clientWidth, H = board.clientHeight;
  const s = Math.min(W / 100, H / G.H);
  Object.assign(stage.style, { width: 100 * s + 'px', height: G.H * s + 'px', left: (W - 100 * s) / 2 + 'px', top: (H - G.H * s) + 'px' });
  const existing = new Map([...stage.children].map(e => [e.dataset.b, e]));
  const keep = new Set();
  for (const b of G.bubbles) {
    if (!b.items.length) continue;
    const id = String(b.id); keep.add(id);
    const d = b.r * 2 * s, left = (b.x - b.r) * s, top = (b.y - b.r) * s;
    let el = existing.get(id);
    if (!el) {
      // neue Blase startet oberhalb des Spielfelds und rutscht hinein
      el = document.createElement('div');
      el.className = 'bubble'; el.dataset.b = id;
      Object.assign(el.style, { left: left + 'px', top: Math.min(top, -d - 8) + 'px', width: d + 'px', height: d + 'px' });
      stage.appendChild(el);
      void el.offsetWidth;
    }
    Object.assign(el.style, { left: left + 'px', top: top + 'px', width: d + 'px', height: d + 'px' });
    el.classList.toggle('far', isBlocked(b));
    const pos = POS[b.items.length];
    const crs = new Map([...el.querySelectorAll('.cr')].map(c => [c.dataset.uid, c]));
    b.items.forEach((u, i) => {
      let c = crs.get(u);
      if (!c) { el.insertAdjacentHTML('beforeend', crHTML(u)); c = el.lastElementChild; }
      crs.delete(u);
      Object.assign(c.style, { left: pos[i][0] * 100 + '%', top: pos[i][1] * 100 + '%', width: pos[i][2] * 100 + '%' });
    });
    crs.forEach(c => c.remove());
  }
  existing.forEach((e, id) => { if (!keep.has(id)) e.remove(); });
}
function renderBowls() {
  $('#bowls').innerHTML = G.bowls.map((w, i) => w.locked
    ? `<div class="bowl locked" data-bowl="${i}">${BOWL_SVG}<div class="lock">🔒</div></div>`
    : `<div class="bowl ${w.completing ? 'done' : ''}" data-bowl="${i}">${BOWL_SVG}<div class="bowl-fish">${w.items.map(u => crHTML(u)).join('')}</div></div>`).join('');
  $('#cards').innerHTML = G.bowls.map((w, i) => w.locked
    ? `<div class="card buy" data-buy="${i}"><span class="price">${COIN}${BOWL_PRICE}</span></div>`
    : `<div class="card ${w.sp ? '' : 'empty'} ${w.completing ? 'done' : ''}">${w.sp ? creatureSVG(w.sp) + `<b>${w.items.length}/3</b>` : '<span class="check">✓</span>'}${w.sp && G.queue.length ? `<i class="stack">+${G.queue.length}</i>` : ''}</div>`).join('');
}
function renderTray() {
  const t = $('#tray');
  t.innerHTML = Array.from({ length: TRAY }, (_, i) => `<div class="slot">${G.tray[i] ? crHTML(G.tray[i]) : ''}</div>`).join('');
  t.classList.toggle('danger', G.tray.length >= TRAY - 1);
}
function renderHUD() {
  $('#cnt').textContent = `${G.collected}/${G.total}`;
  renderCoins();
  $('#lvl-title').textContent = `Level ${G.level}`;
  const tg = $('#lvl-tier'); tg.hidden = !G.tier; tg.textContent = TIER_NAME[G.tier]; tg.className = 'tier t' + G.tier;
  for (const k of ['net', 'brush', 'shuffle']) {
    const b = document.querySelector(`[data-booster="${k}"]`);
    b.querySelector('.badge').textContent = save.boosters[k] || '+';
    b.classList.toggle('empty', !save.boosters[k]);
  }
  const tm = $('#timer');
  tm.hidden = !G.timed;
  if (G.timed) {
    const t = Math.max(0, G.timeLeft);
    tm.textContent = `⏱ ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
    tm.classList.toggle('low', t <= 10);
  }
}
function render() { renderBowls(); renderTray(); renderBoard(); renderHUD(); }

// ---------- Flug-Animationen (FLIP) ----------
const flying = new Map();
const fx = () => $('#fx');
function captureRects() {
  const m = new Map();
  document.querySelectorAll('#screen-game .cr[data-uid]').forEach(el => {
    const u = el.dataset.uid, f = flying.get(u);
    m.set(u, f ? f.clone.getBoundingClientRect() : el.getBoundingClientRect());
  });
  return m;
}
function animateMoves(before, stagger = false) {
  let i = 0;
  document.querySelectorAll('#screen-game .cr[data-uid]').forEach(el => {
    const u = el.dataset.uid, a = before.get(u);
    if (!a) return;
    const f = flying.get(u);
    if (f) { f.anim.cancel(); f.clone.remove(); flying.delete(u); }
    const b = el.getBoundingClientRect();
    if (Math.abs(a.left - b.left) < 1 && Math.abs(a.top - b.top) < 1 && Math.abs(a.width - b.width) < 1) return;
    const clone = el.cloneNode(true);
    clone.removeAttribute('data-uid');
    clone.className = 'cr flying';
    clone.removeAttribute('style');
    Object.assign(clone.style, { left: b.left + 'px', top: b.top + 'px', width: b.width + 'px', height: b.height + 'px' });
    fx().appendChild(clone);
    el.style.visibility = 'hidden';
    const dx = a.left - b.left, dy = a.top - b.top, sc = a.width / b.width;
    const far = Math.hypot(dx, dy) > 70;
    const frames = [{ transform: `translate(${dx}px,${dy}px) scale(${sc})` }];
    if (far) frames.push({ transform: `translate(${dx * .45}px,${dy * .45 - 50}px) scale(${Math.max(sc, 1) * 1.3})`, offset: .45 });
    frames.push({ transform: 'none' });
    const anim = clone.animate(frames, { duration: far ? 460 : 260, easing: 'cubic-bezier(.35,.75,.35,1)', delay: stagger ? (i++) * 90 : 0, fill: 'backwards' });
    flying.set(u, { clone, anim });
    anim.onfinish = () => {
      clone.remove(); flying.delete(u);
      const cur = document.querySelector(`#screen-game .cr[data-uid="${u}"]`);
      if (cur) cur.style.visibility = '';
    };
  });
}
function commit(fn, stagger = false) {
  if (window.SIM) { fn(); if (G) dropEmpty(); return; }
  const before = captureRects();
  fn();
  if (G) dropEmpty();
  render();
  animateMoves(before, stagger);
}
function clearFx() {
  flying.forEach(f => f.anim.cancel()); flying.clear();
  fx().innerHTML = '';
}

function burstAt(r) {
  const d = document.createElement('div');
  d.className = 'burst';
  Object.assign(d.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
  for (let i = 0; i < 8; i++) {
    const p = document.createElement('i');
    p.style.setProperty('--a', (i * 45) + 'deg');
    d.appendChild(p);
  }
  fx().appendChild(d);
  setTimeout(() => d.remove(), 650);
  Sfx.burst();
}
function sparkleAt(r, n = 14) {
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('div');
    s.className = 'spark';
    const a = Math.random() * Math.PI * 2, dd = 40 + Math.random() * 70;
    s.style.left = cx + 'px'; s.style.top = cy + 'px';
    s.style.setProperty('--dx', Math.cos(a) * dd + 'px');
    s.style.setProperty('--dy', Math.sin(a) * dd + 'px');
    s.style.background = ['#fff59a', '#ffffff', '#8ff3ff', '#ffc2f0'][i % 4];
    fx().appendChild(s);
    setTimeout(() => s.remove(), 800);
  }
}

// ---------- Spielzüge ----------
function completeBowl(bw) {
  bw.completing = true; G.pending++;
  const g = G, idx = G.bowls.indexOf(bw);
  if (window.SIM) { G.collected += 3; bw.items = []; bw.sp = null; bw.completing = false; G.pending--; settle(); return; }
  setTimeout(() => {
    if (G !== g) return;
    const el = document.querySelector(`[data-bowl="${idx}"]`);
    if (el) {
      el.querySelectorAll('.cr').forEach(c => c.classList.add('pop'));
      sparkleAt(el.getBoundingClientRect(), 18);
    }
    Sfx.match(); vib(25);
    setTimeout(() => {
      if (G !== g) return;
      commit(() => {
        for (const u of bw.items) {
          const sp = G.cr[u].sp;
          save.caught[sp] = (save.caught[sp] || 0) + 1;
          G.collected++;
        }
        save.aquarium.push(bw.sp);
        if (save.aquarium.length > 60) save.aquarium.shift();
        bw.items = []; bw.sp = null; bw.completing = false; G.pending--;
        settle();
      });
      persist();
      afterChange();
    }, 380);
  }, 470);
}

function pick(uid) {
  const b = bubbleOf(uid);
  const sp = G.cr[uid].sp, bw = openBowlFor(sp);
  if (!bw && G.tray.length >= TRAY) {
    shake($('#tray')); Sfx.error(); vib(40);
    toast('Die Ablage ist voll!');
    return;
  }
  const bEl = document.querySelector(`[data-b="${b.id}"]`);
  const burst = b.items.length === 1 && bEl ? bEl.getBoundingClientRect() : null;
  commit(() => {
    b.items.splice(b.items.indexOf(uid), 1);
    if (bw) { bw.items.push(uid); if (bw.items.length === 3) completeBowl(bw); }
    else trayInsert(uid);
  });
  if (burst) burstAt(burst);
  if (!window.SIM) setTimeout(() => bw ? Sfx.splash() : Sfx.plop(), 380);
  vib(8);
  afterChange();
}

function onBoardTap(e) {
  if (!G || G.over || G.paused) return;
  const bEl = e.target.closest('.bubble');
  if (!bEl) return;
  const b = G.bubbles.find(x => x.id === +bEl.dataset.b);
  if (!b || !b.items.length) return;
  if (isBlocked(b)) { shake(bEl); Sfx.error(); return; }
  let uid = e.target.closest('.cr[data-uid]')?.dataset.uid;
  if (!uid) {
    let best = 1e9;
    bEl.querySelectorAll('.cr[data-uid]').forEach(c => {
      const r = c.getBoundingClientRect(), d = Math.hypot(r.left + r.width / 2 - e.clientX, r.top + r.height / 2 - e.clientY);
      if (d < best) { best = d; uid = c.dataset.uid; }
    });
  }
  if (uid) { Sfx.pop(); pick(uid); }
}

function afterChange() {
  renderHUD();
  if (!G || G.over) return;
  const left = G.bubbles.reduce((a, b) => a + b.items.length, 0);
  if (left === 0 && G.tray.length === 0 && G.pending === 0 && G.bowls.every(w => !w.items.length)) {
    G.over = true;
    setTimeout(winLevel, 450);
  } else if (G.tray.length >= TRAY && G.pending === 0) {
    G.over = true;
    setTimeout(() => loseLevel('tray'), 500);
  }
}

// ---------- Münzen & Käufe ----------
const COIN = `<svg class="coin" viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="#ffcf2e" stroke="#c27b00" stroke-width="3"/><circle cx="20" cy="20" r="11" fill="none" stroke="#e8a200" stroke-width="2.5"/><path d="M14 13 Q18 10 22 12" stroke="#fff6c0" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>`;
function renderCoins() {
  document.querySelectorAll('.coins-val').forEach(e => e.textContent = save.coins);
}
function spend(n) {
  if (save.coins < n) return false;
  save.coins -= n; persist(); renderCoins();
  return true;
}
function noCoins(n) {
  showModal(`<div class="ribbon red">Zu wenig Münzen</div>
    <div class="big-coin">${COIN}</div>
    <p>Du brauchst ${n} Münzen, hast aber nur ${save.coins}.</p>
    <p class="small">Münzen bekommst du für jedes geschaffte Level – mit 3 Sternen gibt's extra!</p>
    <button class="btn green" data-act="close">OK</button>`, { close: hideModal });
}
function offerBowl() {
  if (!G || G.over) return;
  const idx = G.bowls.findIndex(w => w.locked);
  if (idx < 0) return;
  showModal(`<div class="ribbon">Aquarium freischalten</div>
    <div class="hero-bowl">${BOWL_SVG}<div class="lock">🔒</div></div>
    <p>Ein zusätzliches Aquarium gibt dir in diesem Level mehr Platz zum Sortieren.</p>
    <button class="btn orange" data-act="buy">Kaufen für ${COIN} ${BOWL_PRICE}</button>
    <button class="btn ghost" data-act="close">Später</button>`, {
    close: hideModal,
    buy: () => {
      if (!spend(BOWL_PRICE)) return noCoins(BOWL_PRICE);
      hideModal();
      commit(() => { G.bowls[idx].locked = false; settle(); });
      const el = document.querySelector(`[data-bowl="${idx}"]`);
      if (el) sparkleAt(el.getBoundingClientRect(), 22);
      Sfx.match(); afterChange();
    },
  });
}
function offerBooster(k) {
  showModal(`<div class="ribbon">${BOOSTER_INFO[k].name}</div>
    <div class="ricon big">${BOOSTER_ICONS[k]}</div>
    <p>${BOOSTER_INFO[k].desc}</p>
    <button class="btn orange" data-act="buy">Kaufen für ${COIN} ${BOOSTER_PRICE}</button>
    <button class="btn ghost" data-act="close">Abbrechen</button>`, {
    close: hideModal,
    buy: () => {
      if (!spend(BOOSTER_PRICE)) return noCoins(BOOSTER_PRICE);
      save.boosters[k] = (save.boosters[k] || 0) + 1; persist();
      hideModal(); renderHUD(); Sfx.booster();
    },
  });
}

// ---------- Booster ----------
const BOOSTER_INFO = {
  net: { name: 'Kescher', desc: 'Fängt die fehlenden Tiere für ein Glas – auch aus verdeckten Blasen.' },
  brush: { name: 'Aufräumen', desc: 'Packt bis zu 3 Tiere aus der Ablage zurück in eine neue Blase.' },
  shuffle: { name: 'Wirbel', desc: 'Mischt alle Tiere in den Blasen neu.' },
};
function useBooster(k) {
  if (!G || G.over || G.paused) return;
  if (!save.boosters[k]) { offerBooster(k); return; }
  const ok = ({ net: boostNet, brush: boostBrush, shuffle: boostShuffle })[k]();
  if (!ok) return;
  save.boosters[k]--; G.usedBoosters++; persist();
  Sfx.booster(); vib(30);
  boosterFx(k);
  afterChange();
}
function boostNet() {
  const cands = G.bowls.filter(w => w.sp && !w.completing && w.items.length < 3).sort((a, b) => b.items.length - a.items.length);
  if (!cands.length) { toast('Gerade kein Glas frei – gleich nochmal!'); return false; }
  const bw = cands[0], need = 3 - bw.items.length;
  const src = [];
  G.bubbles.forEach(b => b.items.forEach(u => { if (G.cr[u].sp === bw.sp) src.push({ b, u, s: (isBlocked(b) ? 0 : 100) + b.y * .1 + Math.random() }); }));
  src.sort((a, b) => b.s - a.s);
  const take = src.slice(0, need);
  const bursts = [];
  commit(() => {
    for (const t of take) {
      t.b.items.splice(t.b.items.indexOf(t.u), 1);
      if (!t.b.items.length) { const el = document.querySelector(`[data-b="${t.b.id}"]`); if (el) bursts.push(el.getBoundingClientRect()); }
      bw.items.push(t.u);
    }
    if (bw.items.length === 3) completeBowl(bw);
  }, true);
  bursts.forEach(burstAt);
  return true;
}
function boostBrush() {
  if (!G.tray.length) { toast('Die Ablage ist schon leer.'); return false; }
  commit(() => {
    const take = G.tray.splice(0, Math.min(3, G.tray.length));
    const b = { id: G.nextB++, cap: take.length, items: take, r: R0 * [0, .74, .88, 1][take.length], jx: (Math.random() - .5) * 4, x: 50, y: -50 };
    G.bubbles.push(b);
    // in die Spalte mit den wenigsten sichtbaren Blasen, ganz oben im sichtbaren Bereich
    let best = 0, bestN = 1e9;
    G.cols.forEach((col, c) => { const nVis = col.filter(id => !isBlocked(G.bubbles.find(x => x.id === id))).length; if (nVis < bestN) { bestN = nVis; best = c; } });
    G.cols[best].splice(bestN, 0, b.id);
  });
  return true;
}
function boostShuffle() {
  const all = [];
  G.bubbles.forEach(b => all.push(...b.items));
  if (all.length < 2) { toast('Hier gibt es nichts mehr zu mischen.'); return false; }
  shuffle(all);
  let k = 0;
  commit(() => G.bubbles.forEach(b => { const n = b.items.length; b.items = all.slice(k, k + n); k += n; }));
  return true;
}
function boosterFx(k) {
  const d = document.createElement('div');
  d.className = 'booster-fx ' + k;
  d.innerHTML = BOOSTER_ICONS[k];
  fx().appendChild(d);
  setTimeout(() => d.remove(), 900);
}

// ---------- Timer ----------
let timerId = null;
function startTimer() {
  clearInterval(timerId);
  if (!G.timed) return;
  timerId = setInterval(() => {
    if (!G || G.over || G.paused || document.hidden) return;
    G.timeLeft--;
    renderHUD();
    if (G.timeLeft <= 0) { G.over = true; loseLevel('time'); }
  }, 1000);
}

// ---------- Level-Ablauf ----------
function startLevel(L) {
  hideModal(); clearFx();
  showScreen('game');
  requestAnimationFrame(() => {
    G = genLevel(L);
    relayout();
    settle();
    $('#stage').innerHTML = '';
    render();
    startTimer();
    const u = unlockedCount(L);
    if (u > save.seen) {
      const sp = SPECIES[u - 1];
      save.seen = u; persist();
      setTimeout(() => showModal(`
        <div class="ribbon">Neue Art entdeckt!</div>
        <div class="hero-cr">${creatureSVG(sp.id)}</div>
        <h2>${sp.name}</h2>
        <p>${sp.name} schwimmt ab jetzt in den Blasen mit.</p>
        <button class="btn green" data-act="close">Los geht's!</button>`, { close: hideModal }), 500);
    } else if (G.tier) {
      setTimeout(() => showModal(`
        <div class="ribbon ${G.tier === 2 ? 'red' : 'orange'}">${TIER_NAME[G.tier]}es Level</div>
        <h2>${G.tier === 2 ? '🔥🔥' : '🔥'} Level ${L}</h2>
        <p>Hier wird's knifflig – plane deine Züge gut! Ein 3. Aquarium kannst du für ${BOWL_PRICE} Münzen dazukaufen.</p>
        <button class="btn green" data-act="close">Los geht's!</button>`, { close: hideModal }), 400);
    } else if (G.timed) {
      setTimeout(() => showModal(`
        <div class="ribbon orange">Zeit-Challenge</div>
        <h2>⏱ ${G.timeLeft} Sekunden</h2>
        <p>Sortiere alle Tiere, bevor die Zeit abläuft!</p>
        <button class="btn green" data-act="close">Start</button>`, { close: hideModal }), 400);
    }
  });
}

function winLevel() {
  clearInterval(timerId);
  Sfx.win(); vib([30, 60, 30]);
  confetti();
  const L = G.level;
  save.level = Math.max(save.level, L + 1);
  const starsWon = G.usedBoosters === 0 ? 3 : G.usedBoosters <= 2 ? 2 : 1;
  const coins = 10 + starsWon * 5 + [0, 15, 30][G.tier];
  save.coins += coins;
  let reward = `<div class="reward coins">${COIN}<span>+${coins} Münzen</span></div>`;
  if (L % 5 === 0) {
    const k = ['net', 'brush', 'shuffle'][rand(3)];
    save.boosters[k] = (save.boosters[k] || 0) + 1;
    reward += `<div class="reward"><div class="ricon">${BOOSTER_ICONS[k]}</div><span>+1 ${BOOSTER_INFO[k].name}</span></div>`;
  }
  persist();
  const species = [...new Set(Object.values(G.cr).map(c => c.sp))];
  const stars = G.usedBoosters === 0 ? 3 : G.usedBoosters <= 2 ? 2 : 1;
  showModal(`
    <div class="ribbon">Level ${L} geschafft!</div>
    <div class="stars">${[1, 2, 3].map(i => `<span class="${i <= stars ? 'on' : ''}">★</span>`).join('')}</div>
    <p>${G.total} Tiere sortiert – neue Bewohner für dein Aquarium:</p>
    <div class="mini-row">${species.map(s => `<div>${creatureSVG(s)}</div>`).join('')}</div>
    ${reward}
    <button class="btn green" data-act="next">Weiter</button>
    <button class="btn ghost" data-act="aqua">Zum Aquarium</button>`, {
    next: () => startLevel(L + 1),
    aqua: () => { hideModal(); openAquarium(); },
  });
}

function loseLevel(reason) {
  clearInterval(timerId);
  Sfx.lose(); vib([60, 40, 60]);
  const L = G.level;
  const acts = {
    retry: () => startLevel(L),
    menu: () => { hideModal(); openMenu(); },
    brush: () => { hideModal(); G.over = false; useBooster('brush'); },
    shuffle: () => { hideModal(); G.over = false; useBooster('shuffle'); afterChange(); },
    time: () => { hideModal(); G.over = false; G.extraTime = true; G.timeLeft += 20; startTimer(); renderHUD(); },
  };
  let opts = '';
  if (reason === 'tray') {
    if (save.boosters.brush) opts += `<button class="btn orange" data-act="brush">Aufräumen nutzen (${save.boosters.brush})</button>`;
    if (save.boosters.shuffle) opts += `<button class="btn orange" data-act="shuffle">Wirbel nutzen (${save.boosters.shuffle})</button>`;
  } else if (!G.extraTime) {
    opts += `<button class="btn orange" data-act="time">+20 Sekunden</button>`;
  }
  showModal(`
    <div class="ribbon red">${reason === 'tray' ? 'Ablage voll!' : 'Zeit abgelaufen!'}</div>
    <div class="hero-cr sad">${creatureSVG('puffi')}</div>
    <p>${reason === 'tray' ? 'Kein Platz mehr für weitere Tiere.' : 'Fast geschafft – versuch es nochmal!'}</p>
    ${opts}
    <button class="btn green" data-act="retry">Nochmal versuchen</button>
    <button class="btn ghost" data-act="menu">Menü</button>`, acts);
}

function confetti() {
  const cols = ['#ffd23a', '#ff6fb5', '#3c7cff', '#6fe0a0', '#ff7a3d', '#a271ff'];
  for (let i = 0; i < 60; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = cols[i % cols.length];
    c.style.animationDelay = Math.random() * .6 + 's';
    c.style.setProperty('--dx', (Math.random() - .5) * 160 + 'px');
    c.style.setProperty('--r', rand(720) + 'deg');
    fx().appendChild(c);
    setTimeout(() => c.remove(), 3200);
  }
}

// ---------- Overlays ----------
let modalActs = {};
function showModal(html, acts = {}) {
  if (G) G.paused = true;
  modalActs = acts;
  const m = $('#modal');
  m.innerHTML = `<div class="panel">${html}</div>`;
  m.hidden = false;
}
function hideModal() {
  $('#modal').hidden = true;
  if (G) G.paused = false;
}
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
}
function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }

function openSettings() {
  const inGame = !$('#screen-game').hidden && G;
  const draw = () => showModal(`
    <div class="ribbon">Einstellungen</div>
    <label class="toggle"><span>🎵 Musik</span><input type="checkbox" data-set="music" ${save.music ? 'checked' : ''}><i></i></label>
    <label class="toggle"><span>🔊 Soundeffekte</span><input type="checkbox" data-set="sound" ${save.sound ? 'checked' : ''}><i></i></label>
    <label class="toggle"><span>📳 Vibration</span><input type="checkbox" data-set="vib" ${save.vib ? 'checked' : ''}><i></i></label>
    <div class="help">
      <b>So geht's:</b> Tippe Tiere in den Blasen an. Passt ein Tier zu einer Karte unter den Gläsern, schwimmt es ins Glas – sonst landet es in der Ablage.
      Drei gleiche im Glas = gesammelt! Leere Blasen platzen und von oben rutschen neue nach. Ist die Ablage voll, ist das Level verloren.
    </div>
    ${inGame ? `<button class="btn orange" data-act="restart">Level neu starten</button><button class="btn ghost" data-act="menu">Hauptmenü</button>` : ''}
    <button class="btn green" data-act="close">Weiter</button>
    ${inGame ? '' : `<button class="btn link" data-act="reset">Fortschritt zurücksetzen</button>`}
    <p class="version">Blubberbucht v${APP_VERSION} · von Hase Games</p>`, {
    close: hideModal,
    restart: () => startLevel(G.level),
    menu: () => { hideModal(); openMenu(); },
    reset: () => showModal(`<div class="ribbon red">Wirklich?</div><p>Level, Booster und Aquarium werden gelöscht.</p>
      <button class="btn orange" data-act="yes">Ja, zurücksetzen</button><button class="btn green" data-act="no">Abbrechen</button>`, {
      yes: () => { save = structuredClone(DEFAULTS); persist(); hideModal(); openMenu(); },
      no: draw,
    }),
  });
  draw();
}

// ---------- Screens ----------
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.hidden = s.id !== 'screen-' + name);
}
function openMenu() {
  clearInterval(timerId); clearFx();
  G = null;
  $('#menu-level').textContent = `Level ${save.level}`;
  renderCoins();
  showScreen('menu');
}
function openAquarium() {
  clearInterval(timerId);
  showScreen('aquarium');
  const tank = $('#tank-swim');
  const list = save.aquarium.slice(-24);
  tank.innerHTML = list.length ? list.map(sp => {
    const dur = 9 + Math.random() * 10, y = 8 + Math.random() * 72, size = 11 + Math.random() * 6;
    return `<div class="swimmer" style="top:${y}%;width:${size}cqw;animation-duration:${dur}s;animation-delay:-${Math.random() * dur}s"><div class="bob">${creatureSVG(sp)}</div></div>`;
  }).join('') : `<p class="tank-empty">Noch leer – sammle Tiere im Spiel!</p>`;
  const total = Object.values(save.caught).reduce((a, b) => a + b, 0);
  $('#aqua-stats').textContent = `${total} Tiere gesammelt · ${Object.keys(save.caught).length}/${SPECIES.length} Arten`;
  $('#album').innerHTML = SPECIES.map((s, i) => {
    const n = save.caught[s.id] || 0, known = i < save.seen;
    return `<div class="acard ${n ? '' : 'locked'}">${creatureSVG(s.id)}<b>${known ? s.name : '???'}</b><small>${n ? n + '× gefangen' : known ? 'noch nicht gefangen' : 'unentdeckt'}</small></div>`;
  }).join('');
}

// ---------- Icons ----------
const BOOSTER_ICONS = {
  net: `<svg viewBox="0 0 100 100"><defs><clipPath id="netc"><circle cx="60" cy="40" r="23"/></clipPath></defs>
    <path d="M20 86 L44 58" stroke="#7a3d14" stroke-width="15" stroke-linecap="round"/><path d="M20 86 L44 58" stroke="#ff9f43" stroke-width="10" stroke-linecap="round"/>
    <path d="M24 80 L30 73" stroke="#ffd9a8" stroke-width="3" stroke-linecap="round"/>
    <circle cx="60" cy="40" r="23" fill="rgba(255,255,255,.45)"/>
    <g clip-path="url(#netc)" stroke="#fff" stroke-width="2.4"><path d="M30 20 L90 56 M30 32 L84 66 M34 10 L94 44 M44 70 L72 8 M34 64 L62 6 M56 74 L86 14"/></g>
    <circle cx="60" cy="40" r="23" fill="none" stroke="#b07a00" stroke-width="10"/><circle cx="60" cy="40" r="23" fill="none" stroke="#ffd23a" stroke-width="6.5"/></svg>`,
  brush: `<svg viewBox="0 0 100 100"><rect x="42" y="10" width="16" height="38" rx="8" fill="#ff5a4e" stroke="#9e231b" stroke-width="3"/>
    <rect x="46" y="14" width="4" height="22" rx="2" fill="#ffb3ad"/>
    <path d="M24 60 L20 88 M32 60 L30 90 M41 60 L40 91 M50 60 L50 92 M59 60 L60 91 M68 60 L70 90 M76 60 L80 88" stroke="#c9b37a" stroke-width="7" stroke-linecap="round"/>
    <path d="M24 60 L20 88 M32 60 L30 90 M41 60 L40 91 M50 60 L50 92 M59 60 L60 91 M68 60 L70 90 M76 60 L80 88" stroke="#fff3cf" stroke-width="4" stroke-linecap="round"/>
    <rect x="18" y="42" width="64" height="20" rx="8" fill="#ffd23a" stroke="#a87b00" stroke-width="3"/><rect x="24" y="46" width="30" height="4" rx="2" fill="#fff3b0"/></svg>`,
  shuffle: `<svg viewBox="0 0 100 100">${['#ff4b4b', '#3c7cff', '#2fc46b', '#ffcf2e'].map((c, i) =>
    `<path transform="rotate(${i * 90} 50 50)" d="M50 50 L50 12 Q78 14 74 42 Z" fill="${c}" stroke="${shade(c, -.35)}" stroke-width="3" stroke-linejoin="round"/>`).join('')}
    <circle cx="50" cy="50" r="8" fill="#c98a4a" stroke="#7a4a1c" stroke-width="3"/></svg>`,
};

// ---------- Start ----------
function init() {
  buildSpeciesDefs();
  document.querySelectorAll('.coin-pill .ci').forEach(e => e.innerHTML = COIN);
  $('#menu-version').textContent = `v${APP_VERSION}`;
  Sfx.enabled = save.sound;
  Sfx.music = save.music;
  document.querySelectorAll('[data-booster]').forEach(b => {
    b.querySelector('.bicon').innerHTML = BOOSTER_ICONS[b.dataset.booster];
    b.addEventListener('click', () => useBooster(b.dataset.booster));
  });
  $('#hero').innerHTML = `<div class="h1">${creatureSVG('zitrino')}</div><div class="h2">${creatureSVG('schildi')}</div><div class="h3">${creatureSVG('rosalie')}</div><div class="h4">${creatureSVG('okti')}</div>`;
  $('#board').addEventListener('click', onBoardTap);
  document.querySelector('.shelf').addEventListener('click', e => { if (e.target.closest('.locked, .buy')) { Sfx.click(); offerBowl(); } });
  $('#btn-play').addEventListener('click', () => { Sfx.unlock(); Sfx.click(); startLevel(save.level); });
  $('#btn-aqua').addEventListener('click', () => { Sfx.click(); openAquarium(); });
  $('#btn-aqua-back').addEventListener('click', () => { Sfx.click(); openMenu(); });
  $('#btn-aqua-play').addEventListener('click', () => { Sfx.click(); startLevel(save.level); });
  document.querySelectorAll('.btn-settings').forEach(b => b.addEventListener('click', () => { Sfx.click(); openSettings(); }));
  $('#btn-help').addEventListener('click', () => {
    showModal(`<div class="ribbon">Booster</div>
      ${Object.entries(BOOSTER_INFO).map(([k, v]) => `<div class="binfo"><div class="ricon">${BOOSTER_ICONS[k]}</div><div><b>${v.name}</b><br>${v.desc}</div></div>`).join('')}
      <button class="btn green" data-act="close">Alles klar</button>`, { close: hideModal });
  });
  $('#modal').addEventListener('click', e => {
    const a = e.target.closest('[data-act]');
    if (a && modalActs[a.dataset.act]) { Sfx.click(); modalActs[a.dataset.act](); }
  });
  $('#modal').addEventListener('change', e => {
    const k = e.target.dataset.set;
    if (!k) return;
    save[k] = e.target.checked; persist();
    if (k === 'sound') Sfx.enabled = save.sound;
    if (k === 'music') { Sfx.music = save.music; Sfx.unlock(); }
    if (k === 'vib') vib(20);
  });
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (G && !$('#screen-game').hidden) commit(() => {}); }, 120); });
  document.addEventListener('pointerdown', () => Sfx.unlock(), { once: true });
  openMenu();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
document.addEventListener('DOMContentLoaded', init);
