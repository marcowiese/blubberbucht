// Blubberbucht – Story-Postkarten: eigene, im Code gezeichnete Szenen mit den Blubberbucht-Tieren.
// Alle 10 Level wird eine Karte freigeschaltet.
'use strict';

// Tier aus dem Symbol-Set platzieren (x/y = Mitte, s = Größe, f = gespiegelt)
const pcU = (id, x, y, s, f = false, rot = 0) =>
  `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${f ? -1 : 1} 1)"><use href="#sp-${id}" x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}"/></g>`;
const pcBubbles = (n, seed, w = 160, h = 100) => {
  let s = seed, out = '';
  const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < n; i++) out += `<circle cx="${(r() * w).toFixed(1)}" cy="${(r() * h).toFixed(1)}" r="${(0.8 + r() * 2.2).toFixed(1)}" fill="rgba(255,255,255,.15)" stroke="rgba(255,255,255,.7)" stroke-width=".4"/>`;
  return out;
};
const pcWeed = (x, h, c) => `<path d="M${x} 100 C${x - 5} ${100 - h * .35} ${x + 5} ${100 - h * .6} ${x} ${100 - h}" stroke="${c}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
const pcCoral = (x, y, c) => `<g fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"><path d="M${x} ${y} v-12 M${x} ${y - 6} l-5 -6 M${x} ${y - 9} l5 -5"/></g>`;

