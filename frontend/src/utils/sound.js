/* ==========================================================================
   FindBack Web Audio Sound Engine
   Low-latency, zero-asset Foley & UI sound effects
   ========================================================================== */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        this.ctx = new AC();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  toggle(enabled) {
    this.enabled = typeof enabled === "boolean" ? enabled : !this.enabled;
    return this.enabled;
  }

  // Key pickup chime (delicate metallic lift)
  playKeyPickup() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [2400, 3600, 4800].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.9, t + 0.15);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.035 / (i + 1), t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  }

  // Proximity magnetic tone
  playKeyProximity() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(660, t + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.035, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  // Key slide into keyhole (smooth brass friction)
  playKeySlide() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * 0.45);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / len) * Math.PI);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(3000, t);
    filter.frequency.exponentialRampToValueAtTime(1300, t + 0.42);
    filter.Q.setValueAtTime(5.5, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.44);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(t);
  }

  // Key seating clink
  playKeySeat() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [1760, 2640].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, t + 0.08);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.12 / (idx + 1), t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.1);
    });

    const oscThud = this.ctx.createOscillator();
    oscThud.type = "sine";
    oscThud.frequency.setValueAtTime(220, t);
    oscThud.frequency.exponentialRampToValueAtTime(70, t + 0.07);

    const gainThud = this.ctx.createGain();
    gainThud.gain.setValueAtTime(0.14, t);
    gainThud.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    oscThud.connect(gainThud);
    gainThud.connect(this.masterGain);
    oscThud.start(t);
    oscThud.stop(t + 0.09);
  }

  // Tension click during anticipation (-5deg)
  playKeyAnticipate() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(980, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.05);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.055);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  // Mechanical Lock Click: multi-layered heavy bolt release
  playLockClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Tumbler drop
    const osc1 = this.ctx.createOscillator();
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(840, t);
    osc1.frequency.exponentialRampToValueAtTime(160, t + 0.06);

    const flt1 = this.ctx.createBiquadFilter();
    flt1.type = "bandpass";
    flt1.frequency.value = 1400;
    flt1.Q.value = 5;

    const gain1 = this.ctx.createGain();
    gain1.gain.setValueAtTime(0.22, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc1.connect(flt1);
    flt1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(t);
    osc1.stop(t + 0.08);

    // Bolt snap
    const t2 = t + 0.022;
    const osc2 = this.ctx.createOscillator();
    osc2.type = "square";
    osc2.frequency.setValueAtTime(1450, t2);
    osc2.frequency.exponentialRampToValueAtTime(220, t2 + 0.08);

    const flt2 = this.ctx.createBiquadFilter();
    flt2.type = "bandpass";
    flt2.frequency.value = 2400;
    flt2.Q.value = 7;

    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0.24, t2);
    gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.09);

    osc2.connect(flt2);
    flt2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(t2);
    osc2.stop(t2 + 0.1);

    // Body thud
    const osc3 = this.ctx.createOscillator();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(140, t2);
    osc3.frequency.exponentialRampToValueAtTime(45, t2 + 0.14);

    const gain3 = this.ctx.createGain();
    gain3.gain.setValueAtTime(0.28, t2);
    gain3.gain.exponentialRampToValueAtTime(0.001, t2 + 0.15);

    osc3.connect(gain3);
    gain3.connect(this.masterGain);
    osc3.start(t2);
    osc3.stop(t2 + 0.16);
  }

  // Door Creak: authentic wood & iron hinge resonance
  playDoorCreak() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(105, t);
    osc.frequency.linearRampToValueAtTime(80, t + 0.25);
    osc.frequency.linearRampToValueAtTime(95, t + 0.55);
    osc.frequency.linearRampToValueAtTime(60, t + 0.95);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(360, t);
    filter.frequency.linearRampToValueAtTime(220, t + 0.95);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.12);
    gain.gain.linearRampToValueAtTime(0.07, t + 0.55);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.95);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 1.0);
  }

  // Warm Celestial Light Swell
  playLightSwell() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [130.81, 196.0, 329.63, 392.0].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.045 / (idx + 1), t + 1.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 3.4);
    });
  }

  // Wrong Key recoil rattle
  playWrongKeyReject() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [0, 0.08, 0.16].forEach((offset) => {
      const osc = this.ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(420, t + offset);
      osc.frequency.exponentialRampToValueAtTime(140, t + offset + 0.05);

      const flt = this.ctx.createBiquadFilter();
      flt.type = "bandpass";
      flt.frequency.value = 650;
      flt.Q.value = 4;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.09, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.05);

      osc.connect(flt);
      flt.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + offset);
      osc.stop(t + offset + 0.06);
    });
  }

  // Subtle clean UI click for landing page buttons
  playUiClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(820, t);
    osc.frequency.exponentialRampToValueAtTime(340, t + 0.04);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  // Subtle soft tab/toggle sound
  playUiToggle() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(560, t);
    osc.frequency.exponentialRampToValueAtTime(920, t + 0.06);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.07);
  }
}

export const sound = new SoundEngine();

// Auto-unlock Web Audio on first user interaction anywhere on the page
if (typeof window !== "undefined") {
  const unlockAudio = () => {
    try {
      sound.init();
    } catch {}
    window.removeEventListener("pointerdown", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
  };
  window.addEventListener("pointerdown", unlockAudio, { passive: true });
  window.addEventListener("keydown", unlockAudio, { passive: true });
}
