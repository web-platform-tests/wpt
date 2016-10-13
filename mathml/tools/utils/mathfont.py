from __future__ import print_function
import fontforge
from misc import MathMLAssociationCopyright

em = 1000

def create(aName):
    print("Generating %s.woff..." % aName, end="")
    mathFont = fontforge.font()
    mathFont.fontname = aName
    mathFont.familyname = aName
    mathFont.fullname = aName
    mathFont.copyright = MathMLAssociationCopyright
    mathFont.encoding = "UnicodeFull"

    # Create a space character. Also force the creation of some MATH subtables
    # so that OTS will not reject the MATH table.
    g = mathFont.createChar(ord(" "), "space")
    g.width = em
    g.italicCorrection = 0
    g.topaccent = 0
    g.mathKern.bottomLeft = tuple([(0,0)])
    g.mathKern.bottomRight = tuple([(0,0)])
    g.mathKern.topLeft = tuple([(0,0)])
    g.mathKern.topRight = tuple([(0,0)])
    mathFont[ord(" ")].horizontalVariants = "space"
    mathFont[ord(" ")].verticalVariants = "space"
    return mathFont

def drawRectangleGlyph(aGlyph, aWidth, aAscent, aDescent):
    aGlyph.width = aWidth
    p = aGlyph.glyphPen()
    p.moveTo(0, -aDescent)
    p.lineTo(0, aAscent)
    p.lineTo(aWidth, aAscent)
    p.lineTo(aWidth, -aDescent)
    p.closePath();

def createSquareGlyph(aFont, aCodePoint):
    g = aFont.createChar(aCodePoint)
    drawRectangleGlyph(g, em, em, 0)

def createGlyphFromValue(aFont, aCodePoint, aWidth, aValue, aNumberOfBits):
    g = aFont.createChar(aCodePoint)
    g.width = aWidth
    rectangleWidth = g.width / aNumberOfBits
    p = g.glyphPen()
    for i in range(0, aNumberOfBits):
        x = i * rectangleWidth
        y1 = (i % 2) * em / 2
        y1 += (aValue % 2) * em / 4
        y2 = y1 + em / 8
        p.moveTo(x, y1)
        p.lineTo(x, y2)
        p.lineTo(x + rectangleWidth, y2)
        p.lineTo(x + rectangleWidth, y1)
        p.closePath();
        aValue /= 2

    assert aValue == 0, "Not enough bits to encode that value!"

def save(aFont):
    aFont.em = em
    aFont.ascent = aFont.hhea_ascent = aFont.os2_typoascent = em
    aFont.descent = aFont.hhea_descent = aFont.os2_typodescent = 0
    # aFont.os2_winascent, aFont.os2_windescent should be the maximum of
    # ascent/descent for all glyphs. Does fontforge compute them automatically?
    aFont.hhea_ascent_add = aFont.hhea_descent_add = 0
    aFont.os2_typoascent_add = aFont.os2_typodescent_add = 0
    aFont.os2_winascent_add = aFont.os2_windescent_add = 0
    aFont.os2_use_typo_metrics = True
    aFont.generate("../../fonts/math/%s.woff" % aFont.fontname)
    if aFont.validate() == 0:
        print(" done.")
    else:
        print(" validation error!")
        exit(1)
