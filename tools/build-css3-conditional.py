#!/usr/bin/python
# CSS Conditional Test Suite Build Script
# Copyright 2012 Hewlett-Packard Development Company, L.P.
# Initial code by fantasai, joint copyright 2010 W3C and Microsoft
# Licensed under BSD 3-Clause: <http://www.w3.org/Consortium/Legal/2008/03-bsd-license>

import os.path
skipDirs = ('support')
reftestPath = 'reftest.list'
rawDirs = {'other-formats':'other'}

import sys
from os.path import join, exists, basename
from w3ctestlib.Suite import TestSuite
from w3ctestlib.Indexer import Indexer
from w3ctestlib.Utils import listdirs, listfiles, basepath

# run from css test suite repo root

print "Building CSS Conditional Test Suite from repository %s into %s" % \
      (os.path.abspath('.'), os.path.abspath(os.path.join('.', 'dist', 'css3-conditional')))

unreviewed = sys.argv[1:]
print "Requested unreviewed source directories."

# Set up
suite = TestSuite('css-conditional-3_dev', 'CSS Conditional Module Test Suite', 'http://www.w3.org/TR/css3-conditional/')
suite.setFormats(('html5', 'xhtml1'))

# Add approved tests
root = join('approved', 'css3-conditional', 'src')
dirs = listdirs(root)
for dir in dirs:
  if dir in skipDirs or rawDirs.has_key(dir): continue
  testroot = join(root, dir)
  suite.addTestsByExt(testroot, '.xht')
  suite.addTestsByExt(testroot, '.html')
  if exists(join(testroot, reftestPath)):
    suite.addReftests(testroot, reftestPath)
suite.addTestsByExt(root, '.xht')
suite.addTestsByExt(root, '.html')
if exists(join(root, reftestPath)):
  suite.addReftests(root, reftestPath)
for src, dst in rawDirs.items():
  if exists(join(root,src)):
    suite.addRaw(join(root,src), dst)

# Add unreviewed tests
for path in unreviewed:
  if path.endswith('.list'):
    print "Adding unreviewed reftests from %s" % path
    suite.addReftests(basepath(path), basename(path))
  else:
    def grep(file):
      if not (file.endswith('.xht') or file.endswith('.html')):
        return False
      for line in open(join(path, file)):
        if line.find(suite.specroot) != -1:
          return True
      return False
    files = listfiles(path)
    files = filter(grep, files)
    print "Adding %d unreviewed selftests from %s" % (len(files), path)
    suite.addTestsByList(path, files)

# Build
data = join('approved', 'css3-conditional', 'data')
indexer = Indexer(suite, join(data, 'sections.dat'), True, templatePathList=[data],
                  extraData={ 'devel' : False, 'official' : True })
suite.buildInto(join('dist', 'css3-conditional'), indexer)
