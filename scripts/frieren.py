# Builds the colour braille art in profile.json from a source frame (not committed: the Frieren
# frame belongs to its studio). Needs a venv with pillow, numpy. Usage:
#   python3 scripts/frieren.py path/to/frame.png   -> writes art-v.json + preview PNGs next to the frame
# Then splice art/artColors/artPalette/artLineHeight into profile.json and run node scripts/generate.mjs.
# Tunables via env: COLS ROWS XRANGE T_DARK T_FG FLOOD BG_TOL HEART TAG.
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw

SRC = sys.argv[1]
OUT = os.path.dirname(os.path.abspath(SRC))
COLS = int(os.environ.get('COLS', '60')); ROWS = int(os.environ.get('ROWS', '24'))
DW, DH = COLS * 2, ROWS * 4
X0, X1 = [int(v) for v in os.environ.get('XRANGE', '50,1760').split(',')]
T_DARK = float(os.environ.get('T_DARK', '0.22')); T_FG = float(os.environ.get('T_FG', '0.45'))
FLOOD = int(os.environ.get('FLOOD', '24')); BG_TOL = float(os.environ.get('BG_TOL', '5')) / 255
TAG = os.environ.get('TAG', 'v2')
BGCOL = (242, 242, 232)

src = Image.open(SRC).convert('RGB')
SW, SH = src.size
cw = X1 - X0; ch = round(cw * DH / DW)          # square dots
canvas = Image.new('RGB', (cw, max(ch, SH)), BGCOL)
canvas.paste(src.crop((X0, 0, X1, SH)), (0, max(ch, SH) - SH))
img = canvas.crop((0, canvas.height - ch, cw, canvas.height))
W, H = img.size
print('crop', (X0, X1), 'canvas', (W, H), 'dot px', round(W / DW, 2), round(H / DH, 2))

