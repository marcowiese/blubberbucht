// Blubberbucht – Story-Postkarten: eigene, im Code gezeichnete Szenen mit den Blubberbucht-Tieren.
// Alle 10 Level wird eine Karte freigeschaltet. Optional kann eine Karte ein eigenes Bild bekommen
// (Feld `img`, z. B. 'postcards/01.webp') – dann wird das Bild statt der gezeichneten Szene gezeigt.
'use strict';

// kleiner, wiederholbarer Zufall pro Karte
function pcRand(seed) { let s = seed; return () => (s = (s * 9301 + 49297) % 233280) / 233280; }

// Tier aus dem Symbol-Set platzieren (x/y = Mitte, s = Größe, f = gespiegelt)
const pcU = (id, x, y, s, f = false, rot = 0) =>
  `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${f ? -1 : 1} 1)"><use href="#sp-${id}" x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}"/></g>`;

// ---------- Bausteine ----------
// Wasser mit Verlauf, Lichtstrahlen, Lichtnetz (Kaustik), Hintergrund-Riff, Sandboden, Vignette
function pcBase(id, o) {
  const { top, mid, bottom, sand = '#f3d99c', sandDark = '#c9a35e', rays = .16, caustics = .22, reef = '#1d5a8a', seed = 3 } = o;
  const r = pcRand(seed + 11);
  let reefShapes = '';
  for (let i = 0; i < 9; i++) {
    const x = r() * 170 - 5, w = 10 + r() * 22, h = 8 + r() * 16;
    reefShapes += `<ellipse cx="${x.toFixed(1)}" cy="${(80 - h * .3).toFixed(1)}" rx="${(w / 2).toFixed(1)}" ry="${(h / 2).toFixed(1)}"/>`;
  }
  return `
  <defs>
    <linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset=".55" stop-color="${mid}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>
    <linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sand}"/><stop offset="1" stop-color="${sandDark}"/></linearGradient>
    <linearGradient id="${id}fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".75" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <mask id="${id}m"><rect width="160" height="100" fill="url(#${id}fade)"/></mask>
    <filter id="${id}c" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".07 .11" numOctaves="2" seed="${seed}"/>
      <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 11 -6.2"/></filter>
    <filter id="${id}g" x="0" y="0" width="100%" height="100%"><feTurbulence baseFrequency=".85" numOctaves="1" seed="${seed + 5}"/>
      <feColorMatrix values="0 0 0 0 .35  0 0 0 0 .25  0 0 0 0 .1  0 0 0 .5 -.12"/></filter>
    <filter id="${id}b"><feGaussianBlur stdDeviation="1.4"/></filter>
    <filter id="${id}bb"><feGaussianBlur stdDeviation=".5"/></filter>
    <radialGradient id="${id}v" cx="50%" cy="45%" r="75%"><stop offset=".62" stop-color="#001030" stop-opacity="0"/><stop offset="1" stop-color="#001030" stop-opacity=".5"/></radialGradient>
    <clipPath id="${id}sc"><path d="M0 84 Q30 78 60 82 T120 80 T160 82 V100 H0Z"/></clipPath>
  </defs>
  <rect width="160" height="100" fill="url(#${id}w)"/>
  <g fill="#fff" opacity="${rays}" filter="url(#${id}b)"><path d="M18 -2 L34 -2 L64 100 L42 100Z"/><path d="M62 -2 L72 -2 L96 100 L84 100Z"/><path d="M104 -2 L118 -2 L140 100 L126 100Z"/><path d="M138 -2 L146 -2 L160 70 L152 70Z"/></g>
  <rect width="160" height="100" filter="url(#${id}c)" opacity="${caustics}" mask="url(#${id}m)"/>
  <g fill="${reef}" opacity=".35" filter="url(#${id}b)">${reefShapes}</g>
  <path d="M0 84 Q30 78 60 82 T120 80 T160 82 V100 H0Z" fill="url(#${id}s)"/>
  <rect width="160" height="100" filter="url(#${id}g)" clip-path="url(#${id}sc)" opacity=".7"/>
  <path d="M0 86 Q40 82 80 86 T160 85" stroke="#fff" stroke-width=".5" fill="none" opacity=".35"/>`;
}
const pcVignette = id => `<rect width="160" height="100" fill="url(#${id}v)"/>`;

