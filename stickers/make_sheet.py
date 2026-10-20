"""Builds the Scruples sticker sheet from the site's drawings.

Landscape 8.5 x 5.5 in at 300 dpi (Jukebox's 5.5 x 8.5 sheet, turned
sideways), like the Snowglobe sheet: a few big stickers on a printed
background, with the name in the corner. Writes three files next to this
script:

  scruples-stickers-print.png    - what's printed: the site's paper, the name,
                                   and the stickers with their white borders
  scruples-stickers-cutlines.png - just the cut lines, in the same spot, for
                                   Jukebox or a print-and-cut machine
  scruples-stickers-preview.png  - how the sheet looks, with shadows

Run it with Pillow, numpy and scipy installed:
  python stickers/make_sheet.py
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from scipy import ndimage

DPI = 300
W, H = int(8.5 * DPI), int(5.5 * DPI)
ROOT = Path(__file__).resolve().parent.parent
IMGS = ROOT / "public" / "imgs"
FONTS = ROOT / "public" / "scribbler-font"
OUT = Path(__file__).resolve().parent

# The white border around each sticker, and how much its outline is smoothed
# (so gaps between strings, arms etc. are filled in rather than cut round)
BORDER = int(0.08 * DPI)
SMOOTH = int(0.12 * DPI)


def inches(v):
    return int(round(v * DPI))


def load(name):
    img = Image.open(IMGS / name).convert("RGBA")
    return img.crop(img.getbbox())


def fit(img, width=None, height=None):
    w, h = img.size
    scale = (inches(width) / w) if width else (inches(height) / h)
    return img.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)


def label(text, size, dashed=False, font="Scribbler.otf", pad=(0.12, 0.06)):
    """A label like the site's: white, black border, Scribbler text"""
    f = ImageFont.truetype(str(FONTS / font), inches(size))
    l, t, r, b = f.getbbox(text)
    px, py = inches(pad[0]), inches(pad[1])
    bw = max(4, inches(size * 0.07))
    img = Image.new("RGBA", (r - l + 2 * px, b - t + 2 * py), (255, 255, 255, 255))
    d = ImageDraw.Draw(img)
    w, h = img.size
    if dashed:
        dash = bw * 3
        for x in range(0, w, dash * 2):
            d.rectangle([x, 0, min(x + dash, w), bw], fill="black")
            d.rectangle([x, h - bw, min(x + dash, w), h], fill="black")
        for y in range(0, h, dash * 2):
            d.rectangle([0, y, bw, min(y + dash, h)], fill="black")
            d.rectangle([w - bw, y, w, min(y + dash, h)], fill="black")
    else:
        d.rectangle([0, 0, w - 1, h - 1], outline="black", width=bw)
    d.text((px - l, py - t), text, font=f, fill="black")
    return img


