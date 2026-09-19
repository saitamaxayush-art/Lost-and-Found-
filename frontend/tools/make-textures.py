"""Procedural textures for the landing scene (cardboard + table wood).
Run:  python3 tools/make-textures.py   (needs numpy + Pillow)
Output goes to public/scene/tex/. Not AI-generated: pure noise math."""
import numpy as np
from PIL import Image

rng = np.random.default_rng(11)

def noise(w, h, sx, sy):
    """Smooth value noise; sx/sy = cell counts (anisotropic => streaks)."""
    small = rng.random((max(2, sy), max(2, sx))).astype(np.float32)
    img = Image.fromarray((small * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
    return np.asarray(img, dtype=np.float32) / 255.0

def fbm(w, h, cells, aniso=(1, 1), octaves=4):
    out = np.zeros((h, w), np.float32); amp = 1.0; tot = 0
    for o in range(octaves):
        out += amp * noise(w, h, int(cells[0] * aniso[0] * 2**o), int(cells[1] * aniso[1] * 2**o))
        tot += amp; amp *= .5
    return out / tot

def tint(base, n, contrast):
    base = np.array(base, np.float32)
    rgb = base[None, None, :] * (1 + (n[..., None] - .5) * contrast)
    return np.clip(rgb, 0, 255).astype(np.uint8)

# ---- cardboard (kraft): fine grain + vertical fibre streaks + speckle
W = H = 512
grain = fbm(W, H, (40, 40), octaves=3)
streak = fbm(W, H, (90, 3), octaves=3)          # tall thin streaks (fibres)
speck = (rng.random((H, W)) > .985).astype(np.float32) * .35
n = .7 * grain + .3 * streak - speck
Image.fromarray(tint((190, 148, 98), n, .30)).save("public/scene/tex/cardboard.jpg", quality=88)

# ---- table wood: long horizontal grain with a few dark rings
W, H = 1200, 220
g1 = fbm(W, H, (3, 60), octaves=4)
g2 = fbm(W, H, (10, 140), octaves=3)
rings = (np.sin((g1 * 22)) * .5 + .5) * .35
n = .5 * g1 + .3 * g2 + rings
Image.fromarray(tint((205, 150, 86), n, .7)).save("public/scene/tex/wood.jpg", quality=88)
print("ok")