function pcBubbles(n, seed, area = [0, 0, 160, 80]) {
  const r = pcRand(seed);
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = area[0] + r() * area[2], y = area[1] + r() * area[3], rr = .6 + r() * 2;
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rr.toFixed(1)}" fill="rgba(255,255,255,.12)" stroke="rgba(255,255,255,.75)" stroke-width=".35"/><circle cx="${(x - rr * .35).toFixed(1)}" cy="${(y - rr * .35).toFixed(1)}" r="${(rr * .25).toFixed(2)}" fill="#fff" opacity=".8"/>`;
  }
  return out;
}
// unscharfe Lichtpunkte im Vordergrund
function pcBokeh(n, seed, col = '#fff') {
  const r = pcRand(seed);
  let out = '';
  for (let i = 0; i < n; i++) out += `<circle cx="${(r() * 160).toFixed(1)}" cy="${(r() * 90).toFixed(1)}" r="${(1.5 + r() * 3.5).toFixed(1)}" fill="${col}" opacity="${(.06 + r() * .12).toFixed(2)}"/>`;
  return out;
}
// Fischschwarm als Silhouetten in der Ferne
function pcSchool(cx, cy, n, col, seed, flip = false) {
  const r = pcRand(seed);
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = cx + (r() - .5) * 26, y = cy + (r() - .5) * 12, s = .7 + r() * .5, f = flip ? -1 : 1;
    out += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(s * f).toFixed(2)} ${s.toFixed(2)})"><ellipse rx="2.4" ry="1.1"/><path d="M2 0 l2 -1.3 v2.6z"/></g>`;
  }
  return `<g fill="${col}" opacity=".45">${out}</g>`;
}
const pcKelp = (x, h, c, sway = 5) => {
  let leaves = '';
  for (let i = 1; i < 5; i++) {
    const y = 100 - h * i / 5, d = i % 2 ? 1 : -1;
    leaves += `<path d="M${x} ${y} q${d * 6} -2 ${d * 8} -6 q${-d * 4} 1 ${-d * 8} 6z" fill="${shade(c, .15)}" opacity=".9"/>`;
  }
  return `<path d="M${x} 100 C${x - sway} ${100 - h * .35} ${x + sway} ${100 - h * .65} ${x} ${100 - h}" stroke="${c}" stroke-width="2.4" fill="none" stroke-linecap="round"/>${leaves}`;
};
const pcRock = (x, y, w, h, c) =>
  `<g><ellipse cx="${x}" cy="${y}" rx="${w}" ry="${h}" fill="${shade(c, -.25)}"/><ellipse cx="${x - w * .15}" cy="${y - h * .25}" rx="${w * .8}" ry="${h * .7}" fill="${c}"/><ellipse cx="${x - w * .35}" cy="${y - h * .5}" rx="${w * .3}" ry="${h * .2}" fill="#fff" opacity=".18"/></g>`;
function pcAnemone(x, y, c, n = 9, len = 9) {
  let t = '';
  for (let i = 0; i < n; i++) {
    const a = -Math.PI * (.15 + .7 * i / (n - 1)), ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
    t += `<path d="M${x} ${y} Q${(x + ex) / 2 + Math.sin(i) * 2} ${(y + ey) / 2} ${ex.toFixed(1)} ${ey.toFixed(1)}" stroke="${c}" stroke-width="1.8" stroke-linecap="round" fill="none"/><circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="1.1" fill="${shade(c, .45)}"/>`;
  }
  return `<g>${t}<ellipse cx="${x}" cy="${y + 1.5}" rx="5" ry="2.6" fill="${shade(c, -.3)}"/></g>`;
}
function pcFan(x, y, c, s = 1) {
  let br = '';
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * .28;
    br += `<path d="M${x} ${y} L${(x + Math.cos(a) * 16 * s).toFixed(1)} ${(y + Math.sin(a) * 16 * s).toFixed(1)}" stroke="${c}" stroke-width=".9"/>`;
  }
  return `<g opacity=".95">${br}<path d="M${x - 9 * s} ${y - 12 * s} Q${x} ${y - 20 * s} ${x + 9 * s} ${y - 12 * s}" stroke="${c}" stroke-width=".7" fill="none"/><path d="M${x - 6 * s} ${y - 7 * s} Q${x} ${y - 12 * s} ${x + 6 * s} ${y - 7 * s}" stroke="${c}" stroke-width=".7" fill="none"/></g>`;
}
const pcBrain = (x, y, r, c) => `<g><circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/><path d="M${x - r * .7} ${y - r * .2} q${r * .3} ${-r * .5} ${r * .6} 0 t${r * .6} 0 M${x - r * .8} ${y + r * .25} q${r * .35} ${-r * .45} ${r * .7} 0 t${r * .7} 0" stroke="${shade(c, -.3)}" stroke-width=".8" fill="none"/><ellipse cx="${x - r * .35}" cy="${y - r * .45}" rx="${r * .35}" ry="${r * .18}" fill="#fff" opacity=".25"/></g>`;
const pcCoral = (x, y, c, s = 1) => `<g fill="none" stroke="${c}" stroke-width="${2.4 * s}" stroke-linecap="round"><path d="M${x} ${y} v${-12 * s} M${x} ${y - 6 * s} l${-5 * s} ${-6 * s} M${x} ${y - 9 * s} l${5 * s} ${-5 * s} M${x - 5 * s} ${y - 12 * s} v${-3 * s}"/></g>`;
const pcShell = (x, y, c, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-6 0 Q0 -10 6 0Z" fill="${c}" stroke="${shade(c, -.35)}" stroke-width=".6"/><path d="M0 -8 V0 M-3.5 -5.5 L-1.8 0 M3.5 -5.5 L1.8 0" stroke="${shade(c, -.35)}" stroke-width=".5"/></g>`;
const pcStarfish = (x, y, c, s = 1, rot = 0) => {
  const p = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = (i % 2 ? 2 : 5) * s; p.push(`${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`); }
  return `<polygon points="${p.join(' ')}" fill="${c}" stroke="${shade(c, -.3)}" stroke-width=".5" stroke-linejoin="round" transform="rotate(${rot} ${x} ${y})"/>`;
};
const pcShadow = (x, y, w) => `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${w * .18}" fill="#00203a" opacity=".22"/>`;

