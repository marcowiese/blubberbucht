// Blubberbucht – weitere eigene Meeresbewohner: echte Tiere und (ab den höheren Leveln) Fantasietiere.
'use strict';

// ---------- neue Zeichenfunktionen ----------
function drawSeahorse(s) {
  const c = s.body, o = shade(c, -.4), g = `g-${s.id}`;
  let d = `<defs>${grad(g, c)}</defs>`;
  d += `<path d="M58 64 C58 80 50 88 58 92 C66 96 74 88 68 82 C64 78 60 82 62 85" fill="none" stroke="${o}" stroke-width="11" stroke-linecap="round"/>`;
  d += `<path d="M58 64 C58 80 50 88 58 92 C66 96 74 88 68 82 C64 78 60 82 62 85" fill="none" stroke="url(#${g})" stroke-width="7.5" stroke-linecap="round"/>`;
  d += `<path d="M66 44 q14 4 12 18 q-6 -4 -12 -2z" fill="${shade(c, .25)}" stroke="${o}" stroke-width="1.6" stroke-linejoin="round"/>`;
  d += `<ellipse cx="56" cy="54" rx="13" ry="17" fill="url(#${g})" stroke="${o}" stroke-width="2"/>`;
  for (let i = 0; i < 4; i++) d += `<path d="M46 ${46 + i * 6} q10 3 20 0" fill="none" stroke="${shade(c, -.2)}" stroke-width="1.6" opacity=".7"/>`;
  d += `<path d="M24 24 h14 q4 0 4 4 v1 q0 4 -4 4 h-14 q-3 0 -3 -4.5 q0 -4.5 3 -4.5z" fill="url(#${g})" stroke="${o}" stroke-width="1.8"/>`;
  d += `<circle cx="50" cy="26" r="14" fill="url(#${g})" stroke="${o}" stroke-width="2"/>`;
  d += `<path d="M44 13 l3 -7 l3 6 l4 -6 l1 8" fill="${shade(c, .2)}" stroke="${o}" stroke-width="1.5" stroke-linejoin="round"/>`;
  d += eye(47, 24, 7.5) + cheek(52, 32) + `<path d="M21 30 q2 2 4 0" stroke="#5a1e2e" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  return d;
}

function drawShrimp(s) {
  const c = s.body, o = shade(c, -.4), g = `g-${s.id}`;
  let d = `<defs>${grad(g, c)}</defs>`;
  d += `<path d="M28 42 Q10 20 6 8 M30 40 Q20 18 22 4" fill="none" stroke="${o}" stroke-width="1.6" stroke-linecap="round"/>`;
  d += `<path d="M80 74 l14 -4 l-4 12 z M80 74 l8 12 l-10 2 z" fill="${shade(c, .2)}" stroke="${o}" stroke-width="1.5" stroke-linejoin="round"/>`;
  for (let i = 0; i < 5; i++) d += `<path d="M${40 + i * 7} ${66 + i * 1.5} l-2 10" stroke="${o}" stroke-width="2" stroke-linecap="round"/>`;
  const segs = [[34, 50, 16], [46, 56, 14], [58, 62, 12.5], [68, 68, 11], [77, 73, 9]];
  for (const [x, y, r] of segs.slice().reverse()) d += `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${g})" stroke="${o}" stroke-width="1.8"/>`;
  d += `<ellipse cx="32" cy="44" rx="9" ry="3" fill="#fff" opacity=".4"/>`;
  d += eye(30, 46, 7) + cheek(36, 56) + smile(22, 56, 7);
  return d;
}

function drawRay(s) {
  const c = s.body, o = shade(c, -.4), g = `g-${s.id}`;
  let d = `<defs>${grad(g, c)}</defs>`;
  d += `<path d="M50 72 Q56 86 62 96" fill="none" stroke="${o}" stroke-width="3" stroke-linecap="round"/>`;
  d += `<path d="M50 28 C70 28 90 44 97 58 C82 60 66 64 50 76 C34 64 18 60 3 58 C10 44 30 28 50 28Z" fill="url(#${g})" stroke="${o}" stroke-width="2" stroke-linejoin="round"/>`;
  d += `<path d="M50 46 C62 46 72 54 74 60 C64 62 56 66 50 70 C44 66 36 62 26 60 C28 54 38 46 50 46Z" fill="${shade(c, .45)}" opacity=".6"/>`;
  for (const [x, y] of [[24, 48], [76, 48], [32, 42], [68, 42]]) d += `<circle cx="${x}" cy="${y}" r="2" fill="${shade(c, .5)}"/>`;
  d += eye(41, 42, 7, 0) + eye(59, 42, 7, 0) + smile(45, 54, 10) + cheek(34, 52) + cheek(66, 52);
  return d;
}