# background: flood from the edges (handles gradients, stops at outlines) + exact-colour pockets
key = img.copy()
seeds = [(3, 3), (W - 4, 3), (W // 2, 3), (3, H // 2), (W - 4, H // 3), (3, H - 4), (W - 4, H - 4)]
for sx, sy in seeds:
    if sum(abs(c - b) for c, b in zip(key.getpixel((sx, sy)), BGCOL)) <= 12:
        ImageDraw.floodfill(key, (sx, sy), (255, 0, 255), thresh=FLOOD)
k = np.asarray(key)
flood = (k[..., 0] == 255) & (k[..., 1] == 0) & (k[..., 2] == 255)
a = np.asarray(img).astype(np.float32) / 255.0
bg = flood | (np.abs(a - np.array(BGCOL, dtype=np.float32) / 255).max(2) <= BG_TOL)

r, g, b = a[..., 0], a[..., 1], a[..., 2]
mx = a.max(2); mn = a.min(2); d = mx - mn
v = mx; s = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0)
rc = (mx - r) / np.maximum(d, 1e-6); gc = (mx - g) / np.maximum(d, 1e-6); bc = (mx - b) / np.maximum(d, 1e-6)
h = np.where(r == mx, bc - gc, np.where(g == mx, 2 + rc - bc, 4 + gc - rc))
h = np.where(d < 1e-6, 0, ((h / 6.0) % 1.0) * 360)
lum = 0.299 * r + 0.587 * g + 0.114 * b
dark = (~bg) & (lum < 0.42) & (s < 0.35)
fg = (~bg) & (~dark)
cool = (h >= 200) & (h <= 330)
classes = [
  ('eyes',     fg & (h > 95) & (h < 190) & (s > 0.10) & (v > 0.5)),
  ('red',      fg & ((h < 20) | (h > 335)) & (s > 0.35) & (v > 0.3)),
  ('heart',    fg & ((h > 315) | (h < 20)) & (s > 0.15) & (v > 0.70)),
  ('scarf_sh', fg & (h >= 185) & (h <= 240) & (s > 0.15) & (v < 0.80)),
  ('scarf',    fg & (h >= 185) & (h <= 240) & (s > 0.15)),
  ('skin',     fg & (h >= 5) & (h < 40) & (s >= 0.065) & (v > 0.60)),
  ('hair',     fg & cool & (s < 0.15) & (v > 0.80)),
  ('hair_sh',  fg & cool & (s < 0.35) & (v <= 0.80)),
  ('coat',     fg & (s < 0.065) & (v > 0.80)),
  ('coat_sh',  fg & (v <= 0.80)),
]
PAL = {
  'hair': '#e4e6f2', 'hair_sh': '#a9adc9', 'coat': '#d8d4c8', 'coat_sh': '#9d9a90',
  'skin': '#f5cdb3', 'scarf': '#7dd3fc', 'scarf_sh': '#38a9e0', 'eyes': '#01d68a',
  'heart': '#f9a8d4', 'red': '#f87171',
}
WEIGHT = {'eyes': 8, 'heart': 3, 'red': 4}
names = [n for n, _ in classes]
cls = np.full((H, W), -1, dtype=np.int16)
for i, (n, m) in enumerate(classes):
    cls[(cls == -1) & m] = i
un = fg & (cls == -1); cls[un] = names.index('coat')
print('bg %.1f%% (flood %.1f%%)  dark %.1f%%  fg %.1f%%  unassigned %.2f%%' % (bg.mean()*100, flood.mean()*100, dark.mean()*100, fg.mean()*100, un.mean()*100))
print('  ' + '  '.join('%s %.1f%%' % (n, (cls == i).mean()*100) for i, n in enumerate(names)))

def box(mask, size):
    im = Image.fromarray((mask.astype(np.float32) * 255).astype(np.uint8))
    return np.asarray(im.resize(size, Image.BOX)).astype(np.float32) / 255

fg_frac = box(fg, (DW, DH)); dark_frac = box(dark, (DW, DH))
on = (fg_frac > T_FG) & (dark_frac < T_DARK)
# speckle cleanup: drop dots with <=1 lit neighbour, fill single holes surrounded by 8 lit dots
def neighbours(m):
    pm = np.pad(m.astype(np.int16), 1)
    return sum(pm[1+dy:pm.shape[0]-1+dy, 1+dx:pm.shape[1]-1+dx] for dy in (-1,0,1) for dx in (-1,0,1) if dy or dx)
for _ in range(2):
    nb = neighbours(on)
    on = on & (nb >= 2)
    on = on | ((~on) & (nb >= 8) & (fg_frac > 0.2))
score = np.stack([box(cls == i, (COLS, ROWS)) * WEIGHT.get(n, 1) for i, n in enumerate(names)])
cell_cls = score.argmax(0); cell_any = score.max(0) > 0
# Jaider's call: the iris cells read better as skin, the lash gaps then look like closed eyes (EYES=green keeps them)
if os.environ.get('EYES', 'skin') == 'skin':
    cell_cls[cell_cls == names.index('eyes')] = names.index('skin')
# the meme's heart is tilted and lands as a pink blob at this size: stamp a clean heart at the same spot
HEART = ['.XXX...XXX.', 'XXXXX.XXXXX', 'XXXXXXXXXXX', 'XXXXXXXXXXX', '.XXXXXXXXX.', '..XXXXXXX..', '...XXXXX...', '....XXX....', '.....X.....']
hi = names.index('heart')
hcells = (cell_cls == hi) & cell_any
hcells[int(ROWS * 0.45):, :] = False; hcells[:, int(COLS * 0.4):] = False   # only the floating heart, not the pink cuff
if hcells.any() and os.environ.get('HEART', '1') == '1':
    ys, xs = np.nonzero(hcells)
    y0, y1, x0, x1 = ys.min()*4, ys.max()*4+4, xs.min()*2, xs.max()*2+2
    on[y0:y1, x0:x1] = False
    cy0 = (y0 + y1) // 2 - len(HEART) // 2; cx0 = (x0 + x1) // 2 - len(HEART[0]) // 2
    for dy, row in enumerate(HEART):
        for dx, ch in enumerate(row):
            if ch == 'X': on[cy0 + dy, cx0 + dx] = True
    cell_cls[cy0 // 4:(cy0 + len(HEART) - 1) // 4 + 1, cx0 // 2:(cx0 + len(HEART[0]) - 1) // 2 + 1] = hi
    cell_any[cy0 // 4:(cy0 + len(HEART) - 1) // 4 + 1, cx0 // 2:(cx0 + len(HEART[0]) - 1) // 2 + 1] = True
    print('heart stamped at dots', (cx0, cy0))

BITS = {(0,0):1,(0,1):2,(0,2):4,(1,0):8,(1,1):16,(1,2):32,(0,3):64,(1,3):128}
palette = [PAL[n] for n in names]
rows, colors = [], []
for cy in range(ROWS):
    line, col = [], []
    for cx in range(COLS):
        bits = sum(bit for (dx, dy), bit in BITS.items() if on[cy*4+dy, cx*2+dx])
        if bits and cell_any[cy, cx]:
            line.append(chr(0x2800 + bits)); col.append('%x' % cell_cls[cy, cx])
        else:
            line.append(' '); col.append('.')
    rows.append(''.join(line).rstrip()); colors.append(''.join(col).rstrip('.'))
json.dump({'artLineHeight': 1.2, 'artPalette': palette, 'art': rows, 'artColors': colors},
          open(f'{OUT}/art-{TAG}.json', 'w'), ensure_ascii=False, indent=1)
print('dots on %d/%d  cells %d/%d  rows %d' % (on.sum(), on.size, sum(len(x.replace(' ', '')) for x in rows), COLS*ROWS, ROWS))

SC = 2; CW, CH = 7.8 * SC, 15.6 * SC; P = 3.9 * SC
def render(path, mode, mono=None):
    im = Image.new('RGB', (int(COLS * CW), int(ROWS * CH)), (0, 0, 0)); dr = ImageDraw.Draw(im)
    for cy in range(ROWS):
        for cx in range(COLS):
            if not cell_any[cy, cx]: continue
            colr = mono or palette[cell_cls[cy, cx]]
            for dy in range(4):
                for dx in range(2):
                    if not on[cy*4+dy, cx*2+dx]: continue
                    x0 = cx * CW + dx * P; y0 = cy * CH + dy * P
                    if mode == 'dots':
                        m = P * 0.075; dr.ellipse([x0 + m, y0 + m, x0 + P - m, y0 + P - m], fill=colr)
                    else:
                        dr.rectangle([x0, y0, x0 + P, y0 + P], fill=colr)
    im.save(path)
render(f'{OUT}/preview-{TAG}-dots.png', 'dots')
render(f'{OUT}/preview-{TAG}-pixels.png', 'pixels')
render(f'{OUT}/preview-{TAG}-mono.png', 'dots', mono='#01d68a')
PW, PH = COLS, ROWS * 2
pf = box(fg, (PW, PH)); pcls = np.stack([box(cls == i, (PW, PH)) * WEIGHT.get(n, 1) for i, n in enumerate(names)]).argmax(0)
im = Image.new('RGB', (int(COLS * CW), int(ROWS * CH)), (0, 0, 0)); dr = ImageDraw.Draw(im)
for py in range(PH):
    for px in range(PW):
        if pf[py, px] > 0.5:
            dr.rectangle([px * CW, py * CH / 2, (px + 1) * CW, (py + 1) * CH / 2], fill=palette[pcls[py, px]])
im.save(f'{OUT}/preview-{TAG}-halfblock.png')
Image.fromarray((bg * 255).astype(np.uint8)).resize((W // 4, H // 4)).save(f'{OUT}/mask-bg-{TAG}.png')
print('written', TAG)
