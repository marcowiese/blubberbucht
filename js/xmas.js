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
  schnecki: [29, 34, -10, .58], bruno: [35, 21, -8, .58], kurt: [30, 30, -22, .72],
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
