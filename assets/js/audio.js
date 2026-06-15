// ============================================
// عادل - Audio System
// assets/js/audio.js
// ============================================

const AudioSystem = (() => {
  let ctx = null;
  let masterGain = null;
  let musicGain = null;
  let sfxGain = null;
  let bgmInterval = null;

  function init() {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      musicGain = ctx.createGain();
      sfxGain = ctx.createGain();

      musicGain.connect(masterGain);
      sfxGain.connect(masterGain);
      masterGain.connect(ctx.destination);

      masterGain.gain.value = 1;
      musicGain.gain.value = 0.3;
      sfxGain.gain.value = 0.7;
    } catch (e) {
      console.warn('Audio not available');
    }
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  // ── Tone-based SFX ──
  function playTone(frequency, duration, type = 'sine', volume = 0.3) {
    if (!ctx || !GameState.get('soundEnabled')) return;
    try {
      resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(sfxGain);
      osc.type = type;
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch(e) {}
  }

  function playChord(freqs, duration = 0.3, type = 'sine') {
    freqs.forEach(f => playTone(f, duration, type, 0.15));
  }

  // ── Collect item ──
  function playCollect() {
    if (!ctx || !GameState.get('soundEnabled')) return;
    resume();
    [523, 659, 784].forEach((f, i) => {
      setTimeout(() => playTone(f, 0.15, 'sine', 0.4), i * 80);
    });
  }

  // ── Jump ──
  function playJump() {
    if (!ctx || !GameState.get('soundEnabled')) return;
    resume();
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(sfxGain);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch(e) {}
  }

  // ── Level complete ──
  function playLevelComplete() {
    if (!ctx || !GameState.get('soundEnabled')) return;
    resume();
    const melody = [523, 587, 659, 698, 784, 880, 988, 1047];
    melody.forEach((f, i) => {
      setTimeout(() => playTone(f, 0.2, 'sine', 0.5), i * 120);
    });
  }

  // ── Achievement ──
  function playAchievement() {
    if (!ctx || !GameState.get('soundEnabled')) return;
    resume();
    const notes = [784, 988, 1175, 1568];
    notes.forEach((f, i) => {
      setTimeout(() => playTone(f, 0.3, 'sine', 0.4), i * 100);
    });
  }

  // ── Error / hit ──
  function playError() {
    if (!ctx || !GameState.get('soundEnabled')) return;
    resume();
    playTone(200, 0.2, 'sawtooth', 0.3);
    setTimeout(() => playTone(150, 0.3, 'sawtooth', 0.2), 150);
  }

  // ── Splash ──
  function playSplash() {
    if (!ctx || !GameState.get('soundEnabled')) return;
    resume();
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        playTone(200 + Math.random() * 400, 0.15, 'sine', 0.2);
      }, i * 60);
    }
  }

  // ── Button click ──
  function playClick() {
    if (!ctx || !GameState.get('soundEnabled')) return;
    resume();
    playTone(440, 0.08, 'sine', 0.2);
  }

  // ── Background music (simple procedural) ──
  function startBGM() {
    if (!ctx || !GameState.get('musicEnabled')) return;
    stopBGM();
    
    const notes = [261, 293, 329, 349, 392, 440, 494, 523];
    const pattern = [0, 2, 4, 2, 0, 4, 5, 4];
    let step = 0;

    bgmInterval = setInterval(() => {
      if (!GameState.get('musicEnabled')) return;
      resume();
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(musicGain);
        osc.type = 'triangle';
        osc.frequency.value = notes[pattern[step % pattern.length]];
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
        step++;
      } catch(e) {}
    }, 500);
  }

  function stopBGM() {
    if (bgmInterval) {
      clearInterval(bgmInterval);
      bgmInterval = null;
    }
  }

  function setMusicEnabled(val) {
    if (musicGain) musicGain.gain.value = val ? 0.3 : 0;
    if (val) startBGM(); else stopBGM();
  }

  function setSoundEnabled(val) {
    if (sfxGain) sfxGain.gain.value = val ? 0.7 : 0;
  }

  return {
    init, resume, startBGM, stopBGM,
    playCollect, playJump, playLevelComplete,
    playAchievement, playError, playSplash, playClick,
    setMusicEnabled, setSoundEnabled,
  };
})();