const POSTCARDS = [
  {
    level: 10, title: 'Willkommen in der Blubberbucht',
    text: 'Zitrino zeigt dir sein Zuhause: ein sonniges Riff voller Farben – und überall wollen Tiere sortiert werden!',
    svg: () => `
      <defs><linearGradient id="pc1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fe0ff"/><stop offset=".7" stop-color="#2a9be6"/><stop offset="1" stop-color="#1f7cc8"/></linearGradient></defs>
      <rect width="160" height="100" fill="url(#pc1)"/>
      <g fill="#fff" opacity=".18"><path d="M20 0 L40 0 L70 100 L45 100Z"/><path d="M70 0 L82 0 L110 100 L95 100Z"/><path d="M115 0 L130 0 L150 100 L138 100Z"/></g>
      <ellipse cx="80" cy="104" rx="110" ry="18" fill="#f2d99a"/>
      ${pcCoral(22, 94, '#ff6f8f')}${pcCoral(140, 95, '#c35bd6')}${pcWeed(10, 40, '#2fa35a')}${pcWeed(152, 34, '#45c26e')}
      ${pcBubbles(18, 7)}
      ${pcU('zitrino', 74, 52, 46)}${pcU('koralla', 120, 36, 22, true)}${pcU('rosalie', 34, 30, 20)}`,
  },
  {
    level: 20, title: 'Schildis Muschelgarten',
    text: 'Schildi pflegt einen geheimen Garten aus Muscheln. Wer leise ist, hört die Muscheln rauschen.',
    svg: () => `
      <defs><linearGradient id="pc2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fe8d8"/><stop offset="1" stop-color="#2a8fb0"/></linearGradient></defs>
      <rect width="160" height="100" fill="url(#pc2)"/>
      <ellipse cx="80" cy="106" rx="120" ry="22" fill="#e9cf94"/>
      ${[[30, 86, '#ffb3c7'], [52, 90, '#fff1c9'], [104, 88, '#ffd2a8'], [128, 91, '#f6c9ff']].map(([x, y, c]) =>
        `<g transform="translate(${x} ${y})"><path d="M-7 0 Q0 -12 7 0 Z" fill="${c}" stroke="#c58a6a" stroke-width=".8"/><path d="M0 -9 V0 M-4 -6 L-2 0 M4 -6 L2 0" stroke="#c58a6a" stroke-width=".6"/></g>`).join('')}
      ${pcWeed(14, 46, '#2fa35a')}${pcWeed(22, 30, '#45c26e')}${pcWeed(146, 44, '#2fa35a')}
      ${pcBubbles(14, 21)}
      ${pcU('schildi', 80, 56, 50)}${pcU('minzi', 128, 32, 20, true)}`,
  },
  {
    level: 30, title: 'Die leuchtende Höhle',
    text: 'Tief unten leuchtet Qualli den Weg. Okti ist ein bisschen ängstlich – aber gemeinsam trauen sie sich hinein.',
    svg: () => `
      <defs><radialGradient id="pc3" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#4a3fa8"/><stop offset=".6" stop-color="#22206a"/><stop offset="1" stop-color="#0d0b33"/></radialGradient>
      <radialGradient id="pc3g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffd0f0" stop-opacity=".7"/><stop offset="1" stop-color="#ffd0f0" stop-opacity="0"/></radialGradient></defs>
      <rect width="160" height="100" fill="url(#pc3)"/>
      <path d="M0 0 H160 V18 Q120 34 80 22 Q40 34 0 18Z M0 100 H160 V84 Q120 70 80 82 Q40 70 0 86Z" fill="#0a0826"/>
      ${[[24, 80], [40, 86], [130, 82], [142, 88]].map(([x, y]) => `<g><rect x="${x - .8}" y="${y}" width="1.6" height="6" fill="#7fe0c8"/><ellipse cx="${x}" cy="${y}" rx="4" ry="2.6" fill="#7ff0ff"/><circle cx="${x}" cy="${y}" r="7" fill="#7ff0ff" opacity=".2"/></g>`).join('')}
      <circle cx="64" cy="48" r="30" fill="url(#pc3g)"/>
      ${pcBubbles(10, 33)}
      ${pcU('qualli', 64, 46, 40)}${pcU('okti', 108, 58, 36, true)}`,
  },
  {
    level: 40, title: 'Kalles Sandburg',
    text: 'Kalle baut die größte Sandburg der Bucht. Ob sie die nächste Strömung übersteht?',
    svg: () => `
      <defs><linearGradient id="pc4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fe6ff"/><stop offset="1" stop-color="#3aa6e8"/></linearGradient></defs>
      <rect width="160" height="100" fill="url(#pc4)"/>
      <ellipse cx="80" cy="108" rx="130" ry="30" fill="#efd38f"/>
      <g fill="#e2bd6e" stroke="#b8904a" stroke-width=".8">
        <rect x="88" y="54" width="40" height="30"/><rect x="82" y="44" width="12" height="40"/><rect x="122" y="44" width="12" height="40"/><rect x="100" y="36" width="16" height="22"/>
        ${[82, 86, 90, 122, 126, 130, 100, 104, 108, 112].map((x, i) => `<rect x="${x}" y="${i < 6 ? 40 : 32}" width="3" height="4"/>`).join('')}
      </g>
      <path d="M104 72 a4 4 0 0 1 8 0 V84 h-8Z" fill="#8a6a3a"/>
      <path d="M108 36 V24 l9 4 -9 4" fill="#ff5a4e" stroke="#8a2a20" stroke-width=".6"/>
      ${pcWeed(12, 36, '#2fa35a')}
      ${pcBubbles(10, 44)}
      ${pcU('krabbe', 52, 72, 38)}${pcU('puffi', 30, 34, 22)}`,
  },
  {
    level: 50, title: 'Wal Willis Wellenritt',
    text: 'Einmal im Jahr nimmt Wal Willi alle mit an die Oberfläche. Die Aussicht ist einfach riesig!',
    svg: () => `
      <defs><linearGradient id="pc5" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd9a8"/><stop offset=".35" stop-color="#ffb3c7"/><stop offset=".36" stop-color="#3fb6f0"/><stop offset="1" stop-color="#1667c8"/></linearGradient></defs>
      <rect width="160" height="100" fill="url(#pc5)"/>
      <circle cx="128" cy="22" r="11" fill="#fff3a8" opacity=".9"/>
      <path d="M0 36 Q10 32 20 36 T40 36 T60 36 T80 36 T100 36 T120 36 T140 36 T160 36" stroke="#fff" stroke-width="1.2" fill="none" opacity=".8"/>
      ${pcBubbles(12, 55, 160, 100)}
      ${pcU('willi', 72, 50, 70)}${pcU('zitrino', 46, 22, 18)}${pcU('aqua', 98, 24, 16, true)}${pcU('tomato', 30, 74, 18)}`,
  },
  {
    level: 60, title: 'Sternennacht im Riff',
    text: 'Wenn es dunkel wird, funkelt Stella mit den Sternen um die Wette. Gute Nacht, Blubberbucht!',
    svg: () => `
      <defs><linearGradient id="pc6" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2a6b"/><stop offset="1" stop-color="#0a1440"/></linearGradient></defs>
      <rect width="160" height="100" fill="url(#pc6)"/>
      <circle cx="30" cy="20" r="9" fill="#fff6c8"/><circle cx="34" cy="18" r="8" fill="#1b2a6b"/>
      ${[[60, 12], [90, 8], [120, 18], [146, 10], [76, 26], [104, 30], [14, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="#fff"/>`).join('')}
      <ellipse cx="80" cy="106" rx="120" ry="20" fill="#3a4a7a"/>
      ${pcCoral(26, 94, '#7a5ad6')}${pcCoral(134, 95, '#d65a9a')}${pcWeed(150, 30, '#2a6a6a')}
      ${pcBubbles(8, 66)}
      ${pcU('stella', 80, 62, 44)}${pcU('luna', 122, 46, 22, true)}${pcU('zebrino', 40, 54, 20)}`,
  },
];

function postcardSVG(pc) {
  return `<svg class="pc-svg" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice">${pc.svg()}</svg>`;
}
