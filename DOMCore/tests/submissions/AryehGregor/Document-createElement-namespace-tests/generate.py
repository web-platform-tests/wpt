#!/usr/bin/python
import os
import sys

THIS_NAME = "generate.py"

FILES = (
    ("empty", ""),
    ("minimal_html", "<!doctype html><title></title>"),

    ("xhtml", '<html xmlns="http://www.w3.org/1999/xhtml"></html>'),
    ("svg", '<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
    ("mathml", '<mathml xmlns="http://www.w3.org/1998/Math/MathML"></mathml>'),

    ("bare_xhtml", "<html></html>"),
    ("bare_svg", "<svg></svg>"),
    ("bare_mathml", "<math></math>"),

    ("xhtml_ns_removed", """\
<html xmlns="http://www.w3.org/1999/xhtml">
  <head><script>
    var newRoot = document.createElementNS(null, "html");
    document.removeChild(document.documentElement);
    document.appendChild(newRoot);
  </script></head>
</html>
"""),
    ("xhtml_ns_changed", """\
<html xmlns="http://www.w3.org/1999/xhtml">
  <head><script>
    var newRoot = document.createElementNS("http://www.w3.org/2000/svg", "abc");
    document.removeChild(document.documentElement);
    document.appendChild(newRoot);
  </script></head>
</html>
"""),
)

EXTENSIONS = ("html", "xhtml", "xml", "svg", "mml")

def __main__():
    if len(sys.argv) > 1:
        print "No arguments expected, aborting"
        return

    if not os.access(THIS_NAME, os.F_OK):
        print "Must be run from the directory of " + THIS_NAME + ", aborting"
        return

    for name in os.listdir("."):
        if name == THIS_NAME:
            continue
        os.remove(name)

    manifest = open("MANIFEST", "w")

    for name, contents in FILES:
        for extension in EXTENSIONS:
            f = open(name + "." + extension, "w")
            f.write(contents)
            f.close()
            manifest.write("support " + name + "." + extension + "\n")

    manifest.close()

__main__()
