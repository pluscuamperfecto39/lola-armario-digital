# Genera los iconos PWA de LOLA (degradado violeta -> rosa + percha blanca).
# Uso:  python tools/generate_icons.py
from PIL import Image, ImageDraw
import os

ASSETS = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets")
os.makedirs(ASSETS, exist_ok=True)

TOP = (0x7C, 0x6C, 0xF0)   # violeta
BOT = (0xE3, 0x57, 0xA0)   # rosa
WHITE = (255, 255, 255)


def gradient(size):
    img = Image.new("RGB", (size, size), TOP)
    d = ImageDraw.Draw(img)
    for y in range(size):
        t = y / (size - 1)
        d.line([(0, y), (size, y)], fill=(
            int(TOP[0] + (BOT[0] - TOP[0]) * t),
            int(TOP[1] + (BOT[1] - TOP[1]) * t),
            int(TOP[2] + (BOT[2] - TOP[2]) * t),
        ))
    return img


def rounded_mask(size, radius):
    m = Image.new("L", (size, size), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return m


def draw_hanger(img, size, scale=1.0):
    d = ImageDraw.Draw(img)
    cx = size / 2
    w = size * 0.40 * scale
    barY = size * (0.5 + 0.12 * scale)
    apexY = size * (0.5 - 0.04 * scale)
    lw = max(6, int(size * 0.030))
    left = (cx - w, barY)
    right = (cx + w, barY)
    apex = (cx, apexY)
    # triángulo de la percha (hombros + barra inferior)
    d.line([left, apex, right, left], fill=WHITE, width=lw, joint="curve")
    for p in (left, right, apex):
        r = lw / 2
        d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=WHITE)
    # gancho superior
    hr = size * 0.055 * scale
    top = apexY - size * 0.11 * scale
    d.arc([cx - hr, top, cx + hr, top + 2 * hr], start=120, end=430, fill=WHITE, width=lw)
    d.line([(cx, top + hr), (cx, apexY)], fill=WHITE, width=lw)


def make(size, maskable=False):
    img = gradient(size).convert("RGBA")
    draw_hanger(img, size, scale=0.78 if maskable else 1.0)
    if maskable:
        return img
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), rounded_mask(size, int(size * 0.22)))
    return out


make(192).save(os.path.join(ASSETS, "icon-192.png"))
make(512).save(os.path.join(ASSETS, "icon-512.png"))
make(512, maskable=True).save(os.path.join(ASSETS, "icon-maskable-512.png"))
print("Iconos generados en", ASSETS)
