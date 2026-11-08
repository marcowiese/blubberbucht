// Blubberbucht – eigene, im Code gezeichnete Meeresbewohner (SVG)
'use strict';

const SPECIES = [
  { id: 'zitrino', name: 'Zitrino',   kind: 'fish', shape: 'round', body: '#ffd23a', fin: '#2ec4c6', pat: 'stripes', pc: '#18a5b0' },
  { id: 'koralla', name: 'Koralla',   kind: 'fish', shape: 'round', body: '#ff7a3d', fin: '#ff9e6b', pat: 'stripes', pc: '#ffffff' },
  { id: 'rosalie', name: 'Rosalie',   kind: 'fish', shape: 'tall',  body: '#ff6fb5', fin: '#ffb3d9', pat: 'spots',   pc: '#ffffff' },
  { id: 'blaubeer',name: 'Blaubeer',  kind: 'fish', shape: 'long',  body: '#3c7cff', fin: '#ffd23a', pat: 'none',    pc: '#000' },
  { id: 'krabbe',  name: 'Kalle Krabbe', kind: 'crab',  body: '#ff4b3e' },
  { id: 'minzi',   name: 'Minzi',     kind: 'fish', shape: 'round', body: '#6fe0a0', fin: '#2fae6e', pat: 'spots',   pc: '#2a9d63' },
  { id: 'schildi', name: 'Schildi',   kind: 'turtle', body: '#7ccf4a', shell: '#d98a3a' },
  { id: 'luna',    name: 'Luna',      kind: 'fish', shape: 'long',  body: '#a271ff', fin: '#ffcf4a', pat: 'half',    pc: '#6e3fd6' },
  { id: 'okti',    name: 'Okti',      kind: 'octopus', body: '#c16bff' },
  { id: 'zebrino', name: 'Zebrino',   kind: 'fish', shape: 'tall',  body: '#f4f4f8', fin: '#ffcf4a', pat: 'stripes', pc: '#2b2d42' },
  { id: 'puffi',   name: 'Puffi',     kind: 'puffer', body: '#f2c65c' },
  { id: 'tomato',  name: 'Tomatino',  kind: 'fish', shape: 'round', body: '#e8343b', fin: '#ffd23a', pat: 'spots',   pc: '#ffd23a' },
  { id: 'qualli',  name: 'Qualli',    kind: 'jelly', body: '#ff9ad5' },
  { id: 'aqua',    name: 'Aqua',      kind: 'fish', shape: 'long',  body: '#27d3e0', fin: '#1b4fa8', pat: 'stripes', pc: '#1b4fa8' },
  { id: 'willi',   name: 'Wal Willi', kind: 'whale', body: '#4a8fe0' },
  { id: 'stella',  name: 'Stella',    kind: 'star', body: '#ff9f2e' },
];
const SPECIES_BY_ID = Object.fromEntries(SPECIES.map(s => [s.id, s]));

