/* ==========================================================================
   FindBack Web Audio Sound Engine
   Ultra-realistic acoustic Foley for physical lock, brass key, and heavy door
   ========================================================================== */

const SFX_FILES = {
  keyPickup: "/audio/key_pickup.wav",
  keySlide: "/audio/key_slide.wav",
  keySeat: "/audio/key_seat.wav",
  keyAnticipate: "/audio/key_anticipate.wav",
  lockClick: "/audio/lock_click.wav",
  doorCreak: "/audio/door_creak.wav",
  keyReject: "/audio/key_reject.wav",
  uiClick: "/audio/ui_click.wav",
};

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.enabled = true;
    this.buffers = {};
    this.loading = false;
  }

  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        this.ctx = new AC();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    this.preloadAll();
  }

  async preloadAll() {
    if (!this.ctx || this.loading) return;
    this.loading = true;

    for (const [key, url] of Object.entries(SFX_FILES)) {
      if (!this.buffers[key]) {
        try {
          const resp = await fetch(url);
          if (resp.ok) {
            const arr = await resp.arrayBuffer();
            const decoded = await this.ctx.decodeAudioData(arr);
            this.buffers[key] = decoded;
          }
        } catch {
          // Fallback or ignore
        }
      }
    }
  }

  toggle(enabled) {
    this.enabled = typeof enabled === "boolean" ? enabled : !this.enabled;
    return this.enabled;
  }

  playBuffer(key, { volume = 1.0, rate = 1.0, delay = 0 } = {}) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const buffer = this.buffers[key];
    if (buffer) {
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      src.playbackRate.value = rate;

      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(volume, this.ctx.currentTime + delay);

      src.connect(gainNode);
      gainNode.connect(this.masterGain);

      src.start(this.ctx.currentTime + delay);
      return;
    }

    // If buffer is still loading asynchronously, fetch and play immediately
    const url = SFX_FILES[key];
    if (url) {
      fetch(url)
        .then((r) => r.arrayBuffer())
        .then((ab) => this.ctx.decodeAudioData(ab))
        .then((dec) => {
          this.buffers[key] = dec;
          if (this.enabled) {
            const src = this.ctx.createBufferSource();
            src.buffer = dec;
            src.playbackRate.value = rate;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(volume, this.ctx.currentTime);
            src.connect(g);
            g.connect(this.masterGain);
            src.start();
          }
        })
        .catch(() => {});
    }
  }

  // 1. Key pickup: authentic metal keys clattering together on a ring
  playKeyPickup() {
    // Slight random pitch variation (0.96 - 1.04) for realistic tactile handling
    const rate = 0.96 + Math.random() * 0.08;
    this.playBuffer("keyPickup", { volume: 0.88, rate });
  }

  // 2. Proximity: completely silent (real keys make no electronic noise in the air)
  playKeyProximity() {
    // Real keys do not beep; kept silent to maintain physical realism
  }

  // 3. Key slide: brass blade entering cylinder with tumbler pins clicking
  playKeySlide() {
    this.playBuffer("keySlide", { volume: 0.95, rate: 1.0 });
  }

  // 4. Key seat: solid brass shoulder clacking against the cylinder face
  playKeySeat() {
    this.playBuffer("keySeat", { volume: 1.0, rate: 1.0 });
  }

  // 5. Key anticipation / turn: cylinder tension tick
  playKeyAnticipate() {
    this.playBuffer("keyAnticipate", { volume: 0.75, rate: 1.0 });
  }

  // 6. Lock click: heavy mechanical deadbolt spring release + wooden door thud
  playLockClick() {
    this.playBuffer("lockClick", { volume: 1.0, rate: 1.0 });
  }

  // 7. Door opening: calm, gentle, peaceful glide of a well-balanced heavy door
  playDoorCreak() {
    // Play the newly generated calm, soothing door glide audio buffer
    this.playBuffer("doorCreak", { volume: 0.75, rate: 0.98 });

    // Complement with a serene warm low-frequency acoustic glide
    if (this.ctx && this.enabled) {
      const t = this.ctx.currentTime;
      [82.4, 123.5].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.94, t + 2.2);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.035 / (idx + 1), t + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 2.5);
      });
    }
  }

  // 8. Wrong key reject: key tip rattling against the lock escutcheon plate
  playWrongKeyReject() {
    this.playBuffer("keyReject", { volume: 0.85, rate: 1.0 });
  }

  // 9. Celestial light swell: subtle warm overtone chord as light fills the doorway
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
      gain.gain.linearRampToValueAtTime(0.035 / (idx + 1), t + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 3.0);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 3.2);
    });
  }

  // 10. UI Click: crisp tactile mechanical click for buttons
  playUiClick() {
    this.playBuffer("uiClick", { volume: 0.65, rate: 1.0 });
  }

  // 11. UI Toggle
  playUiToggle() {
    this.playBuffer("uiClick", { volume: 0.5, rate: 1.15 });
  }

  // 12. Soft OTP tactile key tap
  playOtpKey() {
    this.playBuffer("uiClick", { volume: 0.35, rate: 1.35 + Math.random() * 0.1 });
  }

  // 13. Login success chime
  playSuccess() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.08, t + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.08 + 0.85);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.9);
    });
  }
}

export const sound = new SoundEngine();

// Auto-unlock Web Audio and eagerly preload SFX on first user interaction anywhere
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
