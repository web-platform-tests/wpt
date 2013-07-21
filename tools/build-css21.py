#!/usr/bin/python
# CSS 2.1 Test Suite Build Script
# Initial code by fantasai, joint copyright 2010 W3C and Microsoft
# Licensed under BSD 3-Clause: <http://www.w3.org/Consortium/Legal/2008/03-bsd-license>

import os.path
skipDirs = ('support')
reftestPath = 'reftest.list'
rawDirs = {'other-formats':'other'}

import sys
import shutil
from os.path import join, exists, basename
from w3ctestlib.Suite import TestSuite
from w3ctestlib.Indexer import Indexer
from w3ctestlib.Utils import listdirs, listfiles, basepath

def debugHook(type, value, tb):
   if hasattr(sys, 'ps1') or not sys.stderr.isatty():
      # we are in interactive mode or we don't have a tty-like
      # device, so we call the default hook
      sys.__excepthook__(type, value, tb)
   else:
      import traceback, pdb
      # we are NOT in interactive mode, print the exception...
      traceback.print_exception(type, value, tb)
      print
      # ...then start the debugger in post-mortem mode.
      pdb.pm()

# run from css test suite repo root

sourcePath = '.'
suiteName = 'css2.1'
distPath = join('dist', suiteName)
buildPath = 'build'

print "Building CSS2.1 Test Suite from repository %s into %s" % \
      (os.path.abspath(sourcePath), os.path.abspath(distPath))

unreviewed = sys.argv[1:]
print "Requested unreviewed source directories."

# Set up
suite = TestSuite('css21_dev', 'CSS2.1 Test Suite', 'http://www.w3.org/TR/CSS21/')

# Add approved tests
root = join('approved', 'css2.1', 'src')
dirs = listdirs(root)
for dir in dirs:
  if dir in skipDirs or rawDirs.has_key(dir): continue
  testroot = join(root, dir)
  suite.addTestsByExt(testroot, '.xht')
  if exists(join(testroot, reftestPath)):
    suite.addReftests(testroot, reftestPath)
suite.addTestsByExt(root, '.xht')
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
#sys.excepthook = debugHook

data = join('approved', 'css2.1', 'data')
indexer = Indexer(suite, join(data, 'sections.dat'), True, templatePathList=[data],
                  extraData={ 'devel' : False, 'official' : True })
print "Building"
shutil.rmtree(buildPath, True)
os.makedirs(buildPath)
suite.buildInto(buildPath, indexer)

print "Moving output to " + distPath
shutil.rmtree(distPath, True)
os.makedirs(distPath) # ensure parent directories exist
shutil.rmtree(distPath)
os.rename(buildPath, distPath)