function shade(hex, amt) {
  // amt -1..1: negativ = dunkler, positiv = heller
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  r = Math.round(r + (t - r) * p); g = Math.round(g + (t - g) * p); b = Math.round(b + (t - b) * p);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function grad(id, c) {
  return `<radialGradient id="${id}" cx="38%" cy="30%" r="75%">
    <stop offset="0" stop-color="${shade(c, .45)}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, -.28)}"/></radialGradient>`;
}

function eye(x, y, r, look = -1) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#1d2440" stroke-opacity=".25" stroke-width="1"/>
    <circle cx="${x + look * r * .12}" cy="${y + r * .08}" r="${r * .66}" fill="#1d2440"/>
    <circle cx="${x + look * r * .12}" cy="${y + r * .08}" r="${r * .42}" fill="#2f4a8a"/>
    <circle cx="${x - r * .28}" cy="${y - r * .28}" r="${r * .28}" fill="#fff"/>
    <circle cx="${x + r * .22}" cy="${y + r * .3}" r="${r * .12}" fill="#fff"/>`;
}
const smile = (x, y, w = 7) => `<path d="M${x} ${y} Q${x + w / 2} ${y + w * .6} ${x + w} ${y}" fill="none" stroke="#5a1e2e" stroke-width="2.2" stroke-linecap="round"/>`;
const cheek = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="4.5" ry="2.6" fill="#ff5c8a" opacity=".35"/>`;

function drawFish(s) {
  const S = { round: [55, 52, 30, 26], long: [53, 54, 34, 19], tall: [56, 52, 24, 28] }[s.shape];
  const [cx, cy, rx, ry] = S;
  const g = `g-${s.id}`, cl = `c-${s.id}`, out = shade(s.body, -.4), fo = shade(s.fin, -.3);
  const tx = cx + rx - 5, tl = Math.min(18, 99 - tx);
  let d = `<defs>${grad(g, s.body)}${grad(g + 'f', s.fin)}<clipPath id="${cl}"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/></clipPath></defs>`;
  // Schwanzflosse
  d += `<path d="M${tx} ${cy} Q${tx + tl * .5} ${cy - 5} ${tx + tl} ${cy - ry * .8} Q${tx + tl * .7} ${cy} ${tx + tl} ${cy + ry * .8} Q${tx + tl * .5} ${cy + 5} ${tx} ${cy}Z" fill="url(#${g}f)" stroke="${fo}" stroke-width="1.8" stroke-linejoin="round"/>`;
  // Rücken- & Bauchflosse
  const dh = s.shape === 'tall' ? 22 : 13;
  d += `<path d="M${cx - rx * .45} ${cy - ry + 4} Q${cx - 2} ${cy - ry - dh} ${cx + rx * .6} ${cy - ry + 6} Z" fill="url(#${g}f)" stroke="${fo}" stroke-width="1.8" stroke-linejoin="round"/>`;
  d += `<path d="M${cx - rx * .1} ${cy + ry - 4} Q${cx + rx * .25} ${cy + ry + (s.shape === 'tall' ? 18 : 9)} ${cx + rx * .6} ${cy + ry - 7} Z" fill="url(#${g}f)" stroke="${fo}" stroke-width="1.8" stroke-linejoin="round"/>`;
  // Körper
  d += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${g})"/>`;
  // Muster
  let p = '';
  if (s.pat === 'stripes') {
    for (const k of [-.05, .42]) p += `<rect x="${cx + rx * k - 4}" y="0" width="8" height="100" rx="3" fill="${s.pc}" opacity=".95"/>`;
  } else if (s.pat === 'spots') {
    for (const [a, b, r] of [[.1, -.45, 4], [.45, -.1, 3.4], [.2, .35, 3.6], [.6, .4, 2.6], [-.15, .5, 2.4]])
      p += `<circle cx="${cx + rx * a}" cy="${cy + ry * b}" r="${r}" fill="${s.pc}" opacity=".9"/>`;
  } else if (s.pat === 'half') {
    p += `<path d="M0 ${cy + 3} Q50 ${cy - 6} 100 ${cy + 3} V100 H0Z" fill="${s.pc}" opacity=".85"/>`;
  }
  d += `<g clip-path="url(#${cl})">${p}<ellipse cx="${cx}" cy="${cy + ry * .9}" rx="${rx}" ry="${ry * .45}" fill="#000" opacity=".08"/></g>`;
  d += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${out}" stroke-width="2"/>`;
  d += `<ellipse cx="${cx - rx * .15}" cy="${cy - ry * .55}" rx="${rx * .45}" ry="${ry * .18}" fill="#fff" opacity=".35"/>`;
  // Brustflosse
  d += `<ellipse cx="${cx + 4}" cy="${cy + ry * .25}" rx="8" ry="4.6" transform="rotate(-28 ${cx + 4} ${cy + ry * .25})" fill="url(#${g}f)" stroke="${fo}" stroke-width="1.5"/>`;
  // Gesicht
  const ex = cx - rx * .55, ey = cy - ry * .18, er = Math.max(8.5, Math.min(11, ry * .42));
  d += cheek(ex + 2, ey + er + 4) + eye(ex, ey, er) + smile(cx - rx + 3, cy + ry * .38, 7);
  return d;
}