function drawClam(s) {
  const c = s.body, o = shade(c, -.4), g = `g-${s.id}`;
  let d = `<defs>${grad(g, c)}</defs>`;
  d += `<path d="M14 62 Q50 96 86 62 Z" fill="url(#${g})" stroke="${o}" stroke-width="2" stroke-linejoin="round"/>`;
  d += `<ellipse cx="50" cy="62" rx="33" ry="6" fill="#ffd9e6"/>`;
  d += `<circle cx="50" cy="59" r="8" fill="#fff" stroke="#d8c8e8" stroke-width="1.2"/><circle cx="47" cy="56" r="2.4" fill="#fff" opacity=".9"/>`;
  d += `<path d="M14 58 Q16 18 50 16 Q84 18 86 58 Q50 46 14 58Z" fill="url(#${g})" stroke="${o}" stroke-width="2" stroke-linejoin="round"/>`;
  for (const a of [-50, -25, 0, 25, 50]) d += `<path d="M50 50 L${50 + a * .7} ${a === 0 ? 20 : 24 + Math.abs(a) * .1}" stroke="${o}" stroke-width="1.6" opacity=".55"/>`;
  d += `<ellipse cx="38" cy="26" rx="10" ry="3.5" fill="#fff" opacity=".45"/>`;
  d += eye(39, 36, 7, 0) + eye(61, 36, 7, 0) + cheek(30, 44) + cheek(70, 44) + smile(45, 44, 10);
  return d;
}

