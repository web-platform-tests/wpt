#!/opt/local/bin/python2.6
# CSS 2.1 Test Suite Build Script
# Initial code by fantasai, joint copyright 2010 W3C and Microsoft
# Licensed under BSD 3-Clause: <http://www.w3.org/Consortium/Legal/2008/03-bsd-license>

import os.path
skipDirs = ('support')
reftestPath = 'reftest.list'
rawDirs = {'other-formats':'other'}

import sys
from os.path import join, exists, basename
from CSSTestLib.Suite import CSSTestSuite
from CSSTestLib.Indexer import Indexer
from CSSTestLib.Groups import SelftestGroup
from CSSTestLib.Utils import listdirs, listfiles, basepath

# run from css test suite repo root

print "Building CSS2.1 Test Suite from repository %s into %s" % \
      (os.path.abspath('.'), os.path.abspath(os.path.join('.', 'dist', 'css2.1')))

unreviewed = sys.argv[1:]
print "Requested unreviewed source directories."

# Set up
suite = CSSTestSuite('css2.1', 'CSS2.1 Test Suite', 'http://www.w3.org/TR/CSS21/')

# Add approved tests
root = join('approved', 'css2.1', 'src')
dirs = listdirs(root)
for dir in dirs:
  if dir in skipDirs or rawDirs.has_key(dir): continue
  testroot = join(root, dir)
  suite.addSelftestsByExt(testroot, '.xht')
  if exists(join(testroot, reftestPath)):
    suite.addReftests(testroot, reftestPath)
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
      if not file.endswith('.xht'):
        return False
      for line in open(join(path, file)):
        if line.find(suite.specroot) != -1:
          return True
      return False
    files = listfiles(path)
    files = filter(grep, files)
    print "Adding %d unreviewed selftests from %s" % (len(files), path)
    suite.addSelftestsByList(path, files)

# Build
data = join('approved', 'css2.1', 'data')
indexer = Indexer(suite, join(data, 'sections.dat'), 2, templatePathList=[data],
                  extraData={ 'devel' : False, 'official' : True })
suite.buildInto(join('dist', 'css2.1'), indexer)
