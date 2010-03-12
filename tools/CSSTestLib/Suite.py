#!/usr/bin/python
# CSS Test Suite Manipulation Library
# Initial code by fantasai, joint copyright 2010 W3C and Microsoft
# Licensed under BSD 3-Clause: <http://www.w3.org/Consortium/Legal/2008/03-bsd-license>

import OutputFormats
from Groups import SelftestGroup
from Sources import SourceCache

class CSSTestSuite:
  """Representation of a standard CSS test suite."""

  def __init__(self, title, specUri):
    self.title = title
    self.specroot = specUri

    self.stripTestTitlePrefix='CSS Test'
    self.groups = {}
    self.sourcecache = SourceCache()

  def addSelfTestsFromDir(self, dir, ext=None, filenames=None, groupName='', groupTitle=''):
    """Add tests from directory `dir`, either by file extension (via `ext`,
       e.g. ext='.xht') or via file name list (via list `filenames`)."""

    # Create group
    group = SelftestGroup(self.sourcecache,
                          dir, testExt=ext, testList=filenames,
                          name=groupName, title=groupTitle)

    # Add to store
    master = self.groups.get(group.name)
    if master:
      master.merge(group)
    else:
      self.groups[group.name] = group

  def buildInto(self, dest, indexer):
    """Builds test suite through all OutputFormats into directory at path `dest`
       or through OutputFormat destination `dest`, using Indexer `indexer`."""
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
    indexer.writeOverview(dest)
    for format in formats:
      for group in self.groups.itervalues():
        group.write(format)
      indexer.write(format)