def without_strings(img, r=14):
    """A marionette without her strings: anything thinner than her body
    (the strings and the crossbar) is taken away"""
    a = np.array(img)
    solid = a[..., 3] > 24
    disk = np.add.outer(np.arange(-r, r + 1) ** 2, np.arange(-r, r + 1) ** 2) <= r * r
    body = ndimage.binary_opening(solid, structure=disk)
    # Just the doll - the biggest piece left
    pieces, n = ndimage.label(body)
    sizes = ndimage.sum(body, pieces, range(1, n + 1))
    body = pieces == (np.argmax(sizes) + 1)
    # Grow back over her own outline
    body = ndimage.binary_dilation(body, iterations=r // 2 + 2) & solid
    a[..., 3] = np.where(body, a[..., 3], 0)
    out = Image.fromarray(a)
    return out.crop(out.getbbox())


def doll(name, hat=None):
    """Zhenya or Daphne without strings, maybe wearing one of the hats"""
    img = Image.open(IMGS / name).convert("RGBA")
    if hat:
        img.alpha_composite(Image.open(IMGS / hat).convert("RGBA").resize(img.size, Image.LANCZOS))
    return without_strings(img)


def lettering(text, size, font="ScribblerBold-OoEo.otf"):
    """Just the words, for a die-cut lettering sticker"""
    f = ImageFont.truetype(str(FONTS / font), inches(size))
    l, t, r, b = f.getbbox(text)
    img = Image.new("RGBA", (r - l, b - t), (0, 0, 0, 0))
    ImageDraw.Draw(img).text((-l, -t), text, font=f, fill="black")
    return img


# The name, printed in the top-left corner (not a sticker)
LOGO = (lettering("Scruples", 0.5), 0.35, 0.22)

# (name, image, centre x, centre y) in inches - six big stickers
STICKERS = [
    ("ticket", fit(load("ticket.png"), width=2.85), 2.75, 1.55),
    ("box", fit(load("mystery-box2.webp"), width=1.45), 5.2, 1.3),
    ("zhenya", fit(doll("doll3.png"), height=2.85).transpose(Image.FLIP_LEFT_RIGHT), 7.2, 2.0),
    ("daphne", fit(doll("daphne3.png"), height=2.65), 1.3, 3.78),
    ("shop", fit(load("souvenir.png"), width=2.25), 3.8, 3.75),
    ("smile", fit(load("drawing-smie.png"), height=1.5), 6.05, 4.25),
]


def outline_mask(alpha):
    """The sticker's shape: its drawing, grown by BORDER and smoothed"""
    solid = alpha > 24
    pad = BORDER + SMOOTH + 4
    solid = np.pad(solid, pad)
    disk = lambda r: (np.add.outer(np.arange(-r, r + 1) ** 2, np.arange(-r, r + 1) ** 2) <= r * r)
    # Fill in gaps (between strings, under arms), then grow the border
    closed = ndimage.binary_closing(solid, structure=disk(SMOOTH))
    closed = ndimage.binary_fill_holes(closed)
    grown = ndimage.binary_dilation(closed, structure=disk(BORDER))
    return grown, pad


def main():
    print_sheet = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cut_sheet = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    shadow_sheet = Image.new("L", (W, H), 0)
    taken = np.zeros((H, W), bool)
    problems = []

    owner = np.full((H, W), "", dtype=object)
    for name, img, cx, cy in STICKERS:
        alpha = np.array(img.getchannel("A"))
        shape, pad = outline_mask(alpha)
        sh, sw = shape.shape
        x0 = inches(cx) - sw // 2
        y0 = inches(cy) - sh // 2

        # Where the sticker itself is (its box has some empty room around it)
        ys, xs = np.nonzero(shape)
        left, top = x0 + xs.min(), y0 + ys.min()
        right, bottom = x0 + xs.max(), y0 + ys.max()
        if left < inches(0.25) or top < inches(0.25) or right > W - inches(0.25) or bottom > H - inches(0.25):
            problems.append(f"{name} is too close to the edge")
        # Overlap check - stickers need a gap between them to be cut
        region = taken[max(0, y0):y0 + sh, max(0, x0):x0 + sw]
        sub = shape[max(0, -y0):max(0, -y0) + region.shape[0], max(0, -x0):max(0, -x0) + region.shape[1]]
        if (region & sub).any():
            ys, xs = np.nonzero(region & sub)
            others = set(owner[max(0, y0) + ys, max(0, x0) + xs])
            problems.append(f"{name} is too close to {', '.join(sorted(others))}")
        gap = ndimage.binary_dilation(shape, iterations=inches(0.06))
        gr = taken[max(0, y0):y0 + sh, max(0, x0):x0 + sw]
        gs = gap[max(0, -y0):max(0, -y0) + gr.shape[0], max(0, -x0):max(0, -x0) + gr.shape[1]]
        taken[max(0, y0):y0 + sh, max(0, x0):x0 + sw] |= gs
        owner[max(0, y0):y0 + sh, max(0, x0):x0 + sw][gs] = name

        # The white sticker with the drawing on it
        sticker = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
        white = Image.new("RGBA", (sw, sh), (255, 255, 255, 255))
        sticker.paste(white, (0, 0), Image.fromarray((shape * 255).astype(np.uint8)))
        sticker.alpha_composite(img, (pad, pad))
        print_sheet.alpha_composite(sticker, (x0, y0))

        # Its cut line - the edge of the shape
        edge = shape & ~ndimage.binary_erosion(shape, iterations=3)
        line = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
        line.paste(Image.new("RGBA", (sw, sh), (0, 0, 0, 255)), (0, 0), Image.fromarray((edge * 255).astype(np.uint8)))
        cut_sheet.alpha_composite(line, (x0, y0))
        shadow_sheet.paste(255, (x0, y0), Image.fromarray((shape * 255).astype(np.uint8)))

    cut_sheet.save(OUT / "scruples-stickers-cutlines.png", dpi=(DPI, DPI))

    # The site's paper, with the name printed in the corner
    paper = Image.open(IMGS / "paper-bg-2560.jpg").convert("RGB")
    paper = paper.resize((round(paper.width * H / paper.height), H), Image.LANCZOS)
    paper = paper.crop((0, 0, W, H)).convert("RGBA")
    logo, lx, ly = LOGO
    paper.alpha_composite(logo, (inches(lx), inches(ly)))

    printed = paper.copy()
    printed.alpha_composite(print_sheet)
    printed.convert("RGB").save(OUT / "scruples-stickers-print.png", dpi=(DPI, DPI))

    # Preview: each sticker with a soft shadow
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    shadow.putalpha(shadow_sheet.filter(ImageFilter.GaussianBlur(14)).point(lambda v: v * 0.35))
    paper.alpha_composite(shadow, (8, 14))
    paper.alpha_composite(print_sheet)
    paper.convert("RGB").save(OUT / "scruples-stickers-preview.png", dpi=(DPI, DPI))

    print("\n".join(problems) or "no overlaps")


if __name__ == "__main__":
    main()
