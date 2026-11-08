// Eigene, synthetisch erzeugte Sounds & Musik (Web Audio, keine Audiodateien)
'use strict';

const Sfx = (() => {
  let ctx = null, enabled = true, sfxBus = null, musicBus = null, reverb = null, noiseBuf = null;

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
      musicBus = ctx.createGain(); musicBus.gain.value = 0;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
      musicBus.connect(lp); lp.connect(ctx.destination); lp.connect(reverb);
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

  // ---------- Musik: langsame, gehaltene Flächen + vereinzelte Glockentöne ----------
  let musicOn = false, musicTimer = null, nextBar = 0, bar = 0;
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  // Akkorde (MIDI), je 8 Sekunden: Fmaj9 – Cmaj7/E – Dm9 – Bbmaj7
  const CHORDS = [[53, 60, 64, 67, 69], [52, 59, 64, 67, 71], [50, 57, 60, 64, 65], [46, 57, 62, 65, 69]];
  const BELLS = [[72, 76, 79, 81, 84], [71, 74, 76, 79, 83], [72, 74, 77, 81, 84], [70, 74, 77, 81, 82]];
  const BAR = 8;
  function pad(m, t, dur, vol) {
    for (const det of [-4, 4]) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = det < 0 ? 'sine' : 'triangle';
      o.frequency.value = hz(m); o.detune.value = det;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 2.5);
      g.gain.setValueAtTime(vol, t + dur - 2);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 1.5);
      o.connect(g).connect(musicBus);
      o.start(t); o.stop(t + dur + 1.6);
    }
  }
  function bell(m, t, vol) {
    for (const [mul, v, d] of [[1, 1, 2.6], [2, .25, 1.2], [3.01, .08, .6]]) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = hz(m) * mul;
      env(g, t, .01, vol * v, d);
      o.connect(g).connect(musicBus);
      o.start(t); o.stop(t + d + .05);
    }
  }
  let lastBell = 2;
  function scheduleBar(t) {
    const c = CHORDS[bar % 4], b = BELLS[bar % 4];
    c.forEach((m, i) => pad(m, t, BAR + .5, i === 0 ? .05 : .028));
    // 3–4 ruhige Glockentöne pro Takt, schrittweise Melodie
    const times = [0.4, 2.4, 4.6, 6.2].filter(() => Math.random() < .8);
    for (const dt of times) {
      lastBell = Math.max(0, Math.min(b.length - 1, lastBell + [-1, 0, 1, 1, -1, 2, -2][Math.floor(Math.random() * 7)]));
      bell(b[lastBell], t + dt + Math.random() * .15, .05);
    }
    bar++;
  }
  function musicLoop() {
    if (!musicOn || !ctx) return;
    while (nextBar < ctx.currentTime + 1.5) { scheduleBar(nextBar); nextBar += BAR; }
  }
  function startMusic() {
    if (!musicOn || musicTimer) return;
    const a = ac(); if (!a) return;
    nextBar = Math.max(nextBar, a.currentTime + .1);
    musicBus.gain.cancelScheduledValues(a.currentTime);
    musicBus.gain.setTargetAtTime(.9, a.currentTime, 1.5);
    musicLoop();
    musicTimer = setInterval(musicLoop, 500);
  }
  function stopMusic() {
    clearInterval(musicTimer); musicTimer = null;
    if (ctx && musicBus) { musicBus.gain.cancelScheduledValues(ctx.currentTime); musicBus.gain.setTargetAtTime(0, ctx.currentTime, .3); }
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopMusic(); else startMusic(); });

  return {
    set enabled(v) { enabled = v; }, get enabled() { return enabled; },
    set music(v) { musicOn = v; v ? (ctx && startMusic()) : stopMusic(); },
    unlock() { ac(); startMusic(); },
    // Antippen: kurzes Klicken + schnell steigender Blubb
    pop() { noise(.012, { f1: 5000, f2: 5000, q: .7, vol: .12 }); sweep(560, 1650, .075, { vol: .24, delay: .008 }); },
    // Landung in der Ablage: weicher, tieferer Plopp
    plop() { sweep(260, 620, .07, { vol: .22 }); sweep(520, 900, .05, { vol: .05, delay: .01 }); },
    // Sprung ins Aquarium: Platsch (Wasserrauschen) + kleine Blasen
    splash() {
      noise(.28, { f1: 2600, f2: 500, q: 1.2, vol: .22 });
      noise(.12, { f1: 6000, f2: 3000, q: .8, vol: .07, type: 'highpass' });
      sweep(180, 90, .12, { vol: .12 });
      [.05, .1, .16, .22].forEach((d, i) => blub(700 + Math.random() * 700, d, .07 - i * .012));
    },
    burst() { noise(.06, { f1: 4000, f2: 1500, q: .8, vol: .08 }); blub(900, .01, .08); },
    match() { [72, 76, 79, 84].forEach((m, i) => sweep(hz(m), hz(m) * 1.002, .5, { type: 'sine', vol: .1, delay: i * .08, attack: .01 })); [.0, .08].forEach(d => blub(1000 + Math.random() * 500, d + .3, .05)); },
    win() { [72, 76, 79, 84, 79, 84, 88].forEach((m, i) => sweep(hz(m), hz(m), .45, { type: 'triangle', vol: .11, delay: i * .13, attack: .01 })); },
    lose() { [67, 64, 60, 55].forEach((m, i) => sweep(hz(m), hz(m) * .985, .5, { type: 'triangle', vol: .1, delay: i * .2, attack: .02 })); },
    booster() { noise(.4, { f1: 400, f2: 4000, q: 2, vol: .12 }); sweep(400, 1600, .35, { vol: .08, delay: .05 }); },
    error() { sweep(220, 160, .14, { type: 'triangle', vol: .12 }); },
    click() { sweep(900, 1300, .04, { vol: .1 }); },
    tray() { this.plop(); }, bowl() { this.splash(); },
  };
})();
