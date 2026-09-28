#!/usr/bin/env python3
"""
Physical Acoustic Foley Generator for Real Lock, Key, and Heavy Door SFX
Generates 44.1kHz 16-bit PCM WAV files modeled on physical acoustics.
"""

import math
import os
import random
import struct
import wave

SAMPLE_RATE = 44100
OUT_DIR = "frontend/public/audio"

def write_wav(filename, samples, sample_rate=SAMPLE_RATE):
    filepath = os.path.join(OUT_DIR, filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    # Normalize peak to 0.92
    max_val = max(abs(s) for s in samples) if samples else 1.0
    if max_val == 0:
        max_val = 1.0
    gain = 0.92 / max_val
    int_samples = [int(max(-32767, min(32767, s * gain * 32767))) for s in samples]

    with wave.open(filepath, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        raw_data = struct.pack(f"<{len(int_samples)}h", *int_samples)
        wf.writeframes(raw_data)
    print(f"Generated {filepath} ({len(samples)} samples, {len(samples)/sample_rate:.2f}s)")

# Bandpass biquad filter implementation
class Biquad:
    def __init__(self, ftype, f0, Q, fs=SAMPLE_RATE):
        w0 = 2.0 * math.pi * f0 / fs
        alpha = math.sin(w0) / (2.0 * Q)
        cos_w0 = math.cos(w0)

        if ftype == "bandpass":
            b0 = alpha
            b1 = 0.0
            b2 = -alpha
            a0 = 1.0 + alpha
            a1 = -2.0 * cos_w0
            a2 = 1.0 - alpha
        elif ftype == "lowpass":
            b0 = (1.0 - cos_w0) / 2.0
            b1 = 1.0 - cos_w0
            b2 = (1.0 - cos_w0) / 2.0
            a0 = 1.0 + alpha
            a1 = -2.0 * cos_w0
            a2 = 1.0 - alpha
        elif ftype == "highpass":
            b0 = (1.0 + cos_w0) / 2.0
            b1 = -(1.0 + cos_w0)
            b2 = (1.0 + cos_w0) / 2.0
            a0 = 1.0 + alpha
            a1 = -2.0 * cos_w0
            a2 = 1.0 - alpha
        else:
            raise ValueError(f"Unknown filter type {ftype}")

        self.b0 = b0 / a0
        self.b1 = b1 / a0
        self.b2 = b2 / a0
        self.a1 = a1 / a0
        self.a2 = a2 / a0
        self.x1 = self.x2 = self.y1 = self.y2 = 0.0

    def process(self, x):
        y = self.b0 * x + self.b1 * self.x1 + self.b2 * self.x2 - self.a1 * self.y1 - self.a2 * self.y2
        self.x2 = self.x1
        self.x1 = x
        self.y2 = self.y1
        self.y1 = y
        return y

def make_noise(n_samples):
    return [random.uniform(-1.0, 1.0) for _ in range(n_samples)]

# --------------------------------------------------------------------------
# 1. KEY PICKUP: Authentic brass keys jingling / picking up off surface
# Multi-stage micro impacts of brass keys on a ring with metallic ringing modes
# --------------------------------------------------------------------------
def gen_key_pickup():
    dur = 0.45
    n = int(dur * SAMPLE_RATE)
    out = [0.0] * n

    # 4 distinct micro-contacts in the jingle cluster
    contacts = [
        {"t": 0.000, "amp": 0.95, "pitch_scale": 1.0},
        {"t": 0.024, "amp": 0.65, "pitch_scale": 1.08},
        {"t": 0.052, "amp": 0.78, "pitch_scale": 0.94},
        {"t": 0.096, "amp": 0.45, "pitch_scale": 1.15},
    ]

    brass_modes = [
        (2850, 45, 0.45),
        (4320, 55, 0.35),
        (6180, 60, 0.25),
        (8450, 65, 0.20),
        (11200, 50, 0.12),
    ]

    for c in contacts:
        start_idx = int(c["t"] * SAMPLE_RATE)
        # initial contact click noise (0.8ms)
        click_len = int(0.0012 * SAMPLE_RATE)
        for i in range(click_len):
            if start_idx + i < n:
                env = (1.0 - i / click_len) ** 2
                out[start_idx + i] += (random.uniform(-1.0, 1.0) * env * 0.4 * c["amp"])

        # modal ringing of brass key
        for freq, Q, level in brass_modes:
            f = freq * c["pitch_scale"]
            decay = math.pi * f / Q
            mode_len = min(n - start_idx, int(0.28 * SAMPLE_RATE))
            phase = random.uniform(0, 2 * math.pi)
            for i in range(mode_len):
                t = i / SAMPLE_RATE
                amp = math.exp(-decay * t)
                sample = math.sin(2.0 * math.pi * f * t + phase) * amp * level * c["amp"]
                out[start_idx + i] += sample

    write_wav("key_pickup.wav", out)

# --------------------------------------------------------------------------
# 2. KEY SLIDE: Brass blade sliding into cylinder with 5 spring tumbler pins
# --------------------------------------------------------------------------
def gen_key_slide():
    dur = 0.52
    n = int(dur * SAMPLE_RATE)
    out = [0.0] * n

    # Metal scraping friction texture (shaped bandpass noise)
    noise = make_noise(n)
    bp1 = Biquad("bandpass", 2800, 3.5)
    bp2 = Biquad("bandpass", 4200, 4.0)

    for i in range(n):
        t = i / SAMPLE_RATE
        # Envelope rises gently, holds, then finishes as blade seats
        p = t / dur
        if p < 0.15:
            env = p / 0.15
        elif p < 0.85:
            env = 1.0
        else:
            env = (1.0 - p) / 0.15
        s = (bp1.process(noise[i]) * 0.6 + bp2.process(noise[i]) * 0.4) * env * 0.35
        out[i] += s

    # 5 Tumbler pin clicks as notches slide over pins
    pin_times = [0.08, 0.17, 0.26, 0.35, 0.44]
    for idx, pt in enumerate(pin_times):
        start = int(pt * SAMPLE_RATE)
        # Pin click: sharp transient (1ms) + high Q metallic ping
        pin_freq = 3800 + idx * 320
        decay = math.pi * pin_freq / 35
        click_dur = int(0.04 * SAMPLE_RATE)
        for i in range(click_dur):
            if start + i < n:
                t = i / SAMPLE_RATE
                noise_part = random.uniform(-1.0, 1.0) * math.exp(-t * 2500) * 0.4
                tone_part = math.sin(2.0 * math.pi * pin_freq * t) * math.exp(-decay * t) * 0.35
                out[start + i] += (noise_part + tone_part) * 0.7

    write_wav("key_slide.wav", out)

# --------------------------------------------------------------------------
# 3. KEY SEAT: Key shoulder hitting cylinder face with a crisp metal clack
# --------------------------------------------------------------------------
def gen_key_seat():
    dur = 0.22
    n = int(dur * SAMPLE_RATE)
    out = [0.0] * n

    # Sharp initial impact spike (< 1.5ms)
    spike_len = int(0.0018 * SAMPLE_RATE)
    for i in range(spike_len):
        env = (1.0 - i / spike_len) ** 3
        out[i] += random.uniform(-1.0, 1.0) * env * 0.8

    # Solid brass cylinder impact modes (sharp clack, low body thud)
    seat_modes = [
        (1850, 28, 0.45),
        (3400, 36, 0.40),
        (5600, 45, 0.25),
        (8200, 50, 0.15),
    ]

    for freq, Q, level in seat_modes:
        decay = math.pi * freq / Q
        for i in range(n):
            t = i / SAMPLE_RATE
            amp = math.exp(-decay * t)
            out[i] += math.sin(2.0 * math.pi * freq * t) * amp * level

    # Solid lock case thud (low thud from hitting backplate)
    thud_f = 240
    for i in range(int(0.06 * SAMPLE_RATE)):
        t = i / SAMPLE_RATE
        out[i] += math.sin(2.0 * math.pi * thud_f * (1.0 - t * 8.0) * t) * math.exp(-t * 65.0) * 0.55

    write_wav("key_seat.wav", out)

# --------------------------------------------------------------------------
# 4. KEY TURN / ANTICIPATION: Spring tension resistance click before throw
# --------------------------------------------------------------------------
def gen_key_anticipate():
    dur = 0.18
    n = int(dur * SAMPLE_RATE)
    out = [0.0] * n

    # Spring resistance scrape & small metallic tick
    bp = Biquad("bandpass", 1600, 4.0)
    noise = make_noise(n)
    for i in range(n):
        t = i / SAMPLE_RATE
        env = math.sin(t / dur * math.pi) ** 1.5
        out[i] += bp.process(noise[i]) * env * 0.22

    # Tension tick at 60ms
    start = int(0.06 * SAMPLE_RATE)
    tick_f = 2150
    for i in range(int(0.04 * SAMPLE_RATE)):
        t = i / SAMPLE_RATE
        out[start + i] += math.sin(2.0 * math.pi * tick_f * t) * math.exp(-t * 120.0) * 0.45

    write_wav("key_anticipate.wav", out)

# --------------------------------------------------------------------------
# 5. LOCK CLICK: Real heavy mechanical deadbolt throwing open
# Multi-stage: tumbler lift -> sharp spring latch release -> heavy bolt thud & wood reverberation
# --------------------------------------------------------------------------
def gen_lock_click():
    dur = 0.55
    n = int(dur * SAMPLE_RATE)
    out = [0.0] * n

    # Stage 1: Cylinder shear & tumbler lift (0 to 30ms)
    lift_dur = int(0.03 * SAMPLE_RATE)
    bp_lift = Biquad("bandpass", 2400, 5.0)
    noise1 = make_noise(lift_dur)
    for i in range(lift_dur):
        out[i] += bp_lift.process(noise1[i]) * (i / lift_dur) * 0.25

    # Stage 2: Heavy bolt release snap at 32ms (loud, sharp metal latch snap)
    snap_start = int(0.032 * SAMPLE_RATE)
    snap_len = int(0.002 * SAMPLE_RATE)
    for i in range(snap_len):
        out[snap_start + i] += random.uniform(-1.0, 1.0) * (1.0 - i / snap_len) * 0.95

    snap_modes = [
        (1350, 22, 0.60),
        (2600, 32, 0.50),
        (4400, 42, 0.40),
        (6800, 48, 0.25),
        (9200, 52, 0.18),
    ]
    for freq, Q, level in snap_modes:
        decay = math.pi * freq / Q
        for i in range(n - snap_start):
            t = i / SAMPLE_RATE
            out[snap_start + i] += math.sin(2.0 * math.pi * freq * t) * math.exp(-decay * t) * level * 0.85

    # Stage 3: Heavy deadbolt slug impact against strike plate at 48ms (deep chunk & wood frame thud)
    chunk_start = int(0.048 * SAMPLE_RATE)
    chunk_len = n - chunk_start

    # Acoustic door panel resonant body (wood cavity formants)
    # 95 Hz main thump, 160 Hz frame thud, 320 Hz box rattle
    for i in range(chunk_len):
        t = i / SAMPLE_RATE
        thump1 = math.sin(2.0 * math.pi * 92.0 * t) * math.exp(-t * 24.0) * 0.70
        thump2 = math.sin(2.0 * math.pi * 158.0 * t) * math.exp(-t * 32.0) * 0.55
        thump3 = math.sin(2.0 * math.pi * 315.0 * t) * math.exp(-t * 48.0) * 0.35
        out[chunk_start + i] += (thump1 + thump2 + thump3) * 0.9

    # Additional metallic housing rattle after bolt impact (60-140ms)
    rattle_start = int(0.065 * SAMPLE_RATE)
    rattle_noise = make_noise(n - rattle_start)
    bp_rattle = Biquad("bandpass", 3200, 6.0)
    for i in range(int(0.08 * SAMPLE_RATE)):
        t = i / SAMPLE_RATE
        env = math.exp(-t * 55.0)
        out[rattle_start + i] += bp_rattle.process(rattle_noise[i]) * env * 0.3

    write_wav("lock_click.wav", out)

# --------------------------------------------------------------------------
# 6. DOOR CREAK: Authentic heavy wooden door groaning open on iron hinges
# Stick-slip friction model exciting wooden door cavity resonances
# --------------------------------------------------------------------------
def gen_door_creak():
    dur = 1.6
    n = int(dur * SAMPLE_RATE)
    out = [0.0] * n

    # Formant filters representing heavy oak door slab and cast iron hinge
    wood1 = Biquad("bandpass", 165.0, 6.0)   # Primary door slab resonance
    wood2 = Biquad("bandpass", 375.0, 7.5)   # Upper panel resonance
    wood3 = Biquad("bandpass", 740.0, 9.0)   # Frame / casing resonance
    iron  = Biquad("bandpass", 1550.0, 11.0) # Iron hinge squeak overtone

    # Stick-slip pulse train: repetition frequency varies continuously with door motion
    # Starts slow (45 Hz), peaks as door swings (95 Hz), slows down (55 Hz)
    phase = 0.0
    for i in range(n):
        t = i / SAMPLE_RATE
        p = t / dur

        # Door swing velocity envelope: smooth rise, prolonged groan, gentle finish
        if p < 0.2:
            vel = math.sin(p / 0.2 * math.pi / 2.0)
        elif p < 0.8:
            vel = 1.0 - 0.25 * ((p - 0.2) / 0.6)
        else:
            vel = 0.75 * math.cos((p - 0.8) / 0.2 * math.pi / 2.0)

        # Slip frequency: 42 Hz to 98 Hz
        inst_freq = 42.0 + 56.0 * vel + 8.0 * math.sin(t * 14.0)
        phase += 2.0 * math.pi * inst_freq / SAMPLE_RATE
        if phase >= 2.0 * math.pi:
            phase -= 2.0 * math.pi
            # Each slip produces an impulse friction burst (sharp stick-slip transient)
            pulse = (random.uniform(0.7, 1.0) if random.random() > 0.15 else 0.0)
        else:
            pulse = 0.0

        # Filter the friction pulses through wood & iron cavity resonators
        f_wood1 = wood1.process(pulse)
        f_wood2 = wood2.process(pulse)
        f_wood3 = wood3.process(pulse)
        f_iron  = iron.process(pulse)

        # Mix with natural wooden warmth
        creak_sample = (f_wood1 * 0.65 + f_wood2 * 0.45 + f_wood3 * 0.35 + f_iron * 0.22) * vel
        out[i] = creak_sample

    write_wav("door_creak.wav", out)

# --------------------------------------------------------------------------
# 7. KEY REJECT: Key tip bumping wrong keyway and rattling back
# --------------------------------------------------------------------------
def gen_key_reject():
    dur = 0.38
    n = int(dur * SAMPLE_RATE)
    out = [0.0] * n

    # 2 dull brass-on-brass recoil impacts (0ms and 85ms)
    bounces = [(0.0, 0.85), (0.085, 0.45)]
    reject_modes = [(1450, 18, 0.5), (2800, 24, 0.4), (4600, 28, 0.25)]

    for b_time, b_amp in bounces:
        start = int(b_time * SAMPLE_RATE)
        # click transient
        for i in range(int(0.002 * SAMPLE_RATE)):
            if start + i < n:
                out[start + i] += random.uniform(-1.0, 1.0) * (1.0 - i / 88.0) * 0.5 * b_amp

        for freq, Q, level in reject_modes:
            decay = math.pi * freq / Q
            for i in range(n - start):
                t = i / SAMPLE_RATE
                out[start + i] += math.sin(2.0 * math.pi * freq * t) * math.exp(-decay * t) * level * b_amp

    write_wav("key_reject.wav", out)

# --------------------------------------------------------------------------
# 8. UI CLICK: Crisp tactile mechanical click for buttons
# --------------------------------------------------------------------------
def gen_ui_click():
    dur = 0.06
    n = int(dur * SAMPLE_RATE)
    out = [0.0] * n

    bp = Biquad("bandpass", 1850, 4.5)
    noise = make_noise(n)
    for i in range(n):
        t = i / SAMPLE_RATE
        env = math.exp(-t * 140.0)
        out[i] = (bp.process(noise[i]) * 0.6 + math.sin(2.0 * math.pi * 1250 * t) * 0.4) * env

    write_wav("ui_click.wav", out)

if __name__ == "__main__":
    print("Generating authentic physical acoustic SFX...")
    gen_key_pickup()
    gen_key_slide()
    gen_key_seat()
    gen_key_anticipate()
    gen_lock_click()
    gen_door_creak()
    gen_key_reject()
    gen_ui_click()
    print("All SFX generated successfully in", OUT_DIR)
