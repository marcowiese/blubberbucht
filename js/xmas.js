// Blubberbucht – Weihnachts-Theme
// Ein- und Ausschalten: XMAS = true / false (dann ist alles wieder wie vorher)
'use strict';

const XMAS = true;
if (XMAS) document.documentElement.classList.add('xmas');

// ---------- Weihnachtsmützen für alle Tiere ----------
// Mütze im eigenen Koordinatensystem: Mitte des Fellrands bei (0,0), Spitze zeigt nach oben/rechts
const HAT_SVG = `
  <path d="M-15 1 C-13 -12 -4 -25 9 -30 C15 -32 21 -28 23 -22 C15 -23 9 -15 14 1 Z" fill="url(#xhat)" stroke="#8e1020" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M-6 -12 C-2 -20 4 -25 10 -27" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2.4" stroke-linecap="round"/>
  <rect x="-18" y="-5" width="36" height="10" rx="5" fill="#fff" stroke="#c9d6e6" stroke-width="1.2"/>
  <circle cx="23" cy="-22" r="5.4" fill="#fff" stroke="#c9d6e6" stroke-width="1.2"/>`;

// Sitz der Mütze je Tier: [x, y, Drehung, Größe] im 100×100-Feld des Tiers
const HAT_FISH = { round: [36, 30, -18, .8], long: [35, 37, -16, .72], tall: [42, 27, -14, .78] };
const HAT_KIND = {
  crab: [50, 30, -6, .82], turtle: [26, 38, -16, .7], octopus: [50, 16, -8, .95], jelly: [50, 18, -6, .95],
  puffer: [44, 22, -12, .9], whale: [32, 34, -14, .82], star: [50, 14, -6, .7],
  seahorse: [50, 18, -12, .7], shrimp: [34, 34, -14, .66], ray: [50, 30, -6, .8], clam: [50, 26, -6, .85],
  urchin: [50, 24, -6, .85], snail: [26, 44, -14, .66], dragon: [36, 28, -16, .78], donut: [36, 26, -14, .8],
  cloudjelly: [50, 16, -6, .9], unicorn: [44, 24, -14, .8], ghost: [38, 26, -16, .8], robo: [38, 28, -14, .8],
  kingcrab: [50, 24, -6, .8], glitterocto: [50, 16, -8, .9], cactus: [38, 26, -14, .78], gum: [44, 22, -12, .88],
  shootingstar: [50, 14, -6, .7],
};
// Einzelkorrekturen pro Art (geprüft am großen Bild: Mütze sitzt über den Augen, nicht darauf)
const HAT_ID = {
  krabbe: [52, 21, -6, .74], schildi: [22, 31, -18, .6], seppi: [53, 14, -8, .6], igor: [50, 31, -6, .8],
  schnecki: [30, 34, 8, .58], bruno: [35, 21, -8, .58], kurt: [30, 30, -22, .72],
  krabbo: [69, 25, 16, .46],     // kleine schräge Mütze auf dem rechten Auge, Krone bleibt sichtbar
};

function hatAt(s) {
  return HAT_ID[s.id] || (s.kind === 'fish' ? HAT_FISH[s.shape] : HAT_KIND[s.kind]) || [45, 22, -12, .8];
}
function hatSVG(s) {
  const at = hatAt(s);
  if (at === 'none') return '';
  const [x, y, r, k] = at;
  return `<g class="xhat" transform="translate(${x} ${y}) rotate(${r}) scale(${k})">${HAT_SVG}</g>`;
}

if (XMAS) {
  for (const k of Object.keys(DRAWERS)) {
    const draw = DRAWERS[k];
    DRAWERS[k] = s => draw(s) + hatSVG(s);
  }
  // gemeinsamer Farbverlauf für alle Mützen
  const _build = buildSpeciesDefs;
  buildSpeciesDefs = function () {
    _build();
    const svg = document.body.firstChild;
    svg.insertAdjacentHTML('afterbegin', `<defs><linearGradient id="xhat" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5a5f"/><stop offset=".6" stop-color="#e3242f"/><stop offset="1" stop-color="#b3121f"/></linearGradient></defs>`);
  };
}

if (XMAS) {
  const tl = document.querySelector('.tagline');
  if (tl) tl.textContent = 'Frohe Weihnachten in der Bucht!';
}