// ---------- Die Postkarten ----------
const POSTCARDS = [
  {
    level: 10, img: 'postcards/postkarte-10.webp', title: 'Willkommen in der Blubberbucht',
    text: 'Zitrino zeigt dir sein Zuhause: ein sonniges Riff voller Farben – und überall wollen Tiere sortiert werden!',
    svg: () => `${pcBase('p1', { top: '#9ff0ff', mid: '#35b4ec', bottom: '#1a78c4', reef: '#1d6a9a', seed: 4 })}
      ${pcSchool(122, 30, 12, '#0e4d80', 7, true)}${pcSchool(30, 22, 8, '#0e4d80', 9)}
      ${pcRock(18, 86, 16, 8, '#8a7a9a')}${pcRock(140, 88, 20, 9, '#7a8aa0')}
      ${pcFan(14, 80, '#ff5a8a', 1.1)}${pcFan(148, 82, '#ffa64a', 1)}
      ${pcBrain(40, 88, 6, '#f2a640')}${pcBrain(118, 89, 5, '#c35bd6')}
      ${pcCoral(28, 92, '#ff6f8f', 1.2)}${pcCoral(132, 92, '#4fd0c0', 1.1)}${pcCoral(104, 94, '#ffd23a', .9)}
      ${pcAnemone(58, 92, '#ff8ac0')}${pcAnemone(96, 93, '#7be0a0', 8, 8)}
      ${pcKelp(6, 44, '#2f9a5a')}${pcKelp(156, 38, '#3aae64', -4)}
      ${pcStarfish(76, 95, '#ff7a3d', 1, 18)}${pcShell(48, 96, '#ffe3f0', .8)}
      ${pcBubbles(22, 7)}
      ${pcShadow(78, 92, 18)}
      ${pcU('rosalie', 34, 40, 18)}${pcU('koralla', 124, 52, 20, true)}${pcU('zitrino', 78, 52, 42)}
      ${pcBokeh(10, 12)}${pcVignette('p1')}`,
  },
  {
    level: 20, img: 'postcards/postkarte-20.webp', title: 'Schildis Muschelgarten',
    text: 'Schildi pflegt einen geheimen Garten aus Muscheln. Wer leise ist, hört die Muscheln rauschen.',
    svg: () => `${pcBase('p2', { top: '#a8f4e0', mid: '#3cbcc0', bottom: '#1a7c9a', sand: '#f5e0aa', sandDark: '#cfa866', reef: '#1a6a70', seed: 12 })}
      ${pcSchool(40, 26, 10, '#0d5a66', 21)}
      ${pcRock(126, 84, 24, 12, '#7f8f8a')}${pcRock(30, 87, 14, 7, '#8a9690')}
      ${pcKelp(10, 58, '#2e8f52')}${pcKelp(20, 42, '#46b56e', -4)}${pcKelp(150, 54, '#2e8f52', -5)}
      ${[[44, 93, '#ffb3c7', 1.2], [58, 96, '#fff1c9', 1], [72, 92, '#ffd2a8', 1.3], [104, 95, '#f6c9ff', 1.1], [118, 92, '#ffe0b0', .9], [90, 97, '#ffc2d8', .8]].map(([x, y, c, s]) => pcShell(x, y, c, s)).join('')}
      <g><path d="M120 76 q6 -10 14 -2 q-6 6 -14 2z" fill="#f6c9ff" stroke="#b08ac0" stroke-width=".6"/><circle cx="127" cy="75" r="2.2" fill="#fff"/><circle cx="126.3" cy="74.3" r=".7" fill="#fff" opacity=".9"/></g>
      ${pcAnemone(140, 92, '#ffa0c8', 10, 9)}${pcCoral(36, 92, '#ff8a6a', 1)}
      ${pcBubbles(16, 21)}
      ${pcShadow(82, 92, 22)}
      ${pcU('minzi', 124, 34, 18, true)}${pcU('schildi', 82, 60, 50)}${pcU('gari', 30, 66, 16)}
      ${pcBokeh(8, 31)}${pcVignette('p2')}`,
  },
  {
    level: 30, img: 'postcards/postkarte-30.webp', title: 'Die leuchtende Höhle',
    text: 'Tief unten leuchtet Qualli den Weg. Okti ist ein bisschen ängstlich – aber gemeinsam trauen sie sich hinein.',
    svg: () => `
      <defs><radialGradient id="p3bg" cx="45%" cy="45%" r="75%"><stop offset="0" stop-color="#4b47b8"/><stop offset=".55" stop-color="#211f6e"/><stop offset="1" stop-color="#0a0828"/></radialGradient>
      <radialGradient id="p3g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffd8f4" stop-opacity=".8"/><stop offset="1" stop-color="#ffd8f4" stop-opacity="0"/></radialGradient>
      <radialGradient id="p3m" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#8ff8ff" stop-opacity=".7"/><stop offset="1" stop-color="#8ff8ff" stop-opacity="0"/></radialGradient>
      <filter id="p3b"><feGaussianBlur stdDeviation="1.2"/></filter>
      <radialGradient id="p3v" cx="50%" cy="48%" r="70%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></radialGradient></defs>
      <rect width="160" height="100" fill="url(#p3bg)"/>
      <path d="M0 0 H160 V22 Q140 30 126 20 Q110 36 92 24 Q76 34 60 22 Q40 34 24 20 Q12 28 0 18Z" fill="#100e38"/>
      <path d="M30 22 v8 M58 24 v10 M96 26 v7 M128 22 v9" stroke="#2a2770" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M0 100 H160 V82 Q140 74 120 82 Q100 72 80 80 Q56 70 36 80 Q16 72 0 82Z" fill="#0c0a2c"/>
      ${[[18, 80, 1], [30, 84, .8], [126, 80, 1.1], [142, 85, .9], [104, 86, .7]].map(([x, y, s]) =>
        `<g><circle cx="${x}" cy="${y - 5 * s}" r="${10 * s}" fill="url(#p3m)"/><rect x="${x - .7 * s}" y="${y - 4 * s}" width="${1.4 * s}" height="${6 * s}" fill="#9ff0d8"/><ellipse cx="${x}" cy="${y - 4.5 * s}" rx="${4.5 * s}" ry="${2.8 * s}" fill="#9ff8ff"/><ellipse cx="${x - 1.4 * s}" cy="${y - 5.4 * s}" rx="${1.4 * s}" ry=".7" fill="#fff" opacity=".8"/></g>`).join('')}
      ${Array.from({ length: 26 }, (_, i) => { const r = pcRand(40 + i); return `<circle cx="${(r() * 160).toFixed(1)}" cy="${(20 + r() * 60).toFixed(1)}" r="${(.3 + r() * .7).toFixed(2)}" fill="#bff" opacity="${(.4 + r() * .5).toFixed(2)}"/>`; }).join('')}
      <circle cx="62" cy="46" r="34" fill="url(#p3g)"/>
      ${pcBubbles(10, 33, [10, 25, 140, 50])}
      ${pcU('qualli', 62, 44, 42)}${pcU('okti', 110, 60, 36, true)}
      <rect width="160" height="100" fill="url(#p3v)"/>`,
  },
  {
    level: 40, img: 'postcards/postkarte-40.webp', title: 'Kalles Sandburg',
    text: 'Kalle baut die größte Sandburg der Bucht. Ob sie die nächste Strömung übersteht?',
    svg: () => `${pcBase('p4', { top: '#b6f0ff', mid: '#4ab8ee', bottom: '#2283cc', sand: '#f6dc9c', sandDark: '#d2a85c', reef: '#2a70a8', seed: 27 })}
      <defs><linearGradient id="p4c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f0cf86"/><stop offset=".6" stop-color="#e0b468"/><stop offset="1" stop-color="#c49448"/></linearGradient></defs>
      ${pcSchool(40, 24, 9, '#13588e', 51)}
      <g fill="url(#p4c)" stroke="#a87c3a" stroke-width=".7">
        <path d="M84 88 V58 h44 V88Z"/><path d="M78 88 V46 h14 V88Z"/><path d="M120 88 V46 h14 V88Z"/><path d="M98 60 V36 h18 V60Z"/>
        ${[78, 82.6, 87.2, 120, 124.6, 129.2].map(x => `<rect x="${x}" y="42" width="4.8" height="4.4"/>`).join('')}
        ${[98, 102.6, 107.2, 111.8].map(x => `<rect x="${x}" y="32" width="4.2" height="4.4"/>`).join('')}
      </g>
      <g fill="#c49448" opacity=".5">${Array.from({ length: 30 }, (_, i) => { const r = pcRand(60 + i); return `<circle cx="${(80 + r() * 52).toFixed(1)}" cy="${(40 + r() * 46).toFixed(1)}" r=".45"/>`; }).join('')}</g>
      <path d="M102 76 a5 5 0 0 1 10 0 V88 h-10Z" fill="#6a4a24"/><rect x="86" y="64" width="5" height="6" rx="2.5" fill="#6a4a24"/><rect x="123" y="64" width="5" height="6" rx="2.5" fill="#6a4a24"/>
      <path d="M107 36 V22" stroke="#7a5a30" stroke-width=".9"/><path d="M107 22 l11 3.5 -11 3.5" fill="#ff5a4e" stroke="#8a2a20" stroke-width=".5"/>
      ${pcShell(70, 95, '#ffd2a8', 1)}${pcShell(140, 96, '#fff1c9', .9)}${pcStarfish(150, 90, '#ff9f2e', 1, -12)}
      ${pcKelp(8, 46, '#2f9a5a')}${pcKelp(16, 30, '#46b56e', -3)}${pcAnemone(28, 93, '#ff8ac0', 8, 8)}
      ${pcBubbles(14, 44)}
      ${pcShadow(52, 93, 16)}
      ${pcU('puffi', 34, 36, 22)}${pcU('krabbe', 52, 76, 38)}
      ${pcBokeh(8, 47)}${pcVignette('p4')}`,
  },
  {
    level: 50, img: 'postcards/postkarte-50.webp', title: 'Wal Willis Wellenritt',
    text: 'Einmal im Jahr nimmt Wal Willi alle mit an die Oberfläche. Die Aussicht ist einfach riesig!',
    svg: () => `
      <defs><linearGradient id="p5sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf9a"/><stop offset=".6" stop-color="#ffa8bf"/><stop offset="1" stop-color="#ffd7a0"/></linearGradient>
      <linearGradient id="p5sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4fc8f4"/><stop offset=".5" stop-color="#2190da"/><stop offset="1" stop-color="#0e5aa8"/></linearGradient>
      <radialGradient id="p5sun" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff7c0"/><stop offset=".4" stop-color="#ffe680" stop-opacity=".9"/><stop offset="1" stop-color="#ffe680" stop-opacity="0"/></radialGradient>
      <filter id="p5b"><feGaussianBlur stdDeviation="1"/></filter>
      <radialGradient id="p5v" cx="50%" cy="45%" r="75%"><stop offset=".62" stop-color="#001030" stop-opacity="0"/><stop offset="1" stop-color="#001030" stop-opacity=".4"/></radialGradient></defs>
      <rect width="160" height="38" fill="url(#p5sky)"/>
      <circle cx="122" cy="22" r="20" fill="url(#p5sun)"/><circle cx="122" cy="22" r="7" fill="#fff8d0"/>
      <g fill="#fff" opacity=".85"><ellipse cx="30" cy="14" rx="12" ry="3.5"/><ellipse cx="38" cy="11" rx="7" ry="3"/><ellipse cx="78" cy="20" rx="9" ry="2.6"/></g>
      <path d="M0 36 Q8 33 16 36 T32 36 T48 36 T64 36 T80 36 T96 36 T112 36 T128 36 T144 36 T160 36 V100 H0Z" fill="url(#p5sea)"/>
      <path d="M0 36 Q8 33 16 36 T32 36 T48 36 T64 36 T80 36 T96 36 T112 36 T128 36 T144 36 T160 36" stroke="#fff" stroke-width=".9" fill="none" opacity=".9"/>
      <path d="M108 38 h28 M112 41 h20 M116 44 h12" stroke="#fff3b0" stroke-width=".8" opacity=".7"/>
      <g fill="#fff" opacity=".18" filter="url(#p5b)"><path d="M20 38 L30 38 L50 100 L38 100Z"/><path d="M80 38 L88 38 L104 100 L94 100Z"/></g>
      <path d="M92 28 q-6 -8 -12 -6 M92 28 q2 -10 8 -12 M92 28 q6 -6 12 -4" stroke="#bff0ff" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      ${pcBubbles(14, 55, [0, 45, 160, 50])}${pcSchool(30, 78, 12, '#0b4a88', 66)}
      ${pcU('willi', 82, 52, 72)}${pcU('zitrino', 42, 24, 16)}${pcU('aqua', 132, 50, 16, true)}${pcU('tomato', 24, 62, 18)}${pcU('seppi', 140, 76, 18, true)}
      ${pcBokeh(6, 59)}<rect width="160" height="100" fill="url(#p5v)"/>`,
  },
  {
    level: 60, img: 'postcards/postkarte-60.webp', title: 'Sternennacht im Riff',
    text: 'Wenn es dunkel wird, funkelt Stella mit den Sternen um die Wette. Gute Nacht, Blubberbucht!',
    svg: () => `${pcBase('p6', { top: '#22357e', mid: '#162a66', bottom: '#0a1640', sand: '#4a5a8a', sandDark: '#2a3460', rays: .07, caustics: .1, reef: '#0a1640', seed: 61 })}
      <defs><radialGradient id="p6moon" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff6c8" stop-opacity=".6"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></radialGradient>
      <radialGradient id="p6glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffcf6a" stop-opacity=".55"/><stop offset="1" stop-color="#ffcf6a" stop-opacity="0"/></radialGradient></defs>
      <circle cx="30" cy="18" r="22" fill="url(#p6moon)"/><circle cx="30" cy="18" r="8" fill="#fff6c8"/><circle cx="33" cy="16" r="7" fill="#22357e"/>
      ${Array.from({ length: 22 }, (_, i) => { const r = pcRand(80 + i); return `<circle cx="${(50 + r() * 110).toFixed(1)}" cy="${(4 + r() * 34).toFixed(1)}" r="${(.3 + r() * .6).toFixed(2)}" fill="#fff" opacity="${(.5 + r() * .5).toFixed(2)}"/>`; }).join('')}
      ${pcFan(16, 84, '#7a5ad6', 1.1)}${pcFan(146, 84, '#d65a9a', 1)}${pcBrain(124, 90, 5, '#4a3a8a')}
      ${pcCoral(30, 93, '#9a7ae6', 1.1)}${pcAnemone(102, 93, '#c08ae6', 9, 8)}${pcKelp(154, 34, '#1e5a5a', -3)}
      ${pcStarfish(56, 95, '#ff9f2e', .9, 20)}${pcStarfish(136, 96, '#ffcf4a', .7, -10)}
      <circle cx="80" cy="60" r="26" fill="url(#p6glow)"/>
      ${pcBubbles(8, 66)}
      ${pcU('stella', 80, 62, 42)}${pcU('luna', 124, 46, 22, true)}${pcU('zebrino', 40, 54, 20)}${pcU('schnecki', 112, 88, 14, true)}
      ${pcBokeh(8, 71, '#cfe0ff')}${pcVignette('p6')}`,
  },
  {
    level: 70, img: 'postcards/postkarte-70.jpg', title: 'Seppis Seegraswald',
    text: 'Seppi Seepferdchen kennt jeden Halm im Seegraswald. Heute zeigt er Garnele Gari sein Lieblingsversteck.',
    svg: () => `${pcBase('p7', { top: '#b8f4d0', mid: '#46b89a', bottom: '#1d7a6a', sand: '#efd8a0', sandDark: '#c4a060', reef: '#1a5a4a', seed: 71 })}
      ${pcKelp(10, 70, '#2a8a4a', 6)}${pcKelp(24, 84, '#3aa860', -5)}${pcKelp(40, 60, '#2a8a4a', 4)}${pcKelp(120, 76, '#3aa860', -6)}${pcKelp(136, 88, '#2a8a4a', 5)}${pcKelp(152, 64, '#46b56e', -4)}
      ${pcSchool(84, 22, 9, '#0e5a4a', 72)}${pcShell(64, 95, '#ffe0b0', .9)}${pcStarfish(100, 95, '#ff9f2e', .9, 14)}
      ${pcBubbles(16, 73)}
      ${pcU('seppi', 74, 52, 44)}${pcU('gari', 104, 72, 20, true)}
      ${pcBokeh(8, 74)}${pcVignette('p7')}`,
  },
  {
    level: 80, img: 'postcards/postkarte-80.jpg', title: 'Rocco und die große Strömung',
    text: 'Wenn die Strömung kommt, breitet Rochen Rocco seine Flügel aus – und alle dürfen mitgleiten.',
    svg: () => `${pcBase('p8', { top: '#a8e8ff', mid: '#3aa0e0', bottom: '#165ea8', reef: '#1a5a8a', seed: 81 })}
      <g stroke="#fff" stroke-width=".7" fill="none" opacity=".35"><path d="M0 30 Q40 22 80 30 T160 28"/><path d="M0 44 Q40 36 80 44 T160 42"/><path d="M0 58 Q40 50 80 58 T160 56"/></g>
      ${pcSchool(40, 36, 14, '#0e4a80', 82)}${pcRock(140, 88, 18, 8, '#7a8aa0')}${pcFan(146, 82, '#ff8a5a')}${pcBrain(22, 89, 5, '#c35bd6')}
      ${pcBubbles(14, 83)}
      ${pcU('rocco', 82, 50, 56)}${pcU('limo', 122, 34, 18, true)}${pcU('blaubeer', 36, 66, 16)}
      ${pcBokeh(8, 84)}${pcVignette('p8')}`,
  },
  {
    level: 90, img: 'postcards/postkarte-90.jpg', title: 'Mias Perlenschatz',
    text: 'Muschel Mia hütet die schönste Perle der Bucht. Igel Igor passt auf, dass niemand schummelt.',
    svg: () => `${pcBase('p9', { top: '#c8e8ff', mid: '#5a9ae0', bottom: '#2a58a8', sand: '#f2dcaa', sandDark: '#c8a464', reef: '#2a4a8a', seed: 91 })}
      <defs><radialGradient id="p9g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
      ${pcRock(30, 88, 18, 9, '#8a7aa0')}${pcRock(132, 87, 22, 10, '#7a8aa0')}${pcAnemone(140, 82, '#ffa0c8')}${pcCoral(20, 90, '#ff6f8f')}
      <circle cx="80" cy="64" r="24" fill="url(#p9g)"/>
      ${pcBubbles(12, 93)}
      ${pcU('mia', 80, 70, 40)}${pcU('igor', 116, 78, 22)}${pcU('rosalie', 40, 40, 18)}
      ${pcBokeh(10, 94, '#fff6e0')}${pcVignette('p9')}`,
  },
  {
    level: 100, img: 'postcards/postkarte-100.jpg', title: 'Fluffis Regenbogenriff',
    text: 'Level 100! Wo Fluffi Einhornfisch schwimmt, leuchtet das Riff in allen Farben des Regenbogens.',
    svg: () => `${pcBase('p10', { top: '#ffe0f4', mid: '#9ab8ff', bottom: '#5a6ad8', sand: '#ffe8c8', sandDark: '#e0b0c0', reef: '#6a4aa8', seed: 101 })}
      <g fill="none" stroke-width="3" opacity=".45" stroke-linecap="round">${['#ff6f8f', '#ffb84a', '#fff36b', '#7be05a', '#4fb8ff', '#a271ff'].map((c, i) => `<path d="M10 ${78 - i * 3} Q80 ${10 - i * 3} 150 ${78 - i * 3}" stroke="${c}"/>`).join('')}</g>
      ${pcFan(16, 84, '#ff5a8a')}${pcFan(146, 84, '#a271ff')}${pcBrain(40, 90, 5, '#ffb84a')}${pcBrain(120, 90, 5, '#4fd0c0')}${pcAnemone(80, 94, '#ff9ad5')}
      ${pcBubbles(18, 103)}
      ${pcU('fluffi', 80, 50, 46)}${pcU('qualli', 128, 36, 18)}${pcU('zitrino', 34, 40, 16)}
      ${pcBokeh(14, 104, '#ffe8ff')}${pcVignette('p10')}`,
  },
  {
    level: 110, img: 'postcards/postkarte-110.jpg', title: 'Brunos Drachenhöhle',
    text: 'Tief unter dem Riff wohnt Blubbdrache Bruno. Er sieht wild aus – aber er backt die besten Algenkekse.',
    svg: () => `
      <defs><radialGradient id="p11bg" cx="55%" cy="55%" r="75%"><stop offset="0" stop-color="#ff9a4a"/><stop offset=".45" stop-color="#8a2a3a"/><stop offset="1" stop-color="#1a0814"/></radialGradient>
      <radialGradient id="p11v" cx="50%" cy="50%" r="70%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></radialGradient></defs>
      <rect width="160" height="100" fill="url(#p11bg)"/>
      <path d="M0 0 H160 V20 Q130 32 110 18 Q90 30 70 18 Q46 32 26 18 Q12 26 0 16Z" fill="#2a0a14"/>
      <path d="M0 100 H160 V84 Q130 76 108 84 Q84 74 60 84 Q34 76 0 86Z" fill="#2a0a14"/>
      ${[[22, 84], [44, 88], [118, 86], [140, 82]].map(([x, y]) => `<g><path d="M${x - 4} ${y} l4 -12 l4 12z" fill="#ff7a3a" opacity=".9"/><circle cx="${x}" cy="${y - 6}" r="8" fill="#ffb84a" opacity=".2"/></g>`).join('')}
      ${pcBubbles(12, 113, [10, 25, 140, 50])}
      ${pcU('bruno', 78, 54, 52)}${pcU('kurt', 128, 40, 18, true)}
      <rect width="160" height="100" fill="url(#p11v)"/>`,
  },
  {
    level: 120, img: 'postcards/postkarte-120.jpg', title: 'Krapfis süßes Fest',
    text: 'Krapfi Donutfisch feiert Geburtstag! Kaugummi-Kiki bringt die größte Blase mit, die die Bucht je gesehen hat.',
    svg: () => `${pcBase('p12', { top: '#ffe8f4', mid: '#ffb3d9', bottom: '#d870b0', sand: '#fff0d8', sandDark: '#e8b8b0', reef: '#a85a90', seed: 121 })}
      ${Array.from({ length: 40 }, (_, i) => { const r = pcRand(130 + i); const cols = ['#fff36b', '#6fe0ff', '#7be05a', '#ffffff', '#a271ff', '#ff6f8f']; return `<rect x="${(r() * 160).toFixed(1)}" y="${(r() * 80).toFixed(1)}" width="2.4" height="1" rx=".5" fill="${cols[i % 6]}" transform="rotate(${(r() * 180).toFixed(0)} ${(r() * 160).toFixed(1)} ${(r() * 80).toFixed(1)})"/>`; }).join('')}
      <g><path d="M120 18 v24" stroke="#fff" stroke-width=".6"/><ellipse cx="120" cy="14" rx="7" ry="8" fill="#ff6f8f"/><path d="M40 22 v20" stroke="#fff" stroke-width=".6"/><ellipse cx="40" cy="18" rx="6" ry="7" fill="#6fe0ff"/></g>
      ${pcBubbles(14, 123)}
      ${pcU('krapfi', 72, 56, 46)}${pcU('kiki', 120, 62, 28, true)}${pcU('rosalie', 30, 66, 18)}
      ${pcBokeh(12, 124, '#fff0f8')}${pcVignette('p12')}`,
  },
  {
    level: 130, img: 'postcards/postkarte-130.jpg', title: 'König Krabbos Muschelthron',
    text: 'Einmal im Jahr hält König Krabbo Hof. Wer drei gleiche Tiere sortiert, darf sich etwas wünschen.',
    svg: () => `${pcBase('p13', { top: '#fff2c0', mid: '#5ab0e0', bottom: '#1d6ab0', sand: '#f6dc9c', sandDark: '#d2a85c', reef: '#2a5a8a', seed: 131 })}
      <g>${pcRock(80, 84, 30, 12, '#c8a0e0')}<path d="M58 80 Q80 40 102 80Z" fill="#f6c9ff" stroke="#b08ac0" stroke-width=".8"/>${[-14, -7, 0, 7, 14].map(d => `<path d="M80 80 L${80 + d * 1.4} ${50 + Math.abs(d)}" stroke="#b08ac0" stroke-width=".6"/>`).join('')}</g>
      ${pcShell(40, 94, '#ffe0b0', 1.1)}${pcShell(122, 95, '#ffc2d8', 1)}${pcStarfish(140, 92, '#ff9f2e', 1, 12)}${pcStarfish(22, 93, '#ffcf4a', .8, -14)}
      ${pcBubbles(14, 133)}
      ${pcU('krabbo', 80, 62, 40)}${pcU('glitzi', 128, 42, 22, true)}${pcU('seppi', 34, 50, 18)}
      ${pcBokeh(12, 134, '#fff6c0')}${pcVignette('p13')}`,
  },
  {
    level: 140, img: 'postcards/postkarte-140.jpg', title: 'Wolkis Himmelsmeer',
    text: 'Ganz oben, wo das Meer den Himmel berührt, schwebt Wolki Wolkenqualle – und lässt es Bläschen regnen.',
    svg: () => `
      <defs><linearGradient id="p14" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8f0ff"/><stop offset=".5" stop-color="#8ad0ff"/><stop offset="1" stop-color="#3a90e0"/></linearGradient>
      <radialGradient id="p14v" cx="50%" cy="45%" r="75%"><stop offset=".62" stop-color="#001030" stop-opacity="0"/><stop offset="1" stop-color="#001030" stop-opacity=".35"/></radialGradient></defs>
      <rect width="160" height="100" fill="url(#p14)"/>
      <path d="M0 22 Q10 19 20 22 T40 22 T60 22 T80 22 T100 22 T120 22 T140 22 T160 22" stroke="#fff" stroke-width="1" fill="none" opacity=".9"/>
      <g fill="#fff" opacity=".8"><ellipse cx="28" cy="10" rx="12" ry="4"/><ellipse cx="120" cy="8" rx="16" ry="4.5"/></g>
      <g fill="none" stroke-width="2.4" opacity=".5" stroke-linecap="round">${['#ff6f8f', '#ffcf2e', '#7be05a', '#4fb8ff', '#a271ff'].map((c, i) => `<path d="M20 ${96 - i * 3} Q80 ${44 - i * 3} 140 ${96 - i * 3}" stroke="${c}"/>`).join('')}</g>
      ${pcBubbles(26, 143, [0, 30, 160, 70])}
      ${pcU('wolki', 80, 52, 48)}${pcU('aqua', 128, 70, 18, true)}${pcU('luna', 32, 72, 18)}
      ${pcBokeh(10, 144)}<rect width="160" height="100" fill="url(#p14v)"/>`,
  },
  {
    level: 150, img: 'postcards/postkarte-150.jpg', title: 'Stupsis Sternschnuppennacht',
    text: 'Level 150 – du bist eine Legende der Blubberbucht! Stupsi Sternschnuppe fliegt eine Ehrenrunde nur für dich.',
    svg: () => `${pcBase('p15', { top: '#2a2a7a', mid: '#1a1a5a', bottom: '#0a0a30', sand: '#4a4a8a', sandDark: '#2a2a5a', rays: .06, caustics: .08, reef: '#0a0a30', seed: 151 })}
      ${Array.from({ length: 30 }, (_, i) => { const r = pcRand(160 + i); return `<circle cx="${(r() * 160).toFixed(1)}" cy="${(2 + r() * 40).toFixed(1)}" r="${(.3 + r() * .7).toFixed(2)}" fill="#fff" opacity="${(.5 + r() * .5).toFixed(2)}"/>`; }).join('')}
      <path d="M150 6 L96 38" stroke="#fff6a8" stroke-width="1.4" opacity=".7" stroke-linecap="round"/><path d="M140 4 L100 30" stroke="#fff" stroke-width=".6" opacity=".5"/>
      ${pcFan(18, 84, '#7a5ad6')}${pcCoral(140, 92, '#d65a9a')}${pcAnemone(110, 93, '#c08ae6')}
      ${pcBubbles(10, 153)}
      ${pcU('stupsi', 84, 44, 40)}${pcU('gustav', 40, 66, 24)}${pcU('robo', 126, 70, 22, true)}${pcU('stella', 66, 86, 16)}
      ${pcBokeh(10, 154, '#cfe0ff')}${pcVignette('p15')}`,
  },
];

