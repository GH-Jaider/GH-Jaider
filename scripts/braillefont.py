# Builds assets/fonts/BrailleGrid-{Dots,Pixels}.woff2, the braille font behind the fastfetch art.
# Needs a venv with fonttools + brotli:  python3 scripts/braillefont.py assets/fonts
# Builds a braille font whose dots sit on a uniform 0.3em grid: advance 0.6em (2 columns) and
# ascent+descent = 1.2em (4 rows), so at line-height 1.2 the dots of neighbouring cells line up
# exactly, horizontally and vertically. Two flavours: round dots (85% of the pitch) and full pixels.
import math, sys
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

UPM = 1000; ADV = 600; PITCH = 300
XS = [150, 450]; YS = [850, 550, 250, -50]            # ascent 1000, descent -200 -> line box 1200
BITS = [(0,0),(0,1),(0,2),(1,0),(1,1),(1,2),(0,3),(1,3)]  # dot 1..8 -> (col,row)

def build(style, path):
    names = ['.notdef', 'space'] + ['braille%04X' % c for c in range(0x2800, 0x2900)]
    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(names)
    fb.setupCharacterMap({0x20: 'space', **{c: 'braille%04X' % c for c in range(0x2800, 0x2900)}})
    glyphs = {}
    for name in names:
        pen = TTGlyphPen(None)
        if name.startswith('braille'):
            code = int(name[7:], 16) - 0x2800
            for i, (col, row) in enumerate(BITS):
                if not code & (1 << i): continue
                cx, cy = XS[col], YS[row]
                if style == 'dots':
                    rad = PITCH * 0.85 / 2
                    n = 16
                    pts = [(cx + rad * math.cos(2 * math.pi * k / n), cy + rad * math.sin(2 * math.pi * k / n)) for k in range(n)]
                else:
                    hp = PITCH / 2
                    pts = [(cx - hp, cy - hp), (cx - hp, cy + hp), (cx + hp, cy + hp), (cx + hp, cy - hp)]
                pen.moveTo(pts[0])
                for p in pts[1:]: pen.lineTo(p)
                pen.closePath()
        glyphs[name] = pen.glyph()
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics({n: (ADV, 0) for n in names})
    fb.setupHorizontalHeader(ascent=1000, descent=-200, lineGap=0)
    fb.setupNameTable({'familyName': 'Braille Grid', 'styleName': style.capitalize()})
    fb.setupOS2(sTypoAscender=1000, sTypoDescender=-200, sTypoLineGap=0, usWinAscent=1000, usWinDescent=200,
                fsSelection=(1 << 7) | (1 << 6), achVendID='JAID', xAvgCharWidth=ADV, version=4)
    fb.setupPost()
    fb.font.flavor = 'woff2'
    fb.save(path)
    print('wrote', path)

build('dots', sys.argv[1] + '/BrailleGrid-Dots.woff2')
build('pixels', sys.argv[1] + '/BrailleGrid-Pixels.woff2')
