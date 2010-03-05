#!/usr/bin/python
# CSS Test Suite Manipulation Library
# Initial code by fantasai, joint copyright 2010 W3C and Microsoft
# Licensed under BSD 3-Clause: <http://www.w3.org/Consortium/Legal/2008/03-bsd-license>

import shutil
import filecmp
import os.path
from os.path import exists, join

def testName(filepath):
  """Returns base name (without extenion)."""
  return re.match('([^/\.])+(?:\.[a-z0-9])*', os.path.basename(filepath)).groups(1)

class TestGroup:
  """Struct representing a group of tests in a test suite.

     A TestGroup has the following public data members:
      - name     (string)
      - tests    (map of test base names to test data)
     It also has some convenience methods to keep track of
     information about the tests' context, such as .htaccess file
     and support files.
  """

  def __init__(name, tests):
    """Initialize TestGroup with name `name` (which may be None) and
       self.tests initial value `tests`.

       If `name` is given, it must be valid as a directory name or path
       on the system.
    """
    self.name = name
    self.tests = tests
    self._support = {} # map of support subdir names to:
                       #   map of support-relative file paths to real file paths
    self._htaccess = [] # list of htaccess files to be merged for tests

  def loadContext(self, testDir, supportDirNames=('support')):
    """Loads test context for testDir: testDir/.htaccess, and
       the contents of any subdirectories that are named in
       the supportDirNames argument.
    """
    if exists(join(testDir, '.htaccess')):
      self.addHTAccess(join(testDir, '.htaccess'))

    for supportName in supportDirNames:
      supportDir = join(testDir,supportName)
      if exists(supportDir):
        self.addSupport(supporDir, supportName)

  def addSupport(self, supportDir, supportName='support'):
    """Validates support directory contents and appends to
       supportName group.

       Raises Exception if two files with the same name conflict.
    """
    supportFilemap = self._support[supportName]
    for (root, dirs, files) in os.walk(supportDir):
      for name in files:
        filepath = join(root, name)
        relpath = relpath(filepath, supportDir)
        if relpath not in supportFilemap:
          supportFilemap[relpath] = filepath
        elif not filecmp.cmp(filepath,supportFilemap[relpath]):
          raise Exception("Support file mismatch: %s vs %s" % \
                          supportFilemap[relpath], filepath))

  def addHTAccess(self, filename):
    """Append contents of htaccess.
    """
    self._htaccess.append(filename)

  def __mergeHTA(base, addFile)
    """Append contents of htaccess file `addfile` to string `base`.
    """
    f = open(addFile)
    write.append('\n# Contents of %s #\n' % addFile)
    write.append(f.read())
    f.close()
  __mergeHTA = staticmethod(__mergeHTA)

  def buildContext(self, destDir, conversionTable=False):
    """Build context of TestGroup into destDir. If TestGroup has a name,
       this will create a subdirectory for TestGroup's contents.
       Returns destination directory for tests (either destDir, or the
       subdirectory).
       A `conversionTable` can be passed in to convert support files
       that need conversion. A conversion table is a mapping from a
       source file extension to a tuple consisting of the destination
       file extension and a conversion function that takes the
       source filepath and destination filepath as its first and
       second arguments. For example,
         conversionTable = { '.xht' : (htmlize, '.htm'),
                             '.png' : (jpgize, '.jpg') }
       where def htmlize(sourcepath, destpath). The conversion function
       *must not* alter the source file: it should only write to destpath.
       An exception is raised if the conversion would overwrite another
       support file.
    """
    # Determine output directory
    if self.name:
      destDir = join(destDir, self.name)
    else:
      destDir = destDir
    if not exists(destDir):
      os.makedirs(destDir)

    # Output .htaccess
    htaccess = '# Merged htaccess for test group %s#\n' % name
    for file in self._htaccess:
      __mergeHTA(htaccess, file)
    f = open(join(destDir, '.htaccess'))
    f.write(htaccess)
    f.close()

    # Output support files
    for (supportName, supportMap) in self._support.items():
      for (relpath, sourcepath) in supportMap:
        destpath = join(destDir, supportName, relpath)
        if conversionTable:
          destbase, ext = os.path.splitext(destpath)
          conversion = conversionTable[ext]
          if ext:
            conversion[0](sourcepath, destbase + conversion[1])
        shutil.copy(sourcepath, destpath)

    return destDir