function drawCrab(s) {
  const c = s.body, o = shade(c, -.4), g = `g-${s.id}`;
  let d = `<defs>${grad(g, c)}</defs>`;
  for (const k of [-1, 1]) {
    for (let i = 0; i < 3; i++) d += `<path d="M${50 + k * 22} ${64 + i * 5} q${k * 10} ${2 + i * 2} ${k * 16} ${10 + i * 3}" fill="none" stroke="${o}" stroke-width="4" stroke-linecap="round"/>`;
    d += `<path d="M${50 + k * 20} 56 Q${50 + k * 30} 44 ${50 + k * 32} 36" fill="none" stroke="${o}" stroke-width="5" stroke-linecap="round"/>`;
    d += `<path d="M${50 + k * 32} 38 a11 11 0 1 1 ${k * 0.1} -0.1 Z" fill="url(#${g})" stroke="${o}" stroke-width="2"/>`;
    d += `<circle cx="${50 + k * 33}" cy="27" r="11" fill="url(#${g})" stroke="${o}" stroke-width="2"/>`;
    d += `<path d="M${50 + k * 33} 27 L${50 + k * 40} 17 L${50 + k * 44} 25 Z" fill="#7fd0ff"/>`;
    d += `<path d="M${50 + k * 12} 46 L${50 + k * 14} 32" stroke="${o}" stroke-width="3.5" stroke-linecap="round"/>`;
  }
  d += `<ellipse cx="50" cy="60" rx="27" ry="18" fill="url(#${g})" stroke="${o}" stroke-width="2"/>`;
  d += `<ellipse cx="44" cy="52" rx="10" ry="3.5" fill="#fff" opacity=".35"/>`;
  d += eye(36, 30, 8, 0) + eye(64, 30, 8, 0) + smile(44, 64, 12) + cheek(33, 64) + cheek(67, 64);
  return d;
}

function drawTurtle(s) {
  const c = s.body, sh = s.shell, o = shade(c, -.4), so = shade(sh, -.4), g = `g-${s.id}`;
  let d = `<defs>${grad(g, c)}${grad(g + 's', sh)}<clipPath id="c-${s.id}"><path d="M28 58 Q30 26 58 26 Q86 26 88 58 Z"/></clipPath></defs>`;
  d += `<ellipse cx="40" cy="66" rx="10" ry="6" transform="rotate(30 40 66)" fill="url(#${g})" stroke="${o}" stroke-width="2"/>`;
  d += `<ellipse cx="78" cy="66" rx="10" ry="6" transform="rotate(-30 78 66)" fill="url(#${g})" stroke="${o}" stroke-width="2"/>`;
  d += `<path d="M86 56 l10 4 l-10 4z" fill="url(#${g})" stroke="${o}" stroke-width="2" stroke-linejoin="round"/>`;
  d += `<ellipse cx="58" cy="60" rx="30" ry="7" fill="${shade(c, .2)}" stroke="${o}" stroke-width="2"/>`;
  d += `<path d="M28 58 Q30 26 58 26 Q86 26 88 58 Z" fill="url(#${g}s)" stroke="${so}" stroke-width="2.2" stroke-linejoin="round"/>`;
  d += `<g clip-path="url(#c-${s.id})" fill="none" stroke="${so}" stroke-width="2" opacity=".7"><path d="M50 36 h16 l6 10 -6 10 h-16 l-6 -10z"/><path d="M44 46 h-14 M72 46 h14 M50 36 l-6 -10 M66 36 l6 -10"/></g>`;
  d += `<ellipse cx="50" cy="34" rx="12" ry="4" fill="#fff" opacity=".35"/>`;
  d += `<circle cx="22" cy="48" r="15" fill="url(#${g})" stroke="${o}" stroke-width="2"/>`;
  d += eye(19, 44, 7.5) + smile(10, 54, 9) + cheek(26, 54);
  return d;
}