// ---------- Weihnachtstiere: nur in der Weihnachtszeit (XMAS = true) ----------
// In jedem Level ersetzt eine Weihnachtsart eine der normalen Arten (gleiche Artenzahl -> gleiche Schwierigkeit).
// Ohne Theme tauchen sie nirgends auf; der Fang bleibt im Speicherstand und ist nächstes Jahr wieder sichtbar.
function drawSnowPuffer(s) {
  let d = drawPuffer(s);
  // Karottennase, Kohle-Lächeln, Knöpfe, Schal (alten Kugelfisch-Mund überdecken)
  d += `<ellipse cx="26" cy="58" rx="5" ry="4.6" fill="#e4ecf6"/>`;
  d += `<path d="M31 54 L11 51 L31 49 Z" fill="#ff8a1f" stroke="#c25a00" stroke-width="1.4" stroke-linejoin="round"/><path d="M24 51.5 l2 -1.6 M19 51 l1.6 -1.2" stroke="#c25a00" stroke-width="1"/>`;
  for (const [x, y] of [[22, 61], [27, 64.5], [33, 66], [39, 65]]) d += `<circle cx="${x}" cy="${y}" r="1.9" fill="#2b2d42"/>`;
  for (const [x, y] of [[60, 42], [63, 52]]) d += `<circle cx="${x}" cy="${y}" r="2.8" fill="#2b2d42"/>`;
  d += `<path d="M28 72 Q52 86 78 70" fill="none" stroke="#8e1020" stroke-width="9.5" stroke-linecap="round"/><path d="M28 72 Q52 86 78 70" fill="none" stroke="#e3242f" stroke-width="7" stroke-linecap="round" stroke-dasharray="7 4"/>`;
  d += `<path d="M64 76 l6 16 l7 -3 l-5 -15" fill="#e3242f" stroke="#8e1020" stroke-width="1.6" stroke-linejoin="round"/><path d="M68 85 l6 -2" stroke="#fff" stroke-width="2"/>`;
  return d;
}
function drawReindeerFish(s) {
  let d = `<path d="M33 28 q-3 -10 -9 -15 M28 20 q-7 -1 -10 -6 M44 26 q1 -11 8 -16 M48 16 q6 1 10 -3" fill="none" stroke="#6a3e1a" stroke-width="4.4" stroke-linecap="round"/>`
    + `<path d="M33 28 q-3 -10 -9 -15 M28 20 q-7 -1 -10 -6 M44 26 q1 -11 8 -16 M48 16 q6 1 10 -3" fill="none" stroke="#a8743e" stroke-width="2.4" stroke-linecap="round"/>`;
  d += drawFish(s);
  d += `<circle cx="24" cy="54" r="6.5" fill="#ff2e3f" stroke="#a8101e" stroke-width="1.6"/><circle cx="22" cy="52" r="2" fill="#fff" opacity=".8"/>`;
  return d;
}
function drawGingerStar(s) {
  let d = drawStar(s), pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 15 : 37;
    pts.push(`${(50 + Math.cos(a) * r).toFixed(1)},${(54 + Math.sin(a) * r).toFixed(1)}`);
  }
  d += `<polygon points="${pts.join(' ')}" fill="none" stroke="#fff" stroke-width="2.2" stroke-dasharray="4 3" stroke-linejoin="round" stroke-linecap="round" opacity=".95"/>`;
  for (const [x, y, c] of [[50, 22, '#ff4d5e'], [79, 44, '#5be37a'], [68, 80, '#4db8ff'], [32, 80, '#ffd23a'], [21, 44, '#ff8fd0']])
    d += `<circle cx="${x}" cy="${y}" r="3.4" fill="${c}" stroke="#fff" stroke-width="1"/>`;
  return d;
}
function drawTreeJelly(s) {
  const c = s.body, o = shade(c, -.4), g = `g-${s.id}`;
  let d = `<defs>${grad(g, c)}</defs>`;
  for (const [x, col] of [[34, '#ffd23a'], [44, '#dfe8f5'], [56, '#ffd23a'], [66, '#dfe8f5']])
    d += `<path d="M${x} 70 q5 5 0 9 q-5 4 0 9 q4 3 0 6" fill="none" stroke="${col}" stroke-width="3.4" stroke-linecap="round"/>`;
  const tree = 'M50 12 L68 33 L61 33 L77 52 L69 52 L85 72 Q50 78 15 72 L31 52 L23 52 L39 33 L32 33 Z';
  d += `<path d="${tree}" fill="url(#${g})" fill-opacity=".95" stroke="${o}" stroke-width="2.2" stroke-linejoin="round"/>`;
  d += `<path d="M38 36 Q50 42 62 36 M30 55 Q50 62 70 55" fill="none" stroke="#ffd23a" stroke-width="2" opacity=".85"/>`;
  for (const [x, y, col] of [[40, 38, '#ff4d5e'], [60, 38, '#4db8ff'], [26, 66, '#ffd23a'], [74, 66, '#ff4d5e'], [33, 58, '#4db8ff'], [67, 58, '#ffd23a'], [50, 70, '#ff8fd0']])
    d += `<circle cx="${x}" cy="${y}" r="2.6" fill="${col}" stroke="#fff" stroke-width=".8"/>`;
  d += `<path d="M50 2 L52.6 8.4 L59.5 8.9 L54.2 13.2 L55.9 19.9 L50 16.2 L44.1 19.9 L45.8 13.2 L40.5 8.9 L47.4 8.4 Z" fill="#ffd23a" stroke="#c88a00" stroke-width="1.3" stroke-linejoin="round"/>`;
  d += eye(42, 47, 6.6, 0) + eye(58, 47, 6.6, 0) + smile(45, 56, 10) + cheek(36, 56) + cheek(64, 56);
  return d;
}
function drawPenguin(s) {
  const c = s.body, o = shade(c, -.45), g = `g-${s.id}`;
  let d = `<defs>${grad(g, c)}</defs>`;
  d += `<ellipse cx="40" cy="90" rx="8" ry="4" fill="#ff9f2e" stroke="#c26a00" stroke-width="1.4"/><ellipse cx="60" cy="90" rx="8" ry="4" fill="#ff9f2e" stroke="#c26a00" stroke-width="1.4"/>`;
  d += `<ellipse cx="22" cy="62" rx="7" ry="16" transform="rotate(22 22 62)" fill="url(#${g})" stroke="${o}" stroke-width="1.8"/><ellipse cx="78" cy="62" rx="7" ry="16" transform="rotate(-22 78 62)" fill="url(#${g})" stroke="${o}" stroke-width="1.8"/>`;
  d += `<ellipse cx="50" cy="58" rx="27" ry="32" fill="url(#${g})" stroke="${o}" stroke-width="2"/>`;
  d += `<ellipse cx="50" cy="66" rx="18" ry="21" fill="#fbfdff"/><ellipse cx="50" cy="43" rx="17" ry="12" fill="#fbfdff"/>`;
  d += eye(42, 41, 6.6, 0) + eye(58, 41, 6.6, 0) + cheek(36, 50) + cheek(64, 50);
  d += `<path d="M45 48 L55 48 L50 55 Z" fill="#ff9f2e" stroke="#c26a00" stroke-width="1.3" stroke-linejoin="round"/>`;
  // Schal
  d += `<path d="M28 58 Q50 68 72 58" fill="none" stroke="#1d7a44" stroke-width="8" stroke-linecap="round"/><path d="M28 58 Q50 68 72 58" fill="none" stroke="#2fae6e" stroke-width="5.6" stroke-linecap="round" stroke-dasharray="6 4"/>`;
  d += `<path d="M60 62 l5 14 l6 -2 l-4 -14" fill="#2fae6e" stroke="#1d7a44" stroke-width="1.5" stroke-linejoin="round"/>`;
  // Wollmütze mit Bommel
  d += `<path d="M27 31 Q28 9 50 9 Q72 9 73 31 Z" fill="#e3242f" stroke="#8e1020" stroke-width="1.8" stroke-linejoin="round"/>`;
  d += `<path d="M36 15 Q50 12 64 15 M30 23 Q50 19 70 23" fill="none" stroke="#fff" stroke-width="2.6" opacity=".9"/>`;
  d += `<rect x="24" y="27" width="52" height="8" rx="4" fill="#fff" stroke="#c9d6e6" stroke-width="1.2"/><circle cx="50" cy="7" r="6" fill="#fff" stroke="#c9d6e6" stroke-width="1.2"/>`;
  return d;
}
function drawGiftCrab(s) {
  let d = drawCrab(s);
  d += `<defs><linearGradient id="gb-${s.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fd98a"/><stop offset="1" stop-color="#1f9a52"/></linearGradient></defs>`;
  d += `<rect x="25" y="45" width="50" height="31" rx="6" fill="url(#gb-${s.id})" stroke="#156b39" stroke-width="2"/>`;
  d += `<rect x="25" y="49" width="50" height="5.5" fill="#e3242f"/><rect x="25" y="49" width="50" height="5.5" fill="none" stroke="#8e1020" stroke-width=".8"/>`;
  d += `<path d="M50 49 q-12 -12 -15 -3 q2 6 15 3 q12 -12 15 -3 q-2 6 -15 3z" fill="#ff4d5e" stroke="#8e1020" stroke-width="1.4" stroke-linejoin="round"/><circle cx="50" cy="48.5" r="3" fill="#e3242f" stroke="#8e1020" stroke-width="1.2"/>`;
  d += `<circle cx="34" cy="62" r="1.6" fill="#fff" opacity=".7"/><circle cx="66" cy="68" r="1.6" fill="#fff" opacity=".7"/><circle cx="62" cy="60" r="1.2" fill="#fff" opacity=".7"/>`;
  d += smile(44, 63, 12) + cheek(33, 66) + cheek(67, 66);
  return d;
}
function drawCandySeahorse(s) {
  const cl = `cc-${s.id}`;
  let d = drawSeahorse(s);
  d += `<path d="M58 64 C58 80 50 88 58 92 C66 96 74 88 68 82 C64 78 60 82 62 85" fill="none" stroke="#e3242f" stroke-width="7.5" stroke-linecap="butt" stroke-dasharray="4 4"/>`;
  d += `<defs><clipPath id="${cl}"><ellipse cx="56" cy="54" rx="12" ry="16"/><circle cx="50" cy="26" r="13"/><path d="M24 24 h14 q4 0 4 4 v1 q0 4 -4 4 h-14 q-3 0 -3 -4.5 q0 -4.5 3 -4.5z"/></clipPath></defs>`;
  let st = '';
  for (let i = -6; i < 10; i++) st += `<rect x="${i * 9}" y="-10" width="4.5" height="130" fill="#e3242f" transform="rotate(32 50 50)"/>`;
  d += `<g clip-path="url(#${cl})" opacity=".9">${st}</g>`;
  // Gesicht wieder obenauf
  d += eye(47, 24, 7.5) + cheek(52, 32) + `<path d="M21 30 q2 2 4 0" stroke="#5a1e2e" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  // Stechpalmen-Blatt statt Kamm
  d += `<path d="M52 12 q6 -8 13 -5 q-3 3 -1 6 q-6 3 -12 -1z" fill="#2fae6e" stroke="#1d7a44" stroke-width="1.2" stroke-linejoin="round"/><circle cx="51" cy="12" r="2.6" fill="#e3242f"/><circle cx="55" cy="10" r="2.2" fill="#e3242f"/>`;
  return d;
}

const XMAS_SPECIES = [
  { id: 'flocke',   name: 'Flocke',              kind: 'x_snowpuffer', body: '#f2f7ff', xmas: true },
  { id: 'renni',    name: 'Rentierfisch Renni',  kind: 'x_reindeer', shape: 'round', body: '#b47a46', fin: '#e8c08a', pat: 'none', pc: '#000', xmas: true },
  { id: 'lebi',     name: 'Lebkuchen-Lebi',      kind: 'x_gingerstar', body: '#c27a3a', xmas: true },
  { id: 'tanni',    name: 'Tanni Tannenqualle',  kind: 'x_treejelly', body: '#3fbf6a', xmas: true },
  { id: 'pingo',    name: 'Pinguin Pingo',       kind: 'x_penguin', body: '#3a4566', xmas: true },
  { id: 'paul',     name: 'Päckchen-Paul',       kind: 'x_giftcrab', body: '#ff7a4a', xmas: true },
  { id: 'zuckerli', name: 'Zuckerli',            kind: 'x_candyhorse', body: '#fff4f4', xmas: true },
];
Object.assign(DRAWERS, {
  x_snowpuffer: drawSnowPuffer, x_reindeer: drawReindeerFish, x_gingerstar: drawGingerStar, x_treejelly: drawTreeJelly,
  x_penguin: drawPenguin, x_giftcrab: drawGiftCrab, x_candyhorse: drawCandySeahorse,
});
const isXmasSpecies = id => XMAS_SPECIES.some(s => s.id === id);
if (XMAS) {
  for (const s of XMAS_SPECIES) SPECIES_BY_ID[s.id] = s;
  const _build2 = buildSpeciesDefs;
  buildSpeciesDefs = function () {
    _build2();
    const svg = document.body.firstChild;
    svg.insertAdjacentHTML('beforeend', XMAS_SPECIES.map(s => `<symbol id="sp-${s.id}" viewBox="0 0 100 100" overflow="visible">${DRAWERS[s.kind](s)}</symbol>`).join(''));
  };
}