function postcardArt(pc) {
  return pc.img
    ? `<img class="pc-img" src="${pc.img}" alt="${pc.title}" loading="lazy">`
    : `<svg class="pc-svg" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice">${pc.svg()}</svg>`;
}
// alter Name, wird noch an einigen Stellen benutzt
const postcardSVG = postcardArt;

// ---------- Export als Bild (zum Speichern in Fotos / Teilen) ----------
async function postcardBlob(pc) {
  const W = 1600, H = 1000, PAD = 56, CAP = 190;
  const img = new Image();
  if (pc.img) img.src = pc.img;
  else {
    const inner = pc.svg();
    const ids = [...new Set([...inner.matchAll(/href="#(sp-[\w-]+)"/g)].map(m => m[1]))];
    const defs = ids.map(id => document.getElementById(id)?.outerHTML || '').join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 160 100" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"><defs>${defs}</defs>${inner}</svg>`;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  await img.decode();
  const c = document.createElement('canvas');
  c.width = W + PAD * 2; c.height = H + PAD * 2 + CAP;
  const x = c.getContext('2d');
  x.fillStyle = '#fffaf0'; x.fillRect(0, 0, c.width, c.height);
  // Bild (bei eigenen Fotos mittig zugeschnitten)
  const iw = img.naturalWidth || W, ih = img.naturalHeight || H, sc = Math.max(W / iw, H / ih);
  x.save(); x.beginPath(); x.rect(PAD, PAD, W, H); x.clip();
  x.drawImage(img, PAD + (W - iw * sc) / 2, PAD + (H - ih * sc) / 2, iw * sc, ih * sc); x.restore();
  x.fillStyle = '#4a3a20'; x.textAlign = 'left';
  x.font = '700 64px Fredoka, ui-rounded, system-ui, sans-serif';
  x.fillText(pc.title, PAD, H + PAD + 92);
  x.font = '500 38px Fredoka, ui-rounded, system-ui, sans-serif'; x.fillStyle = '#8a7350';
  x.fillText(`Blubberbucht · erobert in Level ${pc.level} · Hase Games`, PAD, H + PAD + 150);
  return new Promise(r => c.toBlob(r, 'image/png'));
}
async function savePostcard(pc) {
  const blob = await postcardBlob(pc);
  const name = `Blubberbucht-${pc.title.replace(/[^\wäöüÄÖÜß]+/g, '-')}.png`;
  const file = new File([blob], name, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: pc.title }); return 'shared'; }
    catch (e) { if (e.name === 'AbortError') return 'aborted'; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'downloaded';
}
