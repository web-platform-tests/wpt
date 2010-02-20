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
        print "doctype spacing fix"
        o = re.sub('(<!DOCTYPE[^>]+>)<', '\g<1>\n<', o)

    # write
    f = open(dest, 'w')
    f.write(o.encode('utf-8'))
    f.close()

for root, dirs, files in os.walk('.'):
    for file in files:
        if file.endswith(srcExt):
            source = join(root, file)
            dest = join(root, file[0:-1*len(srcExt)] + dstExt)
            if not os.path.exists(dest) or getmtime(source) > getmtime(dest) \
               or (len(sys.argv) > 1 and sys.argv[1] == '-f'):
                print "Processing %s\n" % source
                xhtml2html(source, dest)


