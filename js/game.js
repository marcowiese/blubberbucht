// Blubberbucht – Spiellogik
'use strict';

const APP_VERSION = '1.17.1'; // nicht von Hand ändern: tools/release.sh <version>
const TRAY = 6, BOWLS = 4, BOWL_PRICE = 650, BOOSTER_PRICE = 200;
const SAVE_KEY = 'blubberbucht-v1';
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = n => Math.floor(Math.random() * n);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---------- Speicherstand ----------
const DEFAULTS = { level: 1, boosters: { net: 1, brush: 1, shuffle: 1 }, caught: {}, aquarium: [], sound: true, music: true, vib: true, seen: 3, coins: 100, stars: {}, tutorialDone: false, daily: { last: '', streak: 0 } };
let save = loadSave();
function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    return { ...DEFAULTS, ...s, boosters: { ...DEFAULTS.boosters, ...(s.boosters || {}) }, stars: { ...(s.stars || {}) } };
  } catch { return structuredClone(DEFAULTS); }
}
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch {} }
// Vibration nur dort, wo der Browser sie unterstützt (Android). Auf iPhone/iPad gibt es keine Option dafür.
const canVibrate = typeof navigator.vibrate === 'function';
const vib = ms => { if (canVibrate && save.vib) { try { navigator.vibrate(ms); } catch {} } };

// ---------- Level-Aufbau ----------
// Schwierigkeit: jedes 5. Level „Schwer“, jedes 10. „Extrem schwer“
const DIFF = { s: .5, smax: 5, sl: 60, t0: 9, t: .35, tmax: 18, hardS: 1, hardT: 3, extS: 2, extT: 3 };
// Neue Art alle 3 Level (Level 1: 3 Arten). Fantasietiere kommen ab ca. Level 67.
const unlockedCount = L => Math.min(SPECIES.length, 3 + Math.floor((L - 1) / 3));
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

const COLS_X = [17.5, 50, 82.5], R0 = 17.4, PLAY_H = 102;

let G = null;