function drawUrchin(s) {
  const c = s.body, o = shade(c, -.45), g = `g-${s.id}`;
  let d = `<defs>${grad(g, c)}</defs>`;
  for (let i = 0; i < 22; i++) {
    const a = i / 22 * Math.PI * 2, x1 = 50 + Math.cos(a) * 22, y1 = 56 + Math.sin(a) * 20, x2 = 50 + Math.cos(a) * 42, y2 = 56 + Math.sin(a) * 38;
    d += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${o}" stroke-width="3.4" stroke-linecap="round"/><path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${shade(c, .25)}" stroke-width="1.6" stroke-linecap="round"/>`;
  }
  d += `<ellipse cx="50" cy="58" rx="26" ry="23" fill="url(#${g})" stroke="${o}" stroke-width="2"/>`;
  d += `<ellipse cx="42" cy="44" rx="9" ry="3.5" fill="#fff" opacity=".4"/>`;
  d += eye(41, 55, 7, 0) + eye(59, 55, 7, 0) + cheek(33, 64) + cheek(67, 64) + smile(45, 66, 10);
  return d;
}

function drawSnail(s) {
  const c = s.body, sh = s.shell, o = shade(c, -.4), so = shade(sh, -.4), g = `g-${s.id}`;
  let d = `<defs>${grad(g, c)}${grad(g + 's', sh)}</defs>`;
  d += `<path d="M12 80 Q12 66 30 66 H84 Q94 66 92 78 Q90 86 80 86 H20 Q12 86 12 80Z" fill="url(#${g})" stroke="${o}" stroke-width="2"/>`;
  d += `<path d="M24 66 L20 44 M32 66 L34 46" stroke="${o}" stroke-width="3" stroke-linecap="round"/>`;
  d += `<circle cx="66" cy="50" r="26" fill="url(#${g}s)" stroke="${so}" stroke-width="2.2"/>`;
  d += `<path d="M66 50 m0 -3 a3 3 0 1 1 -3 3 a7 7 0 0 1 7 -7 a11 11 0 0 1 11 11 a15 15 0 0 1 -15 15 a19 19 0 0 1 -19 -19" fill="none" stroke="${so}" stroke-width="2.4" stroke-linecap="round"/>`;
  d += `<ellipse cx="58" cy="32" rx="9" ry="3.4" fill="#fff" opacity=".4"/>`;
  d += eye(20, 42, 6, 0) + eye(34, 44, 6, 0) + cheek(24, 74) + smile(16, 76, 7);
  return d;
}

function drawDragon(s) {
  const c = s.body, o = shade(c, -.42), g = `g-${s.id}`;
  let d = `<defs>${grad(g, c)}</defs>`;
  const body = 'M30 46 C46 34 56 66 72 56 C84 48 90 58 88 70 C86 80 78 82 74 76';
  d += `<path d="${body}" fill="none" stroke="${o}" stroke-width="19" stroke-linecap="round"/><path d="${body}" fill="none" stroke="url(#${g})" stroke-width="15" stroke-linecap="round"/>`;
  d += `<path d="${body}" fill="none" stroke="${shade(c, .45)}" stroke-width="5" stroke-linecap="round" stroke-dasharray="3 5" opacity=".8" transform="translate(0 4)"/>`;
  for (const [x, y] of [[44, 37], [56, 46], [66, 47], [78, 45]]) d += `<path d="M${x - 4} ${y + 2} l4 -9 l4 9z" fill="${s.fin}" stroke="${o}" stroke-width="1.3" stroke-linejoin="round"/>`;
  d += `<path d="M56 58 q10 -14 22 -12 q-6 6 -6 14z" fill="${s.fin}" opacity=".9" stroke="${o}" stroke-width="1.3"/>`;
  d += `<path d="M18 22 q-2 -12 6 -14 q-1 8 4 12z M34 20 q4 -12 12 -10 q-5 6 -3 13z" fill="#ffe08a" stroke="#b8902a" stroke-width="1.3" stroke-linejoin="round"/>`;
  d += `<circle cx="28" cy="36" r="16" fill="url(#${g})" stroke="${o}" stroke-width="2"/>`;
  d += `<ellipse cx="16" cy="44" rx="9" ry="7" fill="${shade(c, .2)}" stroke="${o}" stroke-width="1.6"/><circle cx="12" cy="42" r="1.4" fill="${o}"/><circle cx="17" cy="41" r="1.4" fill="${o}"/>`;
  d += eye(30, 32, 8) + cheek(34, 44) + `<path d="M10 49 q4 3 8 0" stroke="#5a1e2e" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  return d;
}

function drawDonut(s) {
  const c = s.body, g = `g-${s.id}`;
  const ring = (r, rh, cy) => `M${50 - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z M${50 - rh} ${cy} a${rh} ${rh} 0 1 1 ${2 * rh} 0 a${rh} ${rh} 0 1 1 ${-2 * rh} 0 Z`;
  let d = `<defs>${grad(g, c)}${grad(g + 'd', '#e8b070')}</defs>`;
  d += `<path d="M80 54 l14 -10 l-3 10 l3 10z" fill="${c}" stroke="${shade(c, -.35)}" stroke-width="1.6" stroke-linejoin="round"/>`;
  d += `<path d="${ring(32, 10, 54)}" fill="url(#${g}d)" fill-rule="evenodd" stroke="#a8743a" stroke-width="2"/>`;
  d += `<path d="M20 50 a30 26 0 0 1 60 0 q-4 6 -8 2 q-4 6 -9 1 q-5 6 -10 1 q-5 6 -10 0 q-5 5 -9 -1 q-5 5 -8 -1 q-4 4 -6 -2z M40 52 a10 10 0 1 1 20 0 a10 10 0 1 1 -20 0z" fill="url(#${g})" fill-rule="evenodd"/>`;
  const cols = ['#fff36b', '#6fe0ff', '#7be05a', '#ffffff', '#a271ff'];
  [[30, 40, 20], [38, 30, -30], [62, 30, 40], [70, 42, -10], [52, 26, 70], [26, 50, 60], [74, 52, -50]].forEach(([x, y, r], i) =>
    d += `<rect x="${x - 3}" y="${y - 1}" width="6" height="2.4" rx="1.2" fill="${cols[i % cols.length]}" transform="rotate(${r} ${x} ${y})"/>`);
  d += eye(38, 40, 6.5, 0) + eye(62, 40, 6.5, 0) + smile(45, 74, 10) + cheek(30, 66) + cheek(70, 66);
  return d;
}

function drawCloudJelly(s) {
  const c = s.body, o = shade(c, -.3), g = `g-${s.id}`;
  let d = `<defs>${grad(g, c)}</defs>`;
  ['#ff6f8f', '#ffcf2e', '#7be05a', '#4fb8ff', '#a271ff'].forEach((col, i) => {
    const x = 28 + i * 11, w = i % 2 ? 5 : -5;
    d += `<path d="M${x} 58 q${w} 9 0 17 q${-w} 8 0 17" fill="none" stroke="${col}" stroke-width="4" stroke-linecap="round"/>`;
  });
  const blobs = [[30, 48, 15], [46, 36, 18], [64, 38, 16], [74, 50, 12], [50, 52, 18]];
  d += blobs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 2}" fill="${o}"/>`).join('');
  d += blobs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${g})"/>`).join('');
  d += `<ellipse cx="42" cy="30" rx="10" ry="4" fill="#fff" opacity=".6"/>`;
  d += eye(42, 46, 7, 0) + eye(60, 46, 7, 0) + cheek(34, 56) + cheek(68, 56) + smile(46, 56, 9);
  return d;
}

