#!/usr/bin/python
# CSS Test Suite Manipulation Library
# Initial code by fantasai, joint copyright 2010 W3C and Microsoft
# Licensed under BSD 3-Clause: <http://www.w3.org/Consortium/Legal/2008/03-bsd-license>

import OutputFormats
import Utils
from Groups import CSSTestGroup, SelftestGroup, ReftestGroup, excludeDirs
from Sources import SourceCache
from shutil import copytree, rmtree
from os.path import join
import os

class CSSTestSuite:
  """Representation of a standard CSS test suite."""

  def __init__(self, name, title, specUri):
    self.name = name
    self.title = title
    self.specroot = specUri

    self.stripTestTitlePrefix=['CSS Test', 'CSS2.1 Test Suite']
    self.defaultReftestRelpath='reftest.list'
    self.groups = {}
    self.sourcecache = SourceCache()
    self.formats = ('html4', 'xhtml1') # FIXME, hardcoded list is lame
    self.rawgroups = {}

  def addSelftestsByExt(self, dir, ext, groupName='', groupTitle=''):
    """Add tests from directory `dir` by file extension (via `ext`, e.g. ext='.xht').
    """
    group = SelftestGroup(self.sourcecache, dir, selfTestExt=ext,
                          name=groupName, title=groupTitle)
    self.addGroup(group)


  def addSelftestsByList(self, dir, filenames, groupName='', groupTitle=''):
    """Add tests from directory `dir`, via file name list `filenames`.
    """
    group = SelftestGroup(self.sourcecache, dir, selfTestList=filenames,
                          name=groupName, title=groupTitle)
    self.addGroup(group)

  def addReftests(self, dir, manifestPath, groupName='', groupTitle=''):
    """Add tests by importing context of directory `dir` and importing all
       tests listed in the `reftestManifestName` manifest inside `dir`.
    """
    group = ReftestGroup(self.sourcecache,
                         dir, manifestPath=manifestPath,
                         manifestDest=self.defaultReftestRelpath,
                         name=groupName, title=groupTitle)
    self.addGroup(group)

  def addGroup(self, group):
    """ Add CSSTestGroup `group` to store. """
    master = self.groups.get(group.name)
    if master:
      master.merge(group)
    else:
      self.groups[group.name] = CSSTestGroup(group)

  def addRaw(self, dir, relpath):
    """Add the contents of directory `dir` to the test suite by copying
       (not processing). Note this means such tests will not be indexed.
       `relpath` gives the directory's path within the build destination.
    """
    self.rawgroups[dir] = relpath

  def buildInto(self, dest, indexer):
    """Builds test suite through all OutputFormats into directory at path `dest`
       or through OutputFormat destination `dest`, using Indexer `indexer`.
    """
    if isinstance(dest, OutputFormats.BasicFormat):
      formats = (dest,)
      dest = dest.root
    else:
      formats = (OutputFormats.XHTMLFormat(dest),
                 OutputFormats.HTMLFormat(dest),
                 OutputFormats.XHTMLPrintFormat(dest, self.title),
                )

    for group in self.groups.itervalues():
      indexer.indexGroup(group)

    for format in formats:
      for group in self.groups.itervalues():
        group.build(format)
      indexer.writeIndex(format)

    rawtests = []
    for src, relpath in self.rawgroups.items():
      copytree(src, join(dest,relpath))
      for (root, dirs, files) in os.walk(join(dest,relpath)):
        for xdir in excludeDirs:
          if xdir in dirs:
            dirs.remove(xdir)
            rmtree(join(root,xdir))
        rawtests.extend(
          [join(Utils.relpath(root,dest),file)
           for file in files]
        )

    rawtests.sort()
    indexer.writeOverview(dest, addTests=rawtests)
    
