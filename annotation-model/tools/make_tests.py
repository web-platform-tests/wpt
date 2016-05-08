# Copyright (c) 2016 W3C
# Released under the W3C Test Suite License: see LICENSE.txt

# This tool creates .html test files for the WPT harness from corresponding .text
# files that it finds in the tree for this test collection.


import re
import time
import json
import fnmatch
import os
import shutil
import sys

# if '--standalone' in sys.argv:

TESTTREE = '..'
TEMPLATE = 'template'

def simpleEscapeJS(str):
    return str.replace('\\', '\\\\').replace('"', '\\"')

def escapeJS(str):
    str = simpleEscapeJS(str)
    str = re.sub(r'\[(\w+)\]', r'[\\""+(\1)+"\\"]', str) # kind of an ugly hack, for nicer failure-message output
    return str

def escapeHTML(str):
    return str.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')

if len(sys.argv) > 1 and sys.argv[1] == '--test':
    import doctest
    doctest.testmod()
    sys.exit()

# pull in the template

template = open('template').read()

# iterate over the folders looking for .test files

for curdir, subdirList, fileList in os.walk(TESTTREE):
  for file in fnmatch.filter(fileList, "*.test"):
# for each .test file, create a corresponding .html file using template
    theFile = os.path.join(curdir, file)
    testJSON = json.load(open(theFile))
    rfile = re.sub("../", "", file)
    # interesting pattern is {{TESTFILE}}
    tcopy = re.sub("{{TESTFILE}}", rfile, template)

    # target file is basename of theFile + '-manual.html'
    target = re.sub(".test","-manual.html", theFile)

    try:
      out = open(target, "w")
      out.write(tcopy)
      out.close()
    except:
      print("Failed to create "+target)
