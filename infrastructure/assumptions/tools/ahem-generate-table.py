from __future__ import print_function, unicode_literals

import itertools
import unicodedata

from fontTools.ttLib import TTFont

try:
    chr(0x100)
except ValueError:
    chr = unichr

def grouper(n, iterable):
    """
    >>> list(grouper(3, 'ABCDEFG'))
    [['A', 'B', 'C'], ['D', 'E', 'F'], ['G']]
    """
    iterable = iter(iterable)
    return iter(lambda: list(itertools.islice(iterable, n)), [])

ttf = TTFont("../../../fonts/Ahem.ttf")

chars = {char for table in ttf['cmap'].tables for char in table.cmap.keys()}

# exclude chars that can't be represented as HTML numeric character refs
chars = chars - (set(range(0x80, 0x9F+1)) | {0x00})

chars_sorted = sorted(chars)

per_row = 17


doctype = "<!doctype html>"
title = "<title>Ahem checker</title>"
style_open = """
<style>
* {
  padding: 0;
  margin: 0;
  border: none;
}
td {
  width: 34px;
}""".strip()
style_close = "</style>"
style_font_face = """
@font-face {
  font-family: Ahem;
  src: url("../../fonts/Ahem.ttf");
}""".strip()
style_table_with_font = """
table {
  font: 15px/1 Ahem;
  border-collapse: separate;
  border-spacing: 1px;
  table-layout: fixed;
}""".strip()
style_table_no_font = """
table {
  font: 15px/1;
  border-collapse: separate;
  border-spacing: 1px;
  table-layout: fixed;
}""".strip()


def build_link(is_mismatch):
    return ('<link rel="%s" href="ahem-ref.html">' %("mismatch" if is_mismatch else "match"))

def build_header(is_test, is_mismatch):
    rv = [doctype, title]

    if is_test:
        rv.append(build_link(is_mismatch))

    rv.append(style_open)

    if not is_test:
        rv.append(style_font_face)

    if is_mismatch:
        rv.append(style_table_no_font)
    else:
        rv.append(style_table_with_font)

    rv.append(style_close)

    return "\n".join(rv)


def build_table():
    rv = ["\n"]

    rv.append("<table>\n")
    for row in grouper(per_row, chars_sorted):
        rv.append(" " * 4 + "<tr>\n")
        for codepoint in row:
            assert codepoint <= 0xFFFF
            try:
                name = unicodedata.name(chr(codepoint))
            except ValueError:
                rv.append(" " * 8 + "<td>&#x%04X;x <!-- U+%04X -->\n" % (codepoint, codepoint))
            else:
                rv.append(" " * 8 + "<td>&#x%04X;x <!-- U+%04X: %s -->\n" % (codepoint, codepoint, name))
    rv.append("</table>\n")

    return "".join(rv)


with open("../ahem.html", "w") as f1:
    f1.write(build_header(is_test=True, is_mismatch=False))
    f1.write(build_table())

with open("../ahem-mismatch.html", "w") as f1:
    f1.write(build_header(is_test=True, is_mismatch=True))
    f1.write(build_table())

with open("../ahem-ref.html", "w") as f1:
    f1.write(build_header(is_test=False, is_mismatch=False))
    f1.write(build_table())

