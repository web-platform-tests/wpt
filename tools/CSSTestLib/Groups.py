#!/usr/bin/python
# CSS Test Suite Manipulation Library
# Initial code by fantasai, joint copyright 2010 W3C and Microsoft
# Licensed under BSD 3-Clause: <http://www.w3.org/Consortium/Legal/2008/03-bsd-license>

import shutil
import filecmp
import os.path
from os.path import exists, join
from Sources import SourceCache, SourceSet, HTAccessSource

excludeDirs = ['CVS', '.svn', '.hg']

class TestGroup:
  """Base class for test groups. Should never be used directly.
  """

  def __init__(self, sourceCache, importDir, name=None, title=None, supportDirNames=('support',)):
    """Initialize with:
         SourceCache `sourceCache`
         Group name `name`, which must be a possible directory name or None
         Directory path `importDir`, whose context is imported into the group
         Tuple of support directory names `supportDirNames`
    """
    assert exists(importDir), "Directory to import %s does not exist" % importDir

    # Save name
    self.name = name
    self.title = title

    # Load htaccess
    htapath = join(importDir, '.htaccess')
    self.htaccess = HTAccessSource(htapath) if exists(htapath) \
                    else None

    # Load support files
    self.support = SourceSet(sourceCache)
    for supportName in supportDirNames:
      supportDir = join(importDir, supportName)
      if exists(supportDir):
        for (root, dirs, files) in os.walk(supportDir):
          for dir in excludeDirs:
            if dir in dirs:
              dirs.remove(dir)
          for name in files:
            sourcepath = join(root, name)
            relpath = os.path.relpath(sourcepath, importDir)
            self.support.add(sourcepath, relpath)

  def count(self):
    """Returns number of tests.
    """
    return 0

  def merge(self, other):
    """Merge Group `other`'s contents into this Group.
    """
    assert isinstance(other, TestGroup), \
           "Expected Group instance, got %s" % type(other)
    if self.htaccess and other.htaccess:
      self.htaccess.append(other.htaccess)
    elif other.htaccess:
      self.htaccess = other.htaccess
    self.support = SourceSet.combine(self.support, other.support)

  def build(self, format):
    """Build Group's contents through OutputFormat `format`.
    """
    format.setSubDir(self.name)

    # Write .htaccess
    if self.htaccess:
      format.write(self.htaccess)

    # Write support files
    self.support.write(format)

    format.setSubDir()

class SelftestGroup(TestGroup):
  """Class for self-verifying tests.
  """

  def __init__(self, sourceCache, importDir, name=None, title=None, testExt=None, testList=None):
    """Initialize with:
         SourceCache `sourceCache`
         Directory path `importDir`, whose context is imported into the group
         Group name `name`, which must be a possible directory name or None
         File extension `testExt`, e.g. '.xht', which identifies test
           files to import from importDir
         List of test filenames `testList`, which identifies individual test
           files to import from importDir
    """
    TestGroup.__init__(self, sourceCache, importDir, name, title)

    self.tests = SourceSet(sourceCache)
    if testExt:
      _,_,files = os.walk(importDir).next()
      for file in files:
        if file.endswith(testExt):
          self.tests.add(join(importDir, file), file, True)
    if testList:
      for file in testList:
        self.tests.add(join(importDir, file), file, True)

  def count(self):
    """Returns number of tests.
    """
    return len(self.tests)

  def merge(self, other):
    """Merge SelftestGroup `other`'s contents into this SelftestGroup.
    """
    assert isinstance(other, SelftestGroup), \
           "Expected SelftestGroup instance, got %s" % type(other)
    TestGroup.merge(self, other)
    self.tests = SourceSet.combine(self.tests, other.tests)

  def build(self, format):
    """Build Group's contents through OutputFormat `format`.
    """
    TestGroup.build(self, format)
    format.setSubDir(self.name)
    self.tests.write(format)
    format.setSubDir(self.name)

  def iterTests(self):
    return self.tests.iter()
