/* Small homestead sounds from WebAudio. No audio files, no network. */
(function (root) {
  'use strict';
  let AC = null;
  let master = null;
  let muted = false;
  let timer = null;
  let step = 0;
  const NOTES = [392, 440, 494, 440, 392, 349, 392, 494];

  function ensure() {
    if (muted) return null;
    try {
      if (!AC) {
        const Ctx = root.AudioContext || root.webkitAudioContext;
        if (!Ctx) return null;
        AC = new Ctx();
        master = AC.createGain();
        master.gain.value = 0.7;
        master.connect(AC.destination);
      }
      if (AC.state === 'suspended') AC.resume();
      return AC;
    } catch (e) {
      return null;
    }
  }

  function tone(freq, dur, type, vol, slide) {
    const ctx = ensure();
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'triangle';
    o.frequency.setValueAtTime(Math.max(48, freq), t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(48, slide), t + dur);
    g.gain.setValueAtTime(vol || 0.04, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.04, dur));
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function noise(dur, freq, vol) {
    const ctx = ensure();
    if (!ctx || muted) return;
    const n = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();
    src.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.value = freq || 1200;
    g.gain.value = vol || 0.04;
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start();
  }

  const api = {
    unlock: function () { if (!muted) ensure(); },
    setMuted: function (m) {
      muted = !!m;
      if (master) master.gain.value = muted ? 0 : 0.7;
      if (muted) api.stopMusic();
    },
    startMusic: function () {
      if (muted || timer) return;
      if (!ensure()) return;
      timer = setInterval(function () {
        if (muted) return;
        const f = NOTES[step % NOTES.length];
        tone(f, 0.15, 'triangle', 0.028);
        if (step % 4 === 0) tone(f / 2, 0.16, 'triangle', 0.016);
        step++;
      }, 320);
    },
    stopMusic: function () {
      if (timer) clearInterval(timer);
      timer = null;
    },
    move: function () { tone(520, 0.03, 'triangle', 0.025); },
    rotate: function () { tone(660, 0.04, 'triangle', 0.03, 820); },
    lock: function () { tone(170, 0.07, 'triangle', 0.045, 80); },
    drop: function () { tone(130, 0.08, 'triangle', 0.04, 70); },
    clear: function (n) {
      const chord = [523, 659, 784, 1046];
      const count = Math.max(1, Math.min(4, n || 1));
      for (let i = 0; i < count; i++) {
        (function (f, delay) {
          setTimeout(function () { tone(f, 0.12, 'triangle', 0.04); }, delay);
        })(chord[i], i * 45);
      }
    },
    cluck: function () {
      noise(0.07, 1700, 0.04);
      tone(490, 0.06, 'sine', 0.035, 260);
    },
    crow: function () {
      noise(0.06, 2400, 0.035);
      tone(494, 0.09, 'square', 0.028, 760);
      setTimeout(function () { tone(784, 0.08, 'square', 0.026, 1040); }, 130);
      setTimeout(function () { tone(880, 0.16, 'triangle', 0.04, 520); }, 250);
      setTimeout(function () { tone(392, 0.22, 'triangle', 0.034, 247); }, 440);
    },
    win: function () {
      api.crow();
      [523, 659, 784].forEach(function (f, i) {
        setTimeout(function () { tone(f, 0.14, 'triangle', 0.03); }, 180 + i * 90);
      });
    },
    lose: function () {
      [392, 330, 247].forEach(function (f, i) {
        setTimeout(function () { tone(f, 0.2, 'triangle', 0.04); }, i * 130);
      });
    },
    deny: function () { tone(120, 0.12, 'triangle', 0.04); },
    tap: function () { tone(700, 0.03, 'triangle', 0.02); }
  };

  root.HoedownAudio = api;
})(typeof window !== 'undefined' ? window : globalThis);
