// Eigene, synthetisch erzeugte Sounds & Musik (Web Audio, keine Audiodateien)
'use strict';

const Sfx = (() => {
  let ctx = null, enabled = true, sfxBus = null, musicBus = null, reverb = null, noiseBuf = null;
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);

  function ac() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
      sfxBus = ctx.createGain(); sfxBus.gain.value = .9; sfxBus.connect(ctx.destination);
      // Hall: selbst erzeugte Impulsantwort (abklingendes Rauschen)
      reverb = ctx.createConvolver();
      const len = ctx.sampleRate * 3.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
      }
      reverb.buffer = ir;
      const wet = ctx.createGain(); wet.gain.value = .55;
      reverb.connect(wet).connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * .5, ctx.sampleRate);
      const nd = noiseBuf.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function env(g, t, a, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  // Ton mit Tonhöhenverlauf
  function sweep(f1, f2, dur, { type = 'sine', vol = .2, delay = 0, curve = 'exp', attack = .004, out } = {}) {
    if (!enabled) return;
    const a = ac(); if (!a) return;
    const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f1, t);
    if (curve === 'exp') o.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + dur * .7);
    else o.frequency.linearRampToValueAtTime(f2, t + dur * .7);
    env(g, t, attack, vol, dur);
    o.connect(g).connect(out || sfxBus);
    o.start(t); o.stop(t + dur + .03);
  }
  // gefiltertes Rauschen
  function noise(dur, { f1 = 3000, f2 = 3000, q = 1, type = 'bandpass', vol = .2, delay = 0, attack = .002 } = {}) {
    if (!enabled) return;
    const a = ac(); if (!a) return;
    const t = a.currentTime + delay, s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    s.buffer = noiseBuf;
    f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f1, t);
    f.frequency.exponentialRampToValueAtTime(f2, t + dur);
    env(g, t, attack, vol, dur);
    s.connect(f).connect(g).connect(sfxBus);
    s.start(t, Math.random() * .3); s.stop(t + dur + .02);
  }
  const blub = (f, delay, vol = .12, dur = .06) => sweep(f, f * 2.6, dur, { vol, delay });

  // ---------- Musik: die 4 Tracks nacheinander, danach wieder von vorne ----------
  // Reihenfolge der Playlist – nach dem letzten Titel geht es wieder von vorne los
  const TRACKS = ['music/01-bubble-fish.mp3', 'music/02-crystal-bubbles.mp3', 'music/03-coral-garden.mp3', 'music/04-moonlit-aquarium.mp3'];
  let musicOn = false, track = 0, player = null;
  function getPlayer() {
    if (!player) {
      player = new Audio();
      player.preload = 'auto';
      player.volume = .6;
      player.addEventListener('ended', () => { track = (track + 1) % TRACKS.length; player.src = TRACKS[track]; if (musicOn) player.play().catch(() => {}); });
      player.src = TRACKS[track];
    }
    return player;
  }
  function startMusic() {
    if (!musicOn || document.hidden) return;
    getPlayer().play().catch(() => {});
  }
  function stopMusic() { if (player) player.pause(); }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopMusic(); else startMusic(); });

  // Warmer Glockenton (Grundton + leise Obertöne), teils in den Hall geschickt
  function chime(m, delay, vol = .1, dur = 1.6, rev = .35) {
    if (!enabled) return;
    const a = ac(); if (!a) return;
    const t = a.currentTime + delay, f = hz(m);
    const out = a.createGain(); out.gain.value = 1;
    const send = a.createGain(); send.gain.value = rev;
    out.connect(sfxBus); out.connect(send); send.connect(reverb);
    for (const [mul, v, d, det] of [[1, 1, dur, 0], [1, .5, dur * .9, 6], [2, .22, dur * .5, 0], [3.01, .07, dur * .25, 0]]) {
      const o = a.createOscillator(), g = a.createGain();
      o.type = 'sine'; o.frequency.value = f * mul; o.detune.value = det;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol * v, t + .012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(out); o.start(t); o.stop(t + d + .05);
    }
  }
  // weiche Fläche, die langsam an- und abschwillt
  function swell(ms, delay, vol = .03, dur = 2.2) {
    if (!enabled) return;
    const a = ac(); if (!a) return;
    const t = a.currentTime + delay, lp = a.createBiquadFilter(), g = a.createGain(), send = a.createGain();
    lp.type = 'lowpass'; lp.frequency.value = 1400;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .35); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    send.gain.value = .5;
    g.connect(lp); lp.connect(sfxBus); lp.connect(send); send.connect(reverb);
    for (const m of ms) for (const det of [-7, 7]) {
      const o = a.createOscillator(); o.type = 'triangle'; o.frequency.value = hz(m); o.detune.value = det;
      o.connect(g); o.start(t); o.stop(t + dur + .05);
    }
  }

  // Gezupfter Mallet-/Kalimba-Ton: heller Anschlag, kurzer Ausklang, etwas Hall
  function mallet(m, delay, vol = .12, dur = .55, rev = .3) {
    if (!enabled) return;
    const a = ac(); if (!a) return;
    const t = a.currentTime + delay, f = hz(m);
    const out = a.createGain(), send = a.createGain(); send.gain.value = rev;
    out.connect(sfxBus); out.connect(send); send.connect(reverb);
    for (const [mul, v, d, type] of [[1, 1, dur, 'sine'], [1, .35, dur * .7, 'triangle'], [2, .25, dur * .35, 'sine'], [4.02, .18, .07, 'sine']]) {
      const o = a.createOscillator(), g = a.createGain();
      o.type = type; o.frequency.value = f * mul;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol * v, t + .005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(out); o.start(t); o.stop(t + d + .05);
    }
  }
  // weicher Bass darunter
  function bass(m, delay, vol = .09, dur = .5) {
    if (!enabled) return;
    const a = ac(); if (!a) return;
    const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
    o.type = 'sine'; o.frequency.value = hz(m);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(sfxBus); o.start(t); o.stop(t + dur + .05);
  }

  return {
    set enabled(v) { enabled = v; }, get enabled() { return enabled; },
    set music(v) { musicOn = v; v ? (ctx && startMusic()) : stopMusic(); },
    get music() { return musicOn; },
    unlock() { ac(); startMusic(); },
    // Antippen: kurzes Klicken + schnell steigender Blubb
    // Antippen: sehr helles, kurzes Klicken + schnell steigender Blubb (ca. 560 → 1600 Hz)
    pop() { noise(.014, { f1: 9000, f2: 8000, q: .7, type: 'highpass', vol: .1 }); sweep(560, 1600, .07, { vol: .24, delay: .01 }); },
    // Landung in der Ablage: weicher, tieferer Plopp
    plop() { sweep(260, 620, .07, { vol: .22 }); sweep(520, 900, .05, { vol: .05, delay: .01 }); },
    // Landung im Aquarium: blubbernder Platsch – tiefer Blubb, der nach oben gleitet, helle Bläschen und kurzes Wasserzischen
    splash() {
      const a = ac(); if (!a || !enabled) return;
      const t = a.currentTime, o = a.createOscillator(), g = a.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(420, t);
      o.frequency.setValueAtTime(430, t + .045);
      o.frequency.exponentialRampToValueAtTime(700, t + .11);
      env(g, t, .006, .26, .16);
      o.connect(g).connect(sfxBus); o.start(t); o.stop(t + .2);
      sweep(1450, 1650, .05, { vol: .09, delay: .08 });
      noise(.11, { f1: 3400, f2: 2800, q: 1.4, vol: .14, delay: .1, attack: .01 });
      sweep(700, 760, .05, { vol: .1, delay: .12 });
      sweep(1600, 1750, .04, { vol: .07, delay: .165 });
      sweep(2650, 2800, .035, { vol: .045, delay: .19 });
      sweep(600, 700, .05, { vol: .08, delay: .225 });
      sweep(390, 820, .07, { vol: .06, delay: .26 });
    },
    burst() { noise(.06, { f1: 4000, f2: 1500, q: .8, vol: .08 }); blub(900, .01, .08); },
    match() { [72, 76, 79, 84].forEach((m, i) => sweep(hz(m), hz(m) * 1.002, .5, { type: 'sine', vol: .1, delay: i * .08, attack: .01 })); [.0, .08].forEach(d => blub(1000 + Math.random() * 500, d + .3, .05)); },
    // Gewinn: aufsteigende, glockige Dur-Septnonen-Figur mit Hall, warme Fläche und ein paar Bläschen
    // Gewinn: kurzer, freundlicher Jingle – hüpfende Mallet-Melodie mit Bass, Glitzer-Abschluss und Hall
    win() {
      const b = .13;                                  // Grundschlag (ca. 115 BPM in Achteln)
      [[67, 0], [71, 1], [74, 2], [72, 4], [76, 5], [79, 6]].forEach(([m, k]) => mallet(m, k * b, .11));
      bass(48, 0, .08, .45); bass(55, 4 * b, .07, .4); bass(48, 8 * b, .09, 1.1);
      // Schlussakkord mit Glitzer
      [[84, 0], [88, .03], [91, .06]].forEach(([m, d]) => mallet(m, 8 * b + d, .08, 1.3, .55));
      [96, 100, 103].forEach((m, i) => mallet(m, 8 * b + .12 + i * .06, .025, .5, .7));
      [.1, .45, 1.1].forEach(d => blub(1100 + Math.random() * 700, d, .03, .06));
    },
    // Verloren: sanft absteigend statt „Fehler-Tröte“
    lose() { [71, 67, 64, 62].forEach((m, i) => chime(m, i * .16, .07, 1.3, .3)); swell([50, 57, 62], .3, .02, 1.8); },
    booster() { noise(.4, { f1: 400, f2: 4000, q: 2, vol: .12 }); sweep(400, 1600, .35, { vol: .08, delay: .05 }); },
    error() { sweep(220, 160, .14, { type: 'triangle', vol: .12 }); },
    click() { sweep(900, 1300, .04, { vol: .1 }); },
    tray() { this.plop(); }, bowl() { this.splash(); },
  };
})();
