#!/usr/bin/python
# CSS Test Suite Manipulation Library
# Initial code by fantasai, joint copyright 2010 W3C and Microsoft
# Licensed under BSD 3-Clause: <http://www.w3.org/Consortium/Legal/2008/03-bsd-license>

import shutil
import filecmp
import os.path
from os.path import exists, join
from Sources import SourceCache, SourceSet

class Group:
  """Base class for test groups. Should never be used directly.
  """

  def __init__(self, sourceCache, importDir, name=None, supportDirNames=('support',)):
    """Initialize with:
         SourceCache `sourceCache`
         Group name `name`, which must be a possible directory name or None
         Directory path `importDir`, whose context is imported into the group
         Tuple of support directory names `supportDirNames`
    """
    # Save name
    self.name = name

    # Load htaccess
    htapath = join(importDir, '.htaccess')
    if exists(htapath):
      self.htaccess = open(htapath).read()
    else:
      self.htaccess = ''

    # Load support files
    self.support = SourceSet(sourceCache)
    for supportName in supportDirNames:
      supportDir = join(importDir, supportName)
      if exists(supportDir):
        for (root, dirs, files) in os.walk(supportDir):
          for name in files:
            sourcepath = join(root, name)
            relpath = os.path.relpath(sourcepath, importDir)
            self.support.add(sourcepath, relpath)

  def merge(self, other):
    """Merge Group `other`'s contents into this Group.
    """
    assert isinstance(other, Group),
           "Expected Group instance, got %s" % type(other)
    self.htaccess += '\n' + '#' * 72 + '\n' # add a divider
    self.support = SourceSet.merge(self.support, other.support)

  def build(self, format):
    """Build Group's contents through OutputFormat `format`.
    """
    format.setGroup(self.name)

    # Write .htaccess
    f = open(format.dest('.htaccess'))
    f.write(self.htaccess)
    f.close()

    # Write support files
    self.support.write(format)

    format.setGroup()

class SelftestGroup(Group):
  """Class for self-verifying tests.
  """

  def __init__(self, sourceCache, importDir, name=None, testExt=None, testList=None):
    """Initialize with:
         SourceCache `sourceCache`
         Directory path `importDir`, whose context is imported into the group
         Group name `name`, which must be a possible directory name or None
         File extension `testExt`, e.g. '.xht', which identifies test
           files to import from importDir
         List of test filenames `testList`, which identifies individual test
           files to import from importDir
    """
    TestGroup.__init__(self, sourceCache, name, importDir)

    self.tests = SourceSet(sourceCache)
    if testExt:
      ,,files = os.walk(importDir)
      for file in files:
        if file.endswith(testExt):
          self.tests.add(join(importDir, file), file, True)
    if testList:
      for file in testList:
        self.tests.add(join(importDir, file), file, True)

  def merge(self, other):
    """Merge SelftestGroup `other`'s contents into this SelftestGroup.
    """
    assert isinstance(other, SelftestGroup),
           "Expected SelftestGroup instance, got %s" % type(other)
    Group.merge(self, other)
    self.tests = SourceSet.merge(self.tests, other.tests)

  def write(self, format):
    """Build Group's contents through OutputFormat `format`.
    """
    Group.build(self, format)
    format.setGroup(self.name)
    self.tests.write(format)
    format.setGroup(self.name)
