#!/usr/bin/python
# CSS Test Suite Manipulation Library
# Initial code by fantasai, joint copyright 2010 W3C and Microsoft
# Licensed under BSD 3-Clause: <http://www.w3.org/Consortium/Legal/2008/03-bsd-license>

import OutputFormats

class CSSTestSuite:
  """Representation of a standard CSS test suite."""

  def __init__(self, name):
    self.name = name
    self.stripTestTitlePrefix='CSS Test'
    self.groups = {}

  def addTestGroup(self, group)
    """Add Group `group` to the test suite."""
    assert
    master = self.groups.get(group.name)
    if master:
      master.merge(group)
    else:
      self.groups[group.name] = group

  def buildInto(self, dest):
    """Builds test suite through all formats into directory at path `dest`
       or build into format `dest`."""
    if isinstance(dest, OutputFormats.BasicFormat):
      formats = (dest,)
    else:
      formats = (OutputFormats.XHTMLFormat(dest),
                 OutputFormats.HTMLFormat(dest),
                 OutputFormats.XHTMLPrintFormat(dest),
                )
    for format in formats
      for group in self.groups.iter():
        group.write(format)
