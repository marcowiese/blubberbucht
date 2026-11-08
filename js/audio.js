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
  const TRACKS = ['music/track1.mp3', 'music/track2.mp3', 'music/track3.mp3', 'music/track4.mp3'];
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

  return {
    set enabled(v) { enabled = v; }, get enabled() { return enabled; },
    set music(v) { musicOn = v; v ? (ctx && startMusic()) : stopMusic(); },
    get music() { return musicOn; },
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
