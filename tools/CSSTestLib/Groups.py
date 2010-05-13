#!/usr/bin/python
# CSS Test Suite Manipulation Library
# Initial code by fantasai, joint copyright 2010 W3C and Microsoft
# Licensed under BSD 3-Clause: <http://www.w3.org/Consortium/Legal/2008/03-bsd-license>

import shutil
import filecmp
import os.path
from os.path import exists, join, basename
from Sources import SourceCache, SourceSet, ConfigSource, ReftestManifest

excludeDirs = ['CVS', '.svn', '.hg']

class TestGroup:
  """Base class for test groups. Should never be used directly.
  """

  @staticmethod
  def combine(groupA, groupB):
    """Merge TestGroup `groupB` into `groupA`. Return the result of the merge.
       Can accept none as arguments.
    """
    if groupA and groupB:
      groupA.merge(groupB)
    return groupA or groupB

  def __init__(self, sourceCache, importDir, name=None, title=None, **kwargs):
    """Initialize with:
         SourceCache `sourceCache`
         Group name `name`, which must be a possible directory name or None
         Directory path `importDir`, whose context is imported into the group
         Option: Tuple of support directory names `supportDirNames` defaults
                 to ('support',).
    """
    assert exists(importDir), "Directory to import %s does not exist" % importDir

    # Save name
    self.name = name
    self.title = title

    # Load htaccess
    htapath = join(importDir, '.htaccess')
    self.htaccess = ConfigSource(htapath, '.htaccess') \
                    if exists(htapath) else None

    # Load support files
    self.support = SourceSet(sourceCache)
    supportDirNames = kwargs.get('supportDirNames', ('support',))
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

  def sourceCache(self):
    return self.support.sourceCache

  def count(self):
    """Returns number of tests.
    """
    return 0

  def _initFrom(self, group=None):
    """Initialize with data from TestGroup `group`."""
    # copy
    self.name     = group.name if group else None
    self.title    = group.title if group else None
    self.htaccess = group.htaccess if group else None
    self.support  = group.support if group else None

  def merge(self, other):
    """Merge Group `other`'s contents into this Group and clear its contents.
    """
    assert isinstance(other, TestGroup), \
           "Expected Group instance, got %s" % type(other)
    if self.htaccess and other.htaccess:
      self.htaccess.append(other.htaccess)
    elif other.htaccess:
      self.htaccess = other.htaccess
    other.htaccess = None
    self.support = SourceSet.combine(self.support, other.support)
    other.support = None

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
  """Class for groups of self-describing tests.
  """

  def __init__(self, sourceCache, importDir, name=None, title=None, **kwargs):
    """Initialize with:
         SourceCache `sourceCache`
         Directory path `importDir`, whose context is imported into the group
         Group name `name`, which must be a possible directory name or None
         Kwarg: File extension `selfTestExt`, e.g. '.xht', which identifies test
           files to import from importDir
         Kwarg: List of test filenames `selfTestList`, which identifies individual
           test files to import from importDir
    """
    TestGroup.__init__(self, sourceCache, importDir, name, title, **kwargs)
    self.tests = SourceSet(sourceCache)

    # Import tests
    if kwargs.get('selfTestExt'):
      _,_,files = os.walk(importDir).next()
      for file in files:
        if file.endswith(kwargs['selfTestExt']):
          self.tests.add(join(importDir, file), file, True)
    if kwargs.get('selfTestList'):
      for file in kwargs['selfTestList']:
        self.tests.add(join(importDir, file), file, True)

  def count(self):
    """Returns number of tests.
    """
    return len(self.tests)

  def merge(self, other):
    """Merge SelftestGroup `other`'s contents into this SelftestGroup and
       clear `other`'s contents.
    """
    assert isinstance(other, SelftestGroup), \
           "Expected SelftestGroup instance, got %s" % type(other)
    TestGroup.merge(self, other)
    self.tests = SourceSet.combine(self.tests, other.tests)
    other.tests = None

  def build(self, format):
    """Build Group's contents through OutputFormat `format`.
    """
    TestGroup.build(self, format)
    format.setSubDir(self.name)
    self.tests.write(format)
    format.setSubDir(self.name)

  def iterTests(self):
    return self.tests.iter()


class ReftestGroup(TestGroup):
  """Class for groups of reftests.
  """

  def __init__(self, sourceCache, importDir, name=None, title=None, **kwargs):
    """Initialize with:
         SourceCache `sourceCache`
         Directory path `importDir`, whose context is imported into the group
         Group name `name`, which must be a possible directory name or None
         Kwarg: File path manifestPath relative to `importDir` that
           identifies the reftest manifest file (usually called 'reftest.list').
         Kwarg: File path manifestDest as destination (relative) path for
                the reftest manifest file. Defaults to value of manifestPath.
         ReftestGroup assumes that only the files listed in the manifest,
         the .htaccess files in its parent directory, and the `importDir`'s
         .htaccess file and support directory are relevant to the test suite.
    """
    TestGroup.__init__(self, sourceCache, importDir, name, title, **kwargs)

    self.tests = SourceSet(sourceCache)
    self.refs  = SourceSet(sourceCache)

    # Read manifest
    manifestPath = kwargs['manifestPath']
    manifestDest = kwargs.get('manifestDest', manifestPath)
    self.manifest = ReftestManifest(join(importDir, manifestPath), manifestDest)

    # Import tests
    for (testsrc, refsrc), (testrel, refrel) in self.manifest:
      test = self.tests.add(testsrc, testrel, True)
      ref = self.refs.add(refsrc, refrel, False)
      test.setReftest(ref)

  def merge(self, other):
    """Merge ReftestGroup `other`'s contents into this ReftestGroup and
       clear `other`'s contents.
    """
    assert isinstance(other, ReftestGroup), \
           "Expected ReftestGroup instance, got %s" % type(other)
    TestGroup.merge(self, other)
    self.tests = SourceSet.combine(self.tests, other.tests)
    other.tests = None
    self.refs  = SourceSet.combine(self.refs, other.refs)
    other.refs = None
    if self.manifest and other.manifest:
      self.manifest.append(other.manifest)
    else:
      self.manifest = self.manifest or other.manifest
    other.manifest = None

  def build(self, format):
    """Build Group's contents through OutputFormat `format`.
    """
    TestGroup.build(self, format)
    format.setSubDir(self.name)
    self.tests.write(format)
    self.refs.write(format)
    if self.manifest:
      format.write(self.manifest)
    format.setSubDir(self.name)

  def count(self):
    """Returns number of tests.
    """
    return len(self.tests)

  def iterTests(self):
    return self.tests.iter()

class CSSTestGroup(ReftestGroup, SelftestGroup):
  """Class for combined groups of reftests and self-describing tests.
  """

  def __init__(self, group):
    """Initialize by absorbing ReftestGroup or SelftestGroup `group`'s data.
       Caller must drop references to `group` after this.
    """
    TestGroup._initFrom(self, group)
    self.tests = group.tests \
                 if hasattr(group, "tests") else SourceSet(self.sourceCache())
    self.refs = group.refs \
                if hasattr(group, "refs") else SourceSet(self.sourceCache())
    self.manifest = group.manifest \
                    if hasattr(group, "manifest") else None

  def merge(self, other):
    """Merge TestGroup `other`'s contents into this CSSTestGroup.
       Caller must drop references to `group` after this.
    """
    if isinstance(other, ReftestGroup):
      ReftestGroup.merge(self, other)
    elif isinstance(other, SelftestGroup):
      SelftestGroup.merge(self, other)
    else:
      TestGroup.merge(self, other)

  # Other methods identical to ReftestGroup