function drawOctopus(s) {
  const c = s.body, o = shade(c, -.4), g = `g-${s.id}`;
  let d = `<defs>${grad(g, c)}</defs>`;
  const xs = [26, 38, 50, 62, 74];
  xs.forEach((x, i) => {
    const w = i % 2 ? 6 : -6;
    d += `<path d="M${x} 56 q${w} 14 0 24 q${-w * .6} 8 ${w * .8} 12" fill="none" stroke="${o}" stroke-width="11" stroke-linecap="round"/>`;
    d += `<path d="M${x} 56 q${w} 14 0 24 q${-w * .6} 8 ${w * .8} 12" fill="none" stroke="url(#${g})" stroke-width="7.5" stroke-linecap="round"/>`;
  });
  d += `<path d="M22 60 Q18 16 50 14 Q82 16 78 60 Q50 70 22 60Z" fill="url(#${g})" stroke="${o}" stroke-width="2.2"/>`;
  d += `<ellipse cx="42" cy="24" rx="12" ry="5" fill="#fff" opacity=".35"/>`;
  for (const [x, y] of [[62, 28], [68, 38], [32, 32]]) d += `<circle cx="${x}" cy="${y}" r="2.6" fill="${shade(c, .45)}"/>`;
  d += eye(39, 44, 8.5, 0) + eye(61, 44, 8.5, 0) + smile(45, 55, 10) + cheek(30, 54) + cheek(70, 54);
  return d;
}

function drawJelly(s) {
  const c = s.body, o = shade(c, -.35), g = `g-${s.id}`;
  let d = `<defs>${grad(g, c)}</defs>`;
  for (const [x, w] of [[30, 5], [42, -5], [54, 5], [66, -5]])
    d += `<path d="M${x} 56 q${w} 10 0 18 q${-w} 8 0 18" fill="none" stroke="${shade(c, .2)}" stroke-width="4" stroke-linecap="round" opacity=".9"/>`;
  d += `<path d="M18 58 Q16 18 50 16 Q84 18 82 58 Q76 54 71 58 Q66 54 61 58 Q56 54 50 58 Q44 54 39 58 Q34 54 29 58 Q24 54 18 58Z" fill="url(#${g})" fill-opacity=".92" stroke="${o}" stroke-width="2"/>`;
  d += `<ellipse cx="40" cy="27" rx="13" ry="5" fill="#fff" opacity=".45"/>`;
  d += eye(39, 40, 8, 0) + eye(61, 40, 8, 0) + smile(45, 50, 10) + cheek(28, 49) + cheek(72, 49);
  return d;
}

function drawPuffer(s) {
  const c = s.body, o = shade(c, -.42), g = `g-${s.id}`;
  let d = `<defs>${grad(g, c)}</defs>`;
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * Math.PI * 2, x = 52 + Math.cos(a) * 28, y = 52 + Math.sin(a) * 26;
    const x2 = 52 + Math.cos(a) * 37, y2 = 52 + Math.sin(a) * 35, p = .12;
    d += `<path d="M${x + Math.cos(a + 1.57) * 4} ${y + Math.sin(a + 1.57) * 4} L${x2} ${y2} L${x - Math.cos(a + 1.57) * 4} ${y - Math.sin(a + 1.57) * 4}Z" fill="${shade(c, -.15)}" stroke="${o}" stroke-width="1.4" stroke-linejoin="round"/>`;
  }
  d += `<path d="M78 52 l14 -10 l-3 10 l3 10 Z" fill="url(#${g})" stroke="${o}" stroke-width="1.8" stroke-linejoin="round"/>`;
  d += `<circle cx="52" cy="52" r="30" fill="url(#${g})" stroke="${o}" stroke-width="2"/>`;
  d += `<ellipse cx="52" cy="66" rx="22" ry="12" fill="#fff6dc" opacity=".8"/>`;
  for (const [x, y, r] of [[62, 34, 3.5], [72, 46, 3], [56, 42, 2.4], [68, 60, 2.6]]) d += `<circle cx="${x}" cy="${y}" r="${r}" fill="${shade(c, -.35)}" opacity=".7"/>`;
  d += `<ellipse cx="44" cy="32" rx="12" ry="4.5" fill="#fff" opacity=".4"/>`;
  d += eye(38, 46, 10) + `<ellipse cx="26" cy="58" rx="4" ry="3.5" fill="#5a1e2e"/>` + cheek(40, 60);
  return d;
}

