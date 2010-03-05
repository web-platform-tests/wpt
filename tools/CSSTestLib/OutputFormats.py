#!/usr/bin/python
# CSS Test Source Manipulation Library
# Initial code by fantasai, joint copyright 2010 W3C and Microsoft
# Licensed under BSD 3-Clause: <http://www.w3.org/Consortium/Legal/2008/03-bsd-license>

import shutils
import os
from os.path import join, exists

class BasicFormat:
  """Base class. A Format manages all the conversions and location
     transformations (e.g. subdirectory for all tests in that format)
     associated with a test suite format.

     The base class implementation performs no conversions or
     format-specific location transformations."""

  def __init__(self, destroot):
    """Creates format root of the output tree. `destroot` is the root
       of the output tree."""
    self.root = destroot
    os.makedirs(self.root)
    self.groupName = None

  def setGroupDir(self, name=None):
    """Sets format to write into group subdirectory `name`.
    """
    self.groupName = name

  def dest(self, relpath):
    """Returns final destination of relpath in this format."""
    if self.groupName:
      return join(self.root, self.groupName, relpath)
    else
      return join(self.root, relpath)

  def write(self, source):
    """Write FileSource to destination, following all necessary
       conversion methods."""
    destpath = dest(source.relpath)
    source.write(destpath)

class XHTMLFormat(BasicFormat):
  """Base class for XHTML test suite format. Builds into 'xhtml' subfolder of root."""
  formatDirName = 'xhtml1'
  def __init__(self, destroot):
    BasicFormat.__init__(self, join(destroot, self.formatDirName))

class HTMLFormat(BasicFormat):
  """Base class for HTML test suite format."""
  formatDirName = 'html4'

  def __init__(self, destroot):
    BasicFormat.__init__(self, join(destroot, self.formatDirName))

  def write(source):
    if isintance(source, XHTMLSource):
      source.writeHTML(source, self)
    else:
      source.write(source, self)
