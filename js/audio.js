// Kleine synthetische Soundeffekte (Web Audio, keine Dateien nötig)
'use strict';

const Sfx = (() => {
  let ctx = null, enabled = true;
  function ac() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(f1, f2, dur, type = 'sine', vol = .18, delay = 0) {
    if (!enabled) return;
    const a = ac(); if (!a) return;
    const t = a.currentTime + delay;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f1, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t); o.stop(t + dur + .02);
  }
  // Eigene, ruhige Hintergrundmusik: weiche Marimba-Töne in Dur-Pentatonik über einem sanften Akkordteppich
  let musicOn = false, musicTimer = null, step = 0, musicGain = null;
  const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
  const CHORDS = [[0, 4, 7], [-3, 0, 4], [5, 9, 12], [7, 11, 14]]; // I – vi – IV – V
  const hz = semi => 261.63 * Math.pow(2, semi / 12);
  function note(f, t, dur, vol, type = 'sine') {
    const a = ctx, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(musicGain);
    o.start(t); o.stop(t + dur + .05);
  }
  let melo = 5;
  function tick() {
    if (!musicOn || !ctx) return;
    const beat = .42, t = ctx.currentTime + .05;
    const bar = Math.floor(step / 8) % 4, chord = CHORDS[bar];
    if (step % 8 === 0) chord.forEach(s => note(hz(s - 12), t, beat * 8, .035, 'triangle'));
    if (step % 4 === 0) note(hz(chord[0] - 24), t, beat * 3, .06, 'sine');
    if (Math.random() < (step % 2 ? .45 : .8)) {
      melo = Math.max(0, Math.min(SCALE.length - 1, melo + [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)]));
      const f = hz(SCALE[melo]);
      note(f, t, .55, .07); note(f * 2, t, .25, .018); // Marimba-artiger Anschlag
    }
    step++;
  }
  function startMusic() {
    if (!musicOn || musicTimer) return;
    const a = ac(); if (!a) return;
    if (!musicGain) { musicGain = a.createGain(); musicGain.gain.value = .8; musicGain.connect(a.destination); }
    musicTimer = setInterval(tick, 420);
  }
  function stopMusic() { clearInterval(musicTimer); musicTimer = null; }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopMusic(); else startMusic(); });

  return {
    set enabled(v) { enabled = v; }, get enabled() { return enabled; },
    set music(v) { musicOn = v; v ? (ctx && startMusic()) : stopMusic(); },
    unlock() { ac(); startMusic(); },
    pop()    { tone(520, 1100, .09, 'sine', .2); },
    tray()   { tone(340, 200, .12, 'triangle', .16); },
    bowl()   { tone(700, 1300, .1, 'sine', .18); tone(1200, 1500, .08, 'sine', .08, .05); },
    burst()  { tone(900, 300, .14, 'sine', .12); },
    match()  { [660, 880, 1175, 1568].forEach((f, i) => tone(f, f * 1.01, .18, 'triangle', .14, i * .07)); },
    win()    { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, f, .22, 'triangle', .16, i * .12)); },
    lose()   { [440, 370, 311, 220].forEach((f, i) => tone(f, f * .97, .25, 'sawtooth', .06, i * .16)); },
    booster(){ tone(300, 1400, .35, 'sine', .14); tone(500, 2000, .3, 'triangle', .06, .08); },
    error()  { tone(180, 140, .15, 'square', .06); },
    click()  { tone(800, 600, .05, 'sine', .1); },
  };
})();