function genLevel(L) {
  const p = levelParams(L);
  const board = $('#board');
  // Feste Spielfeldhöhe: Auf jedem Gerät und in jeder Ausrichtung sind gleich viele Blasen sichtbar.
  const H = PLAY_H, T = p.T;
  // jede Blase startet mit genau 3 Tieren
  const caps = Array(T).fill(3);
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
    cr[uid] = { uid, sp: list.pop(), rot: (Math.random() - .5) * 16, flip: Math.random() < .2, slot: k };
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
    let y = G.H - (c === 1 ? R0 * .9 : 1), prev = null;
    for (const id of col) {
      const b = byId.get(id);
      y -= prev ? (prev.r + b.r) * .84 : b.r;   // Blasen überlappen leicht, wie aufgetürmt
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
  const oldY = new Map(G.bubbles.map(b => [b.id, b.y]));
  relayout();
  // Blasen, die gerade nachrutschen, kurz nicht antippbar machen – sonst trifft man leicht das falsche Tier
  const until = performance.now() + 480;
  G.bubbles.forEach(b => { if (Math.abs((oldY.get(b.id) ?? b.y) - b.y) > .5) b.moveUntil = until; });
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
// Positionen (x, y, Größe) relativ zur Blase – so gewählt, dass die Tiere im Kreis bleiben
const POS = {
  1: [[.5, .5, .66]],
  2: [[.35, .39, .54], [.65, .63, .54]],
  3: [[.31, .35, .48], [.69, .37, .48], [.5, .7, .48]],
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
    // Jedes Tier behält seinen Platz in der Blase – nichts rückt nach, wenn eines herausgenommen wird
    const pos = POS[b.cap] || POS[3];
    const crs = new Map([...el.querySelectorAll('.cr')].map(c => [c.dataset.uid, c]));
    b.items.forEach((u, i) => {
      let c = crs.get(u);
      if (!c) { el.insertAdjacentHTML('beforeend', crHTML(u)); c = el.lastElementChild; }
      crs.delete(u);
      const p = pos[G.cr[u].slot] || pos[i] || POS[3][i];
      Object.assign(c.style, { left: p[0] * 100 + '%', top: p[1] * 100 + '%', width: p[2] * 100 + '%' });
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
    // abgebrochener Flug: Kopie weg und das echte Tier wieder sichtbar machen (sonst bleibt es unsichtbar)
    if (f) { f.anim.cancel(); f.clone.remove(); flying.delete(u); el.style.visibility = ''; }
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
  // Sicherheitsnetz: Kein Tier darf ohne laufenden Flug unsichtbar bleiben
  document.querySelectorAll('#screen-game .cr[data-uid]').forEach(el => {
    if (el.style.visibility === 'hidden' && !flying.has(el.dataset.uid)) el.style.visibility = '';
  });
}
// Beim Drehen/Größenändern: laufende Flüge sofort beenden (sonst bleiben Kopien stehen),
// Spielfeld an das neue Format anpassen und ohne Animation neu zeichnen.
function finishFlights() {
  flying.forEach(f => { f.anim.cancel(); f.clone.remove(); });
  flying.clear();
  document.querySelectorAll('#fx .cr.flying').forEach(c => c.remove());
  document.querySelectorAll('#screen-game .cr[data-uid]').forEach(el => el.style.visibility = '');
}
function onResize() {
  if (!G || $('#screen-game').hidden) return;
  finishFlights();
  const board = $('#board');
  relayout();
  document.body.classList.add('no-anim');
  render();
  void document.body.offsetWidth;
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('no-anim')));
  setTimeout(tutRender, 60);
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
  // Sicherheitsnetz: verlorenes Level ohne offenes Fenster -> Fenster wieder zeigen
  if (G && G.over && G.lostReason && $('#modal').hidden) { loseLevel(G.lostReason); return; }
  if (!G || G.over || G.paused) return;
  const bEl = e.target.closest('.bubble');
  if (!bEl) return;
  const b = G.bubbles.find(x => x.id === +bEl.dataset.b);
  if (!b || !b.items.length) return;
  if (b.moveUntil && performance.now() < b.moveUntil) return;
  if (isBlocked(b)) { shake(bEl); Sfx.error(); return; }
  let uid = e.target.closest('.cr[data-uid]')?.dataset.uid;
  if (!uid) {
    let best = 1e9;
    bEl.querySelectorAll('.cr[data-uid]').forEach(c => {
      const r = c.getBoundingClientRect(), d = Math.hypot(r.left + r.width / 2 - e.clientX, r.top + r.height / 2 - e.clientY);
      if (d < best) { best = d; uid = c.dataset.uid; }
    });
  }
  if (uid && TUT.step === 2 && uid !== TUT.target) { shake(document.querySelector(`#stage .cr[data-uid="${TUT.target}"]`)?.closest('.bubble') || bEl); return; }
  if (uid) { Sfx.pop(); pick(uid); tutPicked(uid); }
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
    take.forEach((u, i) => G.cr[u].slot = i);
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
  commit(() => G.bubbles.forEach(b => {
    const slots = b.items.map(u => G.cr[u].slot), n = b.items.length;
    b.items = all.slice(k, k + n); k += n;
    b.items.forEach((u, i) => G.cr[u].slot = slots[i]);
  }));
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
  if (updateWaiting && applyUpdate()) return;
  checkForUpdate();
  hideModal(); clearFx();
  showScreen('game');
  requestAnimationFrame(() => {
    G = genLevel(L);
    relayout();
    settle();
    $('#stage').innerHTML = '';
    render();
    startTimer();
    if (L === 1 && !save.tutorialDone) setTimeout(tutStart, 700);
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
  const replay = L < save.level;
  save.level = Math.max(save.level, L + 1);
  const starsWon = G.usedBoosters === 0 ? 3 : G.usedBoosters <= 2 ? 2 : 1;
  const before = save.stars[L] || 0;
  save.stars[L] = Math.max(before, starsWon);
  // Erstes Mal: volle Belohnung. Wiederholung: kleiner Grundbetrag + Bonus für jeden neu verdienten Stern
  const newStars = Math.max(0, starsWon - before);
  const coins = replay ? 5 + newStars * 10 : 10 + starsWon * 5 + [0, 15, 30][G.tier];
  save.coins += coins;
  let reward = `<div class="reward coins">${COIN}<span>+${coins} Münzen</span></div>`;
  if (replay && newStars) reward += `<p class="small">Neuer Rekord: ${starsWon} Sterne!</p>`;
  if (!replay && L % 5 === 0) {
    const k = ['net', 'brush', 'shuffle'][rand(3)];
    save.boosters[k] = (save.boosters[k] || 0) + 1;
    reward += `<div class="reward"><div class="ricon">${BOOSTER_ICONS[k]}</div><span>+1 ${BOOSTER_INFO[k].name}</span></div>`;
  }
  persist();
  const newCard = replay ? -1 : POSTCARDS.findIndex(pc => pc.level === L);
  const species = [...new Set(Object.values(G.cr).map(c => c.sp))];
  const stars = G.usedBoosters === 0 ? 3 : G.usedBoosters <= 2 ? 2 : 1;
  showModal(`
    <div class="ribbon">Level ${L} geschafft!</div>
    <div class="stars">${[1, 2, 3].map(i => `<span class="${i <= stars ? 'on' : ''}">★</span>`).join('')}</div>
    <p>${G.total} Tiere sortiert – neue Bewohner für dein Aquarium:</p>
    <div class="mini-row">${species.map(s => `<div>${creatureSVG(s)}</div>`).join('')}</div>
    ${reward}
    <button class="btn green" data-act="next">Weiter</button>
    <button class="btn ghost" data-act="map">Levelkarte</button>`, {
    next: () => newCard >= 0 ? showPostcard(newCard, true, () => startLevel(L + 1)) : startLevel(L + 1),
    map: () => { hideModal(); openMap(); },
    aqua: () => { hideModal(); openAquarium(); },
  });
}

function loseLevel(reason) {
  clearInterval(timerId);
  if (G) G.lostReason = reason;
  Sfx.lose(); vib([60, 40, 60]);
  const L = G.level;
  const acts = {
    retry: () => startLevel(L),
    menu: () => { hideModal(); openMenu(); },
    brush: () => { hideModal(); G.over = false; G.lostReason = null; useBooster('brush'); startTimer(); },
    buybrush: () => {
      if (!spend(BOOSTER_PRICE)) return;
      save.boosters.brush = (save.boosters.brush || 0) + 1; persist();
      hideModal(); G.over = false; G.lostReason = null; useBooster('brush'); startTimer();
    },
    time: () => { hideModal(); G.over = false; G.lostReason = null; G.extraTime = true; G.timeLeft += 20; startTimer(); renderHUD(); },
  };
  let opts = '';
  if (reason === 'tray') {
    if (save.boosters.brush) opts += `<button class="btn orange" data-act="brush">Aufräumen nutzen (${save.boosters.brush})</button>`;
    // Nur „Aufräumen“ hilft: es holt Tiere aus der Ablage. Wirbel/Kescher leeren die Ablage nicht.
    else if (save.coins >= BOOSTER_PRICE) opts += `<button class="btn orange" data-act="buybrush">Aufräumen kaufen & nutzen (${COIN} ${BOOSTER_PRICE})</button>`;
    else opts += `<button class="btn orange" disabled>Aufräumen kaufen (${COIN} ${BOOSTER_PRICE})<small class="need">Du hast nur ${save.coins} Münzen</small></button>`;
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
    ${canVibrate ? `<label class="toggle"><span>📳 Vibration</span><input type="checkbox" data-set="vib" ${save.vib ? 'checked' : ''}><i></i></label>` : ''}
    <div class="help">
      <b>So geht's:</b> Tippe Tiere in den Blasen an. Passt ein Tier zu einer Karte unter den Gläsern, schwimmt es ins Glas – sonst landet es in der Ablage.
      Drei gleiche im Glas = gesammelt! Leere Blasen platzen und von oben rutschen neue nach. Ist die Ablage voll, ist das Level verloren.
    </div>
    ${inGame ? `<button class="btn blue" data-act="tutorial">❓ Anleitung zeigen</button><button class="btn orange" data-act="restart">Level neu starten</button><button class="btn ghost" data-act="menu">Hauptmenü</button>` : ''}
    <button class="btn green" data-act="close">Weiter</button>
    ${inGame ? '' : `<button class="btn blue" data-act="transfer">💾 Spielstand übertragen</button><button class="btn link" data-act="reset">Fortschritt zurücksetzen</button>`}
    <p class="version">Blubberbucht v${APP_VERSION} · von Hase Games</p>`, {
    close: hideModal,
    restart: () => startLevel(G.level),
    tutorial: () => { hideModal(); tutStart(); },
    transfer: () => openTransfer(draw),
    menu: () => { hideModal(); openMenu(); },
    reset: () => showModal(`<div class="ribbon red">Wirklich?</div><p>Level, Booster und Aquarium werden gelöscht.</p>
      <button class="btn orange" data-act="yes">Ja, zurücksetzen</button><button class="btn green" data-act="no">Abbrechen</button>`, {
      yes: () => { save = structuredClone(DEFAULTS); persist(); hideModal(); openMenu(); },
      no: draw,
    }),
  });
  draw();
}

// ---------- Spielstand übertragen (Code, ganz ohne Server oder Konto) ----------
const b64u = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = str => Uint8Array.from(atob(str.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
async function pipe(bytes, stream) { return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer()); }
async function exportCode() {
  const data = { ...save }; delete data.daily;            // tägliche Serie bleibt am Gerät
  const raw = new TextEncoder().encode(JSON.stringify(data));
  if (typeof CompressionStream === 'function') return 'BB2-' + b64u(await pipe(raw, new CompressionStream('deflate-raw')));
  return 'BB1-' + b64u(raw);
}
async function importCode(code) {
  code = code.trim().replace(/\s+/g, '');
  const [tag, body] = [code.slice(0, 4), code.slice(4)];
  let bytes = unb64u(body);
  if (tag === 'BB2-') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
  else if (tag !== 'BB1-') throw new Error('format');
  const data = JSON.parse(new TextDecoder().decode(bytes));
  if (typeof data.level !== 'number' || typeof data.coins !== 'number') throw new Error('inhalt');
  return data;
}
function openTransfer(back) {
  showModal(`<div class="ribbon">Spielstand übertragen</div>
    <p class="small">So nimmst du deinen Fortschritt auf ein anderes Gerät mit: Code hier kopieren und auf dem anderen Gerät unter „Code eingeben“ einfügen.</p>
    <button class="btn green" data-act="copy">📋 Code kopieren</button>
    <textarea id="xfer-code" class="xfer" placeholder="Code vom anderen Gerät hier einfügen …" rows="3"></textarea>
    <button class="btn orange" data-act="load">Code eingeben</button>
    <button class="btn ghost" data-act="back">Zurück</button>`, {
    back,
    copy: async () => {
      const code = await exportCode();
      const ta = $('#xfer-code'); ta.value = code;
      try { await navigator.clipboard.writeText(code); toast('Code kopiert – jetzt auf dem anderen Gerät einfügen.'); }
      catch { ta.select(); toast('Code markiert – bitte kopieren.'); }
      if (navigator.share && /iPhone|iPad|Android/i.test(navigator.userAgent)) navigator.share({ title: 'Blubberbucht-Spielstand', text: code }).catch(() => {});
    },
    load: async () => {
      let data;
      try { data = await importCode($('#xfer-code').value); }
      catch { toast('Der Code ist ungültig.'); Sfx.error(); return; }
      showModal(`<div class="ribbon red">Spielstand ersetzen?</div>
        <p>Gefundener Spielstand: <b>Level ${data.level}</b>, ${data.coins} Münzen.</p>
        <p class="small">Der Fortschritt auf diesem Gerät wird dabei überschrieben.</p>
        <button class="btn orange" data-act="yes">Ja, übernehmen</button><button class="btn green" data-act="no">Abbrechen</button>`, {
        yes: () => {
          save = { ...DEFAULTS, ...data, boosters: { ...DEFAULTS.boosters, ...(data.boosters || {}) }, stars: { ...(data.stars || {}) }, daily: save.daily };
          persist(); hideModal(); Sfx.enabled = save.sound; Sfx.music = save.music; openMenu(); toast('Spielstand übernommen!');
        },
        no: () => openTransfer(back),
      });
    },
  });
}

// ---------- Update-Prüfung ----------
// version.json wird bei jeder Veröffentlichung mit hochgezählt. Ist dort eine andere Version
// als die geladene eingetragen, lädt das Spiel neu – aber nie mitten in einem laufenden Level.
let updateWaiting = false, swReg = null;
async function checkForUpdate() {
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return false;
  try {
    const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) return false;
    const { version } = await r.json();
    if (!version || version === APP_VERSION) return false;
    // Schutz gegen Endlosschleife, falls der Server kurz noch alte Dateien liefert
    const tried = sessionStorage.getItem('bb-update-tried');
    if (tried === version) return false;
    updateWaiting = version;
    swReg?.update().catch(() => {});
    return true;
  } catch { return false; }
}
function applyUpdate() {
  if (!updateWaiting) return false;
  try { sessionStorage.setItem('bb-update-tried', updateWaiting); } catch {}
  toast(`Neue Version ${updateWaiting} wird geladen …`);
  setTimeout(() => location.reload(), 600);
  return true;
}
const inLevel = () => G && !G.over && !$('#screen-game').hidden;
async function updateIfIdle() { if (await checkForUpdate() && !inLevel()) applyUpdate(); }

// ---------- Tutorial (Level 1 bzw. über die Einstellungen) ----------
const TUT = { step: 0, target: null };
function tutEl() {
  let t = $('#tut');
  if (!t) {
    t = document.createElement('div');
    t.id = 'tut';
    t.innerHTML = `<div class="tut-block"></div><div class="tut-ring"></div><div class="tut-finger">👆</div><div class="tut-box"><p></p><button class="btn green"></button></div>`;
    document.body.appendChild(t);
    t.querySelector('.tut-box .btn').addEventListener('click', () => { Sfx.click(); tutNext(); });
  }
  return t;
}
function tutStart() { if (!G) return; TUT.step = 1; tutRender(); }
function tutStop() {
  TUT.step = 0; TUT.target = null;
  $('#tut')?.remove();
  save.tutorialDone = true; persist();
  if (G) G.paused = false;
}
function tutNext() {
  if (TUT.step === 1) {
    // passendes, antippbares Tier suchen
    const u = G.bubbles.filter(b => b.items.length && !isBlocked(b)).flatMap(b => b.items).find(x => openBowlFor(G.cr[x].sp));
    if (u) { TUT.target = u; TUT.step = 2; } else TUT.step = 4;
  } else if (TUT.step >= 3 && TUT.step < 7) TUT.step++;
  else if (TUT.step === 7) return tutStop();
  tutRender();
}
function tutPicked(uid) {               // aus pick(): Zieltier wurde angetippt
  if (TUT.step !== 2 || uid !== TUT.target) return;
  TUT.step = 3; TUT.bowl = G.bowls.indexOf(G.bowls.find(w => w.items.includes(uid)));
  $('#tut').style.visibility = 'hidden';
  setTimeout(() => { if (TUT.step === 3) { $('#tut').style.visibility = ''; tutRender(); } }, 750);
}
function tutRender() {
  if (!TUT.step || !G) return;
  const t = tutEl();
  G.paused = TUT.step !== 2;            // in Schritt 2 darf (nur) das Zieltier angetippt werden
  let el, text, btn = 'Weiter', block = true;
  if (TUT.step === 1) { el = document.querySelector('#cards .card'); text = 'Unter jedem Glas zeigt eine <b>Karte</b>, welches Tier hinein gehört.'; }
  if (TUT.step === 2) { el = document.querySelector(`#stage .cr[data-uid="${TUT.target}"]`); text = 'Tippe dieses Tier an – es schwimmt ins passende Glas.'; btn = ''; block = false; }
  if (TUT.step === 3) { el = document.querySelector(`[data-bowl="${TUT.bowl}"]`); text = 'Super! Sind <b>3 gleiche</b> Tiere im Glas, sind sie gesammelt und das Glas bekommt eine neue Karte.'; }
  if (TUT.step === 4) { el = $('#tray'); text = 'Passt ein Tier zu keiner Karte, landet es in der <b>Ablage</b>. Ist die Ablage voll, ist das Level verloren – also gut planen!'; }
  if (TUT.step === 5) { el = document.querySelector('[data-booster="net"]'); text = '<b>Kescher:</b> fängt die fehlenden Tiere für ein Glas – auch aus Blasen, die noch weit oben hängen.'; }
  if (TUT.step === 6) { el = document.querySelector('[data-booster="brush"]'); text = '<b>Aufräumen:</b> holt bis zu 3 Tiere aus der Ablage zurück in eine Blase. Die Rettung, wenn die Ablage voll wird!'; }
  if (TUT.step === 7) { el = document.querySelector('[data-booster="shuffle"]'); text = '<b>Wirbel:</b> mischt alle Tiere in den Blasen neu – praktisch, wenn gerade nichts passt. Booster bekommst du als Belohnung oder für Münzen.'; btn = "Los geht's!"; }
  if (!el) return tutStop();
  const r = el.getBoundingClientRect(), pad = 8;
  Object.assign(t.querySelector('.tut-ring').style, { left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.width + pad * 2 + 'px', height: r.height + pad * 2 + 'px' });
  t.querySelector('.tut-block').style.pointerEvents = block ? 'auto' : 'none';
  const f = t.querySelector('.tut-finger');
  f.hidden = TUT.step !== 2;
  Object.assign(f.style, { left: r.left + r.width / 2 + 'px', top: r.bottom + 'px' });
  const box = t.querySelector('.tut-box');
  box.querySelector('p').innerHTML = text;
  const b = box.querySelector('.btn'); b.hidden = !btn; b.textContent = btn;
  // Textbox unter das Ziel, außer es ist zu weit unten
  const below = r.bottom + 170 < innerHeight;
  box.style.top = below ? (r.bottom + (TUT.step === 2 ? 70 : 20)) + 'px' : '';
  box.style.bottom = below ? '' : (innerHeight - r.top + 20) + 'px';
}

// ---------- Postkarten ----------
function showPostcard(i, isNew = false, after = hideModal) {
  const pc = POSTCARDS[i];
  showModal(`<div class="ribbon">${isNew ? 'Neue Postkarte!' : 'Postkarte'}</div>
    <div class="pc-big">${postcardArt(pc)}</div>
    <h2>${pc.title}</h2>
    <p class="pc-level">🏆 Erobert in Level ${pc.level}</p>
    <p>${pc.text}</p>
    <button class="btn blue" data-act="save">📥 In Fotos speichern</button>
    <button class="btn green" data-act="close">${isNew ? 'Weiter' : 'Schließen'}</button>`, {
    close: after,
    save: async () => {
      toast('Postkarte wird vorbereitet …');
      try {
        const r = await savePostcard(pc);
        if (r === 'downloaded') toast('Postkarte gespeichert.');
      } catch { toast('Speichern hat leider nicht geklappt.'); Sfx.error(); }
    },
  });
  $('#modal .panel').classList.add('wide');
}

// ---------- Levelkarte: Level 1 an der Oberfläche, je weiter, desto tiefer ----------
function openMap() {
  clearInterval(timerId);
  showScreen('map');
  renderCoins();
  const cur = save.level, last = cur + 8;
  const totalStars = Object.values(save.stars).reduce((a, b) => a + b, 0);
  $('#map-stats').textContent = `${cur - 1} Level geschafft · ${totalStars} ★ gesammelt`;
  const STEP = 24, X = i => 50 + Math.sin(i * .85) * 28;       // Einheiten in --u
  const pts = [];
  let nodes = '', marks = '';
  for (let L = 1; L <= last; L++) {
    const x = X(L), y = 14 + (L - 1) * STEP;
    pts.push(`${x},${y}`);
    const tier = tierOf(L), st = save.stars[L] || 0, locked = L > cur, current = L === cur;
    nodes += `<button class="node t${tier} ${locked ? 'locked' : ''} ${current ? 'current' : ''}" data-level="${L}" style="left:calc(${x} * var(--u));top:calc(${y} * var(--u))" ${locked ? 'disabled' : ''}>
      <b>${locked ? '🔒' : L}</b>${tier ? `<i class="flame">${tier === 2 ? '🔥🔥' : '🔥'}</i>` : ''}
      ${!locked && !current ? `<span class="nstars">${[1, 2, 3].map(i => `<em class="${i <= st ? 'on' : ''}">★</em>`).join('')}</span>` : ''}
    </button>`;
    if (L % 10 === 0) marks += `<div class="depth" style="top:calc(${y} * var(--u))">${L * 10} m</div>`;
  }
  const H = 14 + (last - 1) * STEP + 20;
  $('#map').style.height = `calc(${H} * var(--u))`;
  $('#map').innerHTML = `<svg class="map-path" viewBox="0 0 100 ${H}" preserveAspectRatio="none"><polyline points="${pts.join(' ')}" /></svg>${marks}${nodes}`;
  requestAnimationFrame(() => {
    const el = document.querySelector('.node.current');
    if (el) el.scrollIntoView({ block: 'center' });
  });
}

// ---------- Screens ----------
function showScreen(name) {
  if (TUT.step) { TUT.step = 0; $('#tut')?.remove(); }
  document.querySelectorAll('.screen').forEach(s => s.hidden = s.id !== 'screen-' + name);
}
function openMenu() {
  if (updateWaiting && applyUpdate()) return;
  clearInterval(timerId); clearFx();
  G = null;
  $('#menu-level').textContent = `Level ${save.level}`;
  renderCoins();
  showScreen('menu');
  setTimeout(checkDaily, 500);
}

// ---------- Tägliche Belohnung: 7-Tage-Serie, wer einen Tag auslässt, beginnt wieder bei Tag 1 ----------
const DAILY = [
  { coins: 20 }, { coins: 30 }, { booster: 1 }, { coins: 40 }, { coins: 50 }, { booster: 1 }, { coins: 100, booster: 1 },
];
const dayStr = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function checkDaily() {
  if (!$('#screen-menu') || $('#screen-menu').hidden || !$('#modal').hidden) return;
  const today = dayStr();
  const d = save.daily || { last: '', streak: 0 };
  if (d.last === today) return;
  const y = new Date(); y.setDate(y.getDate() - 1);
  const day = d.last === dayStr(y) ? (d.streak % 7) + 1 : 1;   // 1..7
  const tile = (r, i) => {
    const n = i + 1, cls = n < day ? 'got' : n === day ? 'today' : '';
    const what = [r.coins ? `${COIN}<b>${r.coins}</b>` : '', r.booster ? `<span class="dbooster">🎁</span>` : ''].join('');
    return `<div class="dtile ${cls} ${n === 7 ? 'big' : ''}"><small>Tag ${n}</small><div class="dwhat">${what}</div>${n < day ? '<i>✓</i>' : ''}</div>`;
  };
  showModal(`<div class="ribbon">Tägliche Belohnung</div>
    <p>${day === 1 ? 'Schau jeden Tag vorbei – die Belohnung wird größer!' : `Tag ${day} in Folge – weiter so!`}</p>
    <div class="daily">${DAILY.map(tile).join('')}</div>
    <button class="btn green" data-act="claim">Abholen</button>`, {
    claim: () => {
      const r = DAILY[day - 1];
      let got = [];
      if (r.coins) { save.coins += r.coins; got.push(`+${r.coins} Münzen`); }
      if (r.booster) {
        const k = ['net', 'brush', 'shuffle'][rand(3)];
        save.boosters[k] = (save.boosters[k] || 0) + 1; got.push(`+1 ${BOOSTER_INFO[k].name}`);
      }
      save.daily = { last: today, streak: day };
      persist(); renderCoins(); hideModal(); Sfx.match(); confetti();
      toast(got.join(' · '));
    },
  });
}
function openAquarium() {
  clearInterval(timerId);
  showScreen('aquarium');
  const tank = $('#tank-swim');
  const list = save.aquarium.slice(-24);
  tank.innerHTML = list.length ? list.map(sp => {
    const dur = 9 + Math.random() * 10, y = 8 + Math.random() * 72, size = 11 + Math.random() * 6;
    return `<div class="swimmer" style="top:${y}%;width:calc(${size} * var(--u));animation-duration:${dur}s;animation-delay:-${Math.random() * dur}s"><div class="bob">${creatureSVG(sp)}</div></div>`;
  }).join('') : `<p class="tank-empty">Noch leer – sammle Tiere im Spiel!</p>`;
  const total = Object.values(save.caught).reduce((a, b) => a + b, 0);
  $('#aqua-stats').textContent = `${total} Tiere gesammelt · ${Object.keys(save.caught).length}/${SPECIES.length} Arten`;
  renderAlbum();
}
let albumTab = 'animals';
function renderAlbum() {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.tab === albumTab));
  const al = $('#album');
  al.classList.toggle('cards', albumTab === 'cards');
  if (albumTab === 'cards') {
    al.innerHTML = POSTCARDS.map((pc, i) => {
      const open = save.level > pc.level;
      return `<button class="pcard ${open ? '' : 'locked'}" data-pc="${i}" ${open ? '' : 'disabled'}>${postcardSVG(pc)}
        <b>${open ? pc.title : `Ab Level ${pc.level}`}</b>${open ? `<small>🏆 Erobert in Level ${pc.level}</small>` : '<i>🔒</i>'}</button>`;
    }).join('') + `<p class="pc-more">Weitere Postkarten folgen …</p>`;
    return;
  }
  al.innerHTML = SPECIES.map((s, i) => {
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
  $('#btn-play').addEventListener('click', async () => {
    Sfx.unlock(); Sfx.click();
    if (await checkForUpdate()) { applyUpdate(); return; }
    startLevel(save.level);
  });
  $('#btn-aqua').addEventListener('click', () => { Sfx.click(); openAquarium(); });
  $('#btn-map').addEventListener('click', () => { Sfx.unlock(); Sfx.click(); openMap(); });
  $('#btn-map-back').addEventListener('click', () => { Sfx.click(); openMenu(); });
  $('#map').addEventListener('click', async e => {
    const n = e.target.closest('.node:not([disabled])');
    if (!n) return;
    Sfx.click();
    if (await checkForUpdate()) { applyUpdate(); return; }
    startLevel(+n.dataset.level);
  });
  $('#btn-aqua-back').addEventListener('click', () => { Sfx.click(); openMenu(); });
  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => { Sfx.click(); albumTab = t.dataset.tab; renderAlbum(); }));
  $('#album').addEventListener('click', e => { const c = e.target.closest('.pcard:not([disabled])'); if (c) { Sfx.click(); showPostcard(+c.dataset.pc); } });
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
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(onResize, 150); });
  window.addEventListener('orientationchange', () => { clearTimeout(rt); rt = setTimeout(onResize, 350); });
  document.addEventListener('pointerdown', () => Sfx.unlock(), { once: true });
  openMenu();
  updateIfIdle();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { updateIfIdle(); checkDaily(); } });
  setInterval(updateIfIdle, 5 * 60 * 1000);
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !G) location.reload(); });
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(r => { swReg = r; r.update(); }).catch(() => {});
  }
}
document.addEventListener('DOMContentLoaded', init);
