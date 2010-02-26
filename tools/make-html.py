#!/usr/bin/python

# HTMLMake
# Converts all files of specified extension from XHTML to HTML
# Written by fantasai
# Joint copyright 2010 W3C and Microsoft
# Licensed under BSD 3-Clause: <http://www.w3.org/Consortium/Legal/2008/03-bsd-license>

srcExt = '.xht'
dstExt = '.htm'

import os.path
from lxml import etree
import html5lib # Warning: This uses a patched version of html5lib
from os.path import join, getmtime
import sys
import re
import os

def xhtml2html(source, dest):
    """Convert XHTML file given by path `source` into HTML file at path `dest`."""

    # read and parse
    parser = etree.XMLParser(no_network=True,
                             remove_comments=False,
                             strip_cdata=False,
                             resolve_entities=False)
    tree = etree.parse(source, parser=parser)

    # serialize
    o = html5lib.serializer.serialize(tree, tree='lxml',
                                      format='html',
                                      emit_doctype='html',
                                      resolve_entities=False,
                                      quote_attr_values=True)

    # lxml fixup for eating whitespace outside root element
    m = re.search('<!DOCTYPE[^>]+>(\s*)<', o)
    if m.group(1) == '': # run match to avoid perf hit from searching whole doc
        o = re.sub('(<!DOCTYPE[^>]+>)<', '\g<1>\n<', o)

    # write
    f = open(dest, 'w')
    f.write(o.encode('utf-8'))
    f.close()

if len(sys.argv) < 2 or len(sys.argv) > 3 or \
   (len(sys.argv) == 3 and (sys.argv[1] != '--clobber' or sys.argv[1] == '-f')):
    print "make-html converts all %s XHTML files to %s HTML files." % (srcExt, dstExt)
    print "Only changed files are converted, unless you specify -f."
    print "To use, specify the root directory of the files you want converted, e.g."
    print "  make-html ."
    print "To delete all files with extension %s, specify the --clobber option." % dstExt
    exit()
elif len(sys.argv) > 2:
    clobber = sys.argv[1] == '--clobber'
    force   = sys.argv[1] == '-f'
    root    = sys.argv[2]
else:
    clobber = False;
    force   = False;
    root    = sys.argv[1]

for root, dirs, files in os.walk(root):
    for file in files:
        if clobber:
            if file.endswith(dstExt):
                os.remove(join(root, file))
        elif file.endswith(srcExt):
            source = join(root, file)
            dest = join(root, file[0:-1*len(srcExt)] + dstExt)
            if not os.path.exists(dest) or getmtime(source) > getmtime(dest) or force:
                print "Processing %s\n" % source
                xhtml2html(source, dest)