// Varianten bestehender Formen mit Extra-Details
const crown = (x, y, w) => `<path d="M${x - w} ${y} l${w * .2} ${-w * .9} l${w * .4} ${w * .5} l${w * .4} ${-w * .8} l${w * .4} ${w * .8} l${w * .4} ${-w * .5} l${w * .2} ${w * .9}z" fill="#ffd23a" stroke="#b8860b" stroke-width="1.6" stroke-linejoin="round"/><circle cx="${x}" cy="${y - w * .45}" r="${w * .16}" fill="#ff4b8a"/>`;
const sparkle = (x, y, r, col = '#fff') => `<path d="M${x} ${y - r} L${x + r * .25} ${y - r * .25} L${x + r} ${y} L${x + r * .25} ${y + r * .25} L${x} ${y + r} L${x - r * .25} ${y + r * .25} L${x - r} ${y} L${x - r * .25} ${y - r * .25}Z" fill="${col}"/>`;

function drawUnicornFish(s) {
  return drawFish(s)
    + `<path d="M36 18 q10 -2 14 4" fill="none" stroke="#ff6fb5" stroke-width="3" stroke-linecap="round"/><path d="M40 16 q8 -4 13 2" fill="none" stroke="#6fe0ff" stroke-width="3" stroke-linecap="round"/>`
    + `<path d="M28 30 L22 6 L36 26Z" fill="#ffe08a" stroke="#c8962a" stroke-width="1.5" stroke-linejoin="round"/><path d="M25 18 l7 -1 M24 13 l5 -1" stroke="#c8962a" stroke-width="1.2"/>`
    + sparkle(84, 20, 5) + sparkle(14, 74, 4, '#fff6a8');
}
function drawGhostFish(s) {
  return `<g opacity=".82">${drawFish(s)}</g><path d="M30 76 q4 6 8 0 q4 6 8 0 q4 6 8 0 q4 6 8 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/>`
    + `<ellipse cx="25" cy="64" rx="3.4" ry="4.4" fill="#5a1e2e" opacity=".85"/>`;
}
function drawRoboFish(s) {
  let d = drawFish(s);
  d += `<path d="M52 26 V10" stroke="#5a6a80" stroke-width="2.4"/><circle cx="52" cy="8" r="4" fill="#ff4b3e" stroke="#8a1a14" stroke-width="1.4"/><circle cx="51" cy="7" r="1.2" fill="#fff"/>`;
  for (const [x, y] of [[48, 40], [60, 36], [72, 44], [70, 60], [56, 66], [44, 60]]) d += `<circle cx="${x}" cy="${y}" r="2.2" fill="#c8d4e2" stroke="#5a6a80" stroke-width="1"/>`;
  d += `<path d="M58 46 h14 M58 52 h14" stroke="#5a6a80" stroke-width="1.6" opacity=".6"/>`;
  return d;
}
function drawKingCrab(s) { return drawCrab(s) + crown(50, 40, 11) + sparkle(84, 12, 4) + sparkle(16, 12, 3.4); }
function drawGlitterOcto(s) {
  return drawOctopus(s)
    + `<path d="M62 14 q8 -8 12 0 q-8 6 -12 0z M62 14 q-4 -10 -12 -4 q6 6 12 4z" fill="#ff4b8a" stroke="#a8104a" stroke-width="1.2"/><circle cx="62" cy="14" r="2.4" fill="#ff4b8a" stroke="#a8104a" stroke-width="1"/>`
    + sparkle(18, 22, 5, '#fff6a8') + sparkle(84, 34, 4) + sparkle(14, 60, 3.6) + sparkle(88, 70, 3.2, '#fff6a8');
}
function drawCactusFish(s) {
  return drawPuffer(s)
    + `<g transform="translate(54 16)"><circle r="3" fill="#ffd23a"/>${[0, 72, 144, 216, 288].map(a => `<ellipse rx="3.4" ry="6" cy="-6" fill="#ff6fb5" stroke="#c8306a" stroke-width=".8" transform="rotate(${a})"/>`).join('')}<circle r="3" fill="#ffd23a"/></g>`;
}
function drawGumPuffer(s) {
  return drawPuffer(s)
    + `<circle cx="14" cy="62" r="13" fill="#ff8fc8" opacity=".85" stroke="#d8508a" stroke-width="1.6"/><ellipse cx="10" cy="57" rx="4" ry="2.4" fill="#fff" opacity=".8"/>`;
}
function drawShootingStar(s) {
  return `<defs><linearGradient id="tail-${s.id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff36b" stop-opacity="0"/><stop offset="1" stop-color="#fff36b" stop-opacity=".9"/></linearGradient></defs>
    <path d="M98 4 L60 40 L50 30 Z" fill="url(#tail-${s.id})"/><path d="M96 20 L66 48 M84 2 L58 26" stroke="#fff6c8" stroke-width="2" stroke-linecap="round" opacity=".7"/>`
    + drawStar(s) + sparkle(16, 16, 4) + sparkle(86, 86, 3.4, '#fff6a8');
}

