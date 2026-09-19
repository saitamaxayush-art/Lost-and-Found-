import os
import zlib
import struct
import math
import random

def write_png_rgb(filename, width, height, rgb_bytes):
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
    raw = bytearray()
    row_bytes = width * 3
    for y in range(height):
        raw.append(0)  # filter type 0 (None)
        raw.extend(rgb_bytes[y * row_bytes : (y + 1) * row_bytes])
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', zlib.compress(bytes(raw), 9)) + chunk(b'IEND', b'')
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, 'wb') as f:
        f.write(png)
    print(f"Generated {filename} ({width}x{height})")

def clamp(v, low=0, high=255):
    return max(low, min(high, int(v)))

def generate_cardboard(filename="public/scene/tex/cardboard.png", w=256, h=256):
    random.seed(42)
    # Base kraft cardboard color
    base_r, base_g, base_b = 188, 142, 94
    buf = bytearray(w * h * 3)

    for y in range(h):
        # Subtle horizontal fluting / corrugation grain
        flute = math.sin(y * 0.15) * 4.0
        for x in range(w):
            # Fine fibrous noise
            n1 = (random.random() - 0.5) * 16.0
            n2 = (random.random() - 0.5) * 8.0
            # Occasional darker pulp speck
            speck = -28 if random.random() < 0.018 else 0
            # Occasional light fiber streak
            fiber = 18 if (x % 37 == 0 and random.random() < 0.6) else 0

            val = flute + n1 + n2 + speck + fiber
            r = clamp(base_r + val * 1.0)
            g = clamp(base_g + val * 0.95)
            b = clamp(base_b + val * 0.85)

            idx = (y * w + x) * 3
            buf[idx] = r
            buf[idx + 1] = g
            buf[idx + 2] = b

    write_png_rgb(filename, w, h, buf)

def generate_wood(filename="public/scene/tex/wood.png", w=256, h=256):
    random.seed(101)
    buf = bytearray(w * h * 3)

    for y in range(h):
        # Wood rings and horizontal grain
        wave1 = math.sin((x_pos := 0) + y * 0.12) * 14.0
        for x in range(w):
            # Wood grain formula: distorted lines running horizontally
            grain = math.sin(y * 0.25 + math.sin(x * 0.04) * 8.0 + (random.random() - 0.5) * 2.0)
            pore = -15 if (random.random() < 0.025) else 0
            noise = (random.random() - 0.5) * 6.0

            # Base rich walnut/oak
            base_r = 52 + grain * 12 + wave1 * 0.5 + pore + noise
            base_g = 34 + grain * 8 + wave1 * 0.35 + pore + noise
            base_b = 22 + grain * 5 + wave1 * 0.2 + pore + noise

            idx = (y * w + x) * 3
            buf[idx] = clamp(base_r)
            buf[idx + 1] = clamp(base_g)
            buf[idx + 2] = clamp(base_b)

    write_png_rgb(filename, w, h, buf)

def generate_paper(filename="public/scene/tex/paper.png", w=256, h=256):
    random.seed(202)
    buf = bytearray(w * h * 3)
    base_r, base_g, base_b = 246, 243, 233

    for y in range(h):
        for x in range(w):
            n = (random.random() - 0.5) * 8.0
            # subtle paper fibers
            f = 6 if random.random() < 0.03 else 0
            speck = -12 if random.random() < 0.005 else 0

            idx = (y * w + x) * 3
            buf[idx] = clamp(base_r + n + f + speck)
            buf[idx + 1] = clamp(base_g + n + f + speck)
            buf[idx + 2] = clamp(base_b + n + f + speck)

    write_png_rgb(filename, w, h, buf)

def generate_tape(filename="public/scene/tex/tape.png", w=128, h=128):
    random.seed(303)
    buf = bytearray(w * h * 3)
    # amber-tan packaging tape
    base_r, base_g, base_b = 215, 178, 118

    for y in range(h):
        for x in range(w):
            # subtle longitudinal adhesive striations
            streak = math.sin(x * 0.8) * 3.0
            n = (random.random() - 0.5) * 5.0
            idx = (y * w + x) * 3
            buf[idx] = clamp(base_r + streak + n)
            buf[idx + 1] = clamp(base_g + streak + n)
            buf[idx + 2] = clamp(base_b + streak + n)

    write_png_rgb(filename, w, h, buf)

if __name__ == "__main__":
    generate_cardboard()
    generate_wood()
    generate_paper()
    generate_tape()