function drawWhale(s) {
  const c = s.body, o = shade(c, -.42), g = `g-${s.id}`;
  let d = `<defs>${grad(g, c)}<clipPath id="c-${s.id}"><path d="M10 56 Q10 26 46 26 Q76 26 84 50 Q86 72 52 74 Q12 76 10 56Z"/></clipPath></defs>`;
  d += `<path d="M80 52 Q88 40 86 28 Q94 30 98 22 Q98 36 90 44 Q84 52 80 56Z" fill="url(#${g})" stroke="${o}" stroke-width="2" stroke-linejoin="round"/>`;
  d += `<path d="M10 56 Q10 26 46 26 Q76 26 84 50 Q86 72 52 74 Q12 76 10 56Z" fill="url(#${g})"/>`;
  d += `<g clip-path="url(#c-${s.id})"><path d="M0 58 Q40 50 90 62 V100 H0Z" fill="#eaf6ff"/><path d="M20 62 h40 M24 67 h34" stroke="${shade(c, .3)}" stroke-width="1.5"/></g>`;
  d += `<path d="M10 56 Q10 26 46 26 Q76 26 84 50 Q86 72 52 74 Q12 76 10 56Z" fill="none" stroke="${o}" stroke-width="2.2"/>`;
  d += `<ellipse cx="50" cy="66" rx="9" ry="4.5" transform="rotate(25 50 66)" fill="${shade(c, -.1)}" stroke="${o}" stroke-width="1.6"/>`;
  d += `<ellipse cx="40" cy="33" rx="14" ry="4" fill="#fff" opacity=".4"/>`;
  d += `<path d="M44 20 q-4 -8 -10 -10 M44 20 q2 -9 8 -12" fill="none" stroke="#9fe0ff" stroke-width="3" stroke-linecap="round"/>`;
  d += eye(30, 46, 8.5) + smile(13, 58, 12) + cheek(36, 57);
  return d;
}

function drawStar(s) {
  const c = s.body, o = shade(c, -.4), g = `g-${s.id}`;
  let pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 19 : 44;
    pts.push(`${(50 + Math.cos(a) * r).toFixed(1)},${(54 + Math.sin(a) * r).toFixed(1)}`);
  }
  let d = `<defs>${grad(g, c)}</defs>`;
  d += `<polygon points="${pts.join(' ')}" fill="url(#${g})" stroke="${o}" stroke-width="5" stroke-linejoin="round"/>`;
  d += `<polygon points="${pts.join(' ')}" fill="url(#${g})" stroke="url(#${g})" stroke-width="2" stroke-linejoin="round"/>`;
  for (const [x, y] of [[50, 20], [80, 44], [70, 80], [30, 80], [20, 44], [58, 30], [64, 66], [36, 66]]) d += `<circle cx="${x}" cy="${y}" r="2.2" fill="${shade(c, .5)}"/>`;
  d += eye(42, 50, 7.5, 0) + eye(58, 50, 7.5, 0) + smile(45, 60, 10) + cheek(34, 60) + cheek(66, 60);
  return d;
}

const DRAWERS = { fish: drawFish, crab: drawCrab, turtle: drawTurtle, octopus: drawOctopus, jelly: drawJelly, puffer: drawPuffer, whale: drawWhale, star: drawStar };

function buildSpeciesDefs() {
  const symbols = SPECIES.map(s => `<symbol id="sp-${s.id}" viewBox="0 0 100 100" overflow="visible">${DRAWERS[s.kind](s)}</symbol>`).join('');
  const holder = document.createElement('div');
  holder.innerHTML = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${symbols}</svg>`;
  document.body.prepend(holder.firstChild);
}

function creatureSVG(sp, extra = '') {
  return `<svg class="cr-img" viewBox="0 0 100 100" ${extra}><use href="#sp-${sp}"/></svg>`;
}