Object.assign(DRAWERS, {
  seahorse: drawSeahorse, shrimp: drawShrimp, ray: drawRay, clam: drawClam, urchin: drawUrchin, snail: drawSnail,
  dragon: drawDragon, donut: drawDonut, cloudjelly: drawCloudJelly, unicorn: drawUnicornFish, ghost: drawGhostFish,
  robo: drawRoboFish, kingcrab: drawKingCrab, glitterocto: drawGlitterOcto, cactus: drawCactusFish, gum: drawGumPuffer, shootingstar: drawShootingStar,
});

// ---------- neue Arten (Reihenfolge = Reihenfolge der Freischaltung) ----------
SPECIES.push(
  // weitere echte Meeresbewohner
  { id: 'seppi',    name: 'Seppi Seepferdchen', kind: 'seahorse', body: '#ffb84a' },
  { id: 'gari',     name: 'Garnele Gari',       kind: 'shrimp',   body: '#ff8a7a' },
  { id: 'pfirsich', name: 'Pfirsich',           kind: 'fish', shape: 'tall',  body: '#ffb38a', fin: '#ff7a5a', pat: 'half', pc: '#ff8f6a' },
  { id: 'rocco',    name: 'Rochen Rocco',       kind: 'ray',      body: '#5aa8c8' },
  { id: 'mia',      name: 'Muschel Mia',        kind: 'clam',     body: '#c9a8ff' },
  { id: 'limo',     name: 'Limo',               kind: 'fish', shape: 'long',  body: '#b8f05a', fin: '#3fae4a', pat: 'stripes', pc: '#3fae4a' },
  { id: 'igor',     name: 'Igel Igor',          kind: 'urchin',   body: '#8a5ad6' },
  { id: 'schnecki', name: 'Schnecki',           kind: 'snail',    body: '#f2c6a0', shell: '#e86a9a' },
  // Fantasietiere für die höheren Level
  { id: 'fluffi',   name: 'Fluffi Einhornfisch', kind: 'unicorn', shape: 'round', body: '#fff0fa', fin: '#c9a8ff', pat: 'spots', pc: '#ffc2e8', fantasy: true },
  { id: 'bruno',    name: 'Blubbdrache Bruno',   kind: 'dragon',  body: '#4fcf8a', fin: '#ffb84a', fantasy: true },
  { id: 'krapfi',   name: 'Krapfi Donutfisch',   kind: 'donut',   body: '#ff8fc8', fantasy: true },
  { id: 'wolki',    name: 'Wolki Wolkenqualle',  kind: 'cloudjelly', body: '#eef2ff', fantasy: true },
  { id: 'gustav',   name: 'Gustav Geisterfisch', kind: 'ghost',   shape: 'round', body: '#eef4ff', fin: '#c8d8ff', pat: 'none', pc: '#000', fantasy: true },
  { id: 'krabbo',   name: 'König Krabbo',        kind: 'kingcrab', body: '#ff9a2e', fantasy: true },
  { id: 'robo',     name: 'Robo-Barsch',         kind: 'robo',    shape: 'round', body: '#a8b8cc', fin: '#6fe0ff', pat: 'none', pc: '#000', fantasy: true },
  { id: 'glitzi',   name: 'Glitzi Glitzerkrake', kind: 'glitterocto', body: '#ff8fd0', fantasy: true },
  { id: 'kurt',     name: 'Kaktus-Kurt',         kind: 'cactus',  body: '#7ccf4a', fantasy: true },
  { id: 'kiki',     name: 'Kaugummi-Kiki',       kind: 'gum',     body: '#ffb3d9', fantasy: true },
  { id: 'stupsi',   name: 'Stupsi Sternschnuppe', kind: 'shootingstar', body: '#b88aff', fantasy: true },
);
SPECIES.forEach(s => { SPECIES_BY_ID[s.id] = s; });
