// Streaty Fight 2 - Audio Engine (Web Audio API + Male/Female PT-BR Voices + Meme SFX)
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicEnabled = true;
    this.voiceBuffers = {};
    this.musicTimer = null;
    this.musicMode = null;
    this.musicStep = 0;
    this.loaded = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.loaded) {
      this.loaded = true;
      this.preloadVoices();
    }
  }

  async preloadVoices() {
    const names = [
      'announcer_select', 'announcer_confirm', 'announcer_r1', 'announcer_r2', 'announcer_rf',
      'announcer_ko', 'announcer_win',
      'saulo_select', 'saulo_special', 'saulo_special2', 'saulo_win',
      'thiago_select', 'thiago_special', 'thiago_special2', 'thiago_hurt',
      'stenio_select', 'stenio_special', 'stenio_special2', 'stenio_win',
      'kamile_select', 'kamile_special', 'kamile_special2', 'kamile_win',
      'larissa_select', 'larissa_special', 'larissa_special2', 'larissa_win',
      'alexandre_select', 'alexandre_special', 'alexandre_special2', 'alexandre_swear',
      'diogo_select', 'diogo_special', 'diogo_special2', 'diogo_win'
    ];
    await Promise.all(names.map(async (key) => {
      try {
        const res = await fetch(`assets/voices/${key}.wav`);
        if (!res.ok) return;
        const arr = await res.arrayBuffer();
        const buf = await this.ctx.decodeAudioData(arr);
        this.voiceBuffers[key] = buf;
      } catch (e) {}
    }));
  }

  playVoice(key, volume = 1.0, rate = 1.0) {
    if (this.muted) return;
    this.init();
    const buf = this.voiceBuffers[key];
    if (!buf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    src.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(0);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopMusic();
    else if (this.musicMode) this.startMusic(this.musicMode);
    return this.muted;
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) this.stopMusic();
    else if (this.musicMode && !this.muted) this.startMusic(this.musicMode);
    return this.musicEnabled;
  }

  tone(freq, endFreq, dur, type = 'square', vol = 0.18, delay = 0) {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + dur);
    }
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  noise(dur, vol = 0.22, filterFreq = 900, delay = 0) {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime + delay;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.ctx.destination);
    src.start(now);
  }

  playSelectMove() {
    this.tone(520, 760, 0.06, 'square', 0.12);
  }

  playSelectConfirm() {
    this.tone(523, 523, 0.07, 'square', 0.16, 0);
    this.tone(659, 659, 0.07, 'square', 0.16, 0.06);
    this.tone(1046, 1046, 0.18, 'square', 0.18, 0.12);
  }

  playDash() {
    this.noise(0.12, 0.16, 2200);
    this.tone(280, 680, 0.1, 'triangle', 0.12);
  }

  playJump() {
    // Cartoon spring boing
    this.tone(190, 580, 0.18, 'sine', 0.2);
    this.tone(260, 740, 0.14, 'triangle', 0.12, 0.04);
  }

  playSwing() {
    this.noise(0.09, 0.14, 1500);
    this.tone(360, 140, 0.09, 'triangle', 0.08);
  }

  playWhipCrack() {
    this.noise(0.07, 0.22, 3400, 0);
    this.tone(1800, 260, 0.09, 'sawtooth', 0.22, 0.03);
    this.noise(0.11, 0.34, 4800, 0.04);
  }

  playGlassSmash() {
    for (let i = 0; i < 5; i++) {
      this.tone(1800 + i * 520, 900 + i * 310, 0.09, 'triangle', 0.14, i * 0.035);
    }
    this.noise(0.22, 0.32, 4200);
  }

  playHairStretch() {
    this.tone(160, 620, 0.16, 'sine', 0.18);
    this.tone(620, 220, 0.16, 'sine', 0.14, 0.12);
  }

  playBiscuitWhoosh() {
    this.tone(440, 920, 0.12, 'triangle', 0.16);
    this.noise(0.12, 0.14, 2400);
  }

  playClaudinho() {
    [587, 784, 987, 1318].forEach((f, i) =>
      this.tone(f, f * 1.1, 0.1, 'sine', 0.15, i * 0.05)
    );
  }

  playMotoCrash() {
    this.noise(0.42, 0.36, 520);
    this.tone(140, 42, 0.4, 'sawtooth', 0.28);
    this.tone(480, 180, 0.22, 'sine', 0.2, 0.15); // cartoon tombo boing
  }

  playHit(heavy = false) {
    const memeKind = Math.floor(Math.random() * 4);
    if (heavy) {
      this.noise(0.2, 0.36, 650);
      this.tone(185, 46, 0.24, 'sawtooth', 0.28);
      if (memeKind === 0) {
        // Cartoon BONK!
        this.tone(360, 145, 0.16, 'sine', 0.26, 0.02);
      } else if (memeKind === 1) {
        // Frying pan CLANG!
        this.tone(920, 840, 0.24, 'triangle', 0.2, 0.02);
        this.tone(1340, 1180, 0.22, 'sine', 0.14, 0.03);
      } else {
        // Soap opera SLAP!
        this.noise(0.11, 0.4, 2900, 0.01);
      }
    } else {
      this.noise(0.08, 0.24, 1500);
      this.tone(320, 110, 0.11, 'square', 0.17);
      if (memeKind === 2) {
        // Squeaky rubber duck bonk!
        this.tone(860, 1280, 0.08, 'sine', 0.16, 0.02);
      } else {
        this.tone(540, 220, 0.08, 'sine', 0.14);
      }
    }
  }

  playBlock() {
    this.tone(880, 420, 0.09, 'triangle', 0.2);
    this.tone(1240, 920, 0.07, 'square', 0.1, 0.02);
  }

  playKO() {
    this.noise(0.65, 0.42, 420);
    this.tone(180, 32, 0.65, 'sawtooth', 0.34);
    this.tone(140, 28, 0.7, 'square', 0.22, 0.1);
    for (let i = 0; i < 4; i++) {
      this.tone(1100 + (i % 2) * 350, 1500, 0.09, 'sine', 0.1, 0.55 + i * 0.11);
    }
  }

  playSpecialSfx(fighterId, slot = 1) {
    if (slot === 2) {
      switch (fighterId) {
        case 'saulo': this.playBiscuitWhoosh(); return;
        case 'thiago':
          this.tone(75, 55, 0.5, 'sawtooth', 0.24);
          [0, 0.18, 0.36].forEach(d => this.tone(1240, 1240, 0.1, 'square', 0.16, d));
          return;
        case 'stenio':
          [0, 0.1, 0.2].forEach((d, i) => this.tone(110 + i * 35, 290, 0.09, 'sawtooth', 0.22, d));
          setTimeout(() => this.playMotoCrash(), 340);
          return;
        case 'kamile': this.playHairStretch(); return;
        case 'larissa': this.playWhipCrack(); setTimeout(() => this.playWhipCrack(), 180); return;
        case 'alexandre':
          this.tone(160, 320, 0.2, 'sawtooth', 0.18);
          setTimeout(() => this.playGlassSmash(), 260);
          return;
        case 'diogo': this.playClaudinho(); return;
      }
    }
    switch (fighterId) {
      case 'saulo':
        [523, 659, 784, 1046, 1318].forEach((f, i) =>
          this.tone(f, f * 1.15, 0.11, 'triangle', 0.16, i * 0.05)
        );
        this.noise(0.28, 0.2, 2200, 0.25);
        break;
      case 'thiago':
        this.tone(82, 65, 0.55, 'sawtooth', 0.22);
        [0, 0.22, 0.44].forEach(d => this.tone(1180, 1180, 0.12, 'square', 0.16, d));
        break;
      case 'stenio':
        [0, 0.11, 0.22, 0.34, 0.46].forEach((d, i) => {
          this.tone(95 + i * 25, 230 + i * 35, 0.1, 'sawtooth', 0.24, d);
        });
        this.noise(0.35, 0.22, 700, 0.1);
        break;
      case 'kamile':
        this.tone(980, 740, 0.22, 'triangle', 0.24);
        this.tone(1480, 1120, 0.25, 'sine', 0.16, 0.03);
        this.tone(140, 320, 0.24, 'sawtooth', 0.18, 0.08);
        break;
      case 'larissa':
        this.tone(240, 95, 0.45, 'sawtooth', 0.22);
        [0.05, 0.15, 0.26, 0.38].forEach(d => {
          this.noise(0.07, 0.22, 3400, d);
          this.tone(1600, 1200, 0.05, 'square', 0.1, d);
        });
        break;
      case 'alexandre':
        this.tone(1850, 2200, 0.08, 'sine', 0.18);
        this.tone(115, 72, 0.28, 'sawtooth', 0.22, 0.08);
        this.tone(1000, 1000, 0.26, 'sine', 0.18, 0.36);
        break;
      case 'diogo':
        for (let i = 0; i < 6; i++) {
          this.tone(400 + (i * 237) % 1400, 900, 0.05, 'square', 0.14, i * 0.045);
        }
        this.tone(330, 180, 0.3, 'sawtooth', 0.18, 0.3);
        break;
    }
  }

  playSwearBeep() {
    this.tone(1000, 1000, 0.22, 'sine', 0.17);
  }

  startMusic(mode) {
    this.musicMode = mode;
    if (this.muted || !this.musicEnabled) return;
    this.stopMusic(false);
    this.musicStep = 0;

    const tempoMs = mode === 'battle' ? 132 : mode === 'select' ? 160 : 175;
    const battleLead = [330, 330, 392, 440, 392, 330, 294, 330, 440, 494, 523, 494, 440, 392, 330, 294];
    const battleBass = [110, 110, 110, 130, 146, 146, 130, 110, 98, 98, 110, 130, 146, 130, 110, 98];
    const selectLead = [262, 330, 392, 523, 494, 392, 330, 294, 262, 330, 392, 440, 392, 330, 294, 262];
    const winLead = [523, 659, 784, 1046, 784, 1046, 0, 0];

    this.musicTimer = setInterval(() => {
      if (this.muted || !this.musicEnabled || !this.ctx) return;
      if (this.ctx.state === 'suspended') return;
      const step = this.musicStep++;
      if (mode === 'battle') {
        const l = battleLead[step % battleLead.length];
        const b = battleBass[step % battleBass.length];
        this.tone(l, l, 0.1, 'square', 0.04);
        this.tone(b, b, 0.11, 'sawtooth', 0.045);
        if (step % 4 === 0) this.noise(0.04, 0.038, 500);
        if (step % 4 === 2) this.noise(0.05, 0.042, 2800);
      } else if (mode === 'select') {
        const l = selectLead[step % selectLead.length];
        this.tone(l, l, 0.12, 'triangle', 0.048);
        this.tone(l / 2, l / 2, 0.12, 'square', 0.028);
      } else if (mode === 'win') {
        const idx = step % winLead.length;
        if (winLead[idx] > 0) this.tone(winLead[idx], winLead[idx], 0.14, 'square', 0.052);
        if (step >= 12) this.stopMusic(false);
      }
    }, tempoMs);
  }

  stopMusic(clearMode = true) {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (clearMode) this.musicMode = null;
  }
}

window.SFX = new SoundEngine();
