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

     The base class implementation performs no conversions or location
     transformations."""

  def __init__(destroot):
    """Creates format root of the output tree. `destroot` is the root
       of the output tree."""
    self.root = destroot
    os.makedirs(self.root)

  def dest(relpath):
    """Returns final destination of relpath in this format."""
    return join(self.root, relpath)

  def write(source):
    """Write FileSource to destination, following all necessary
       conversion methods."""
    destpath = dest(source.relpath)
    source.write(destpath)

class XHTMLFormat(BasicFormat):
  """Base class for XHTML test suite format. Builds into 'xhtml' subfolder of root."""
  def __init__(destroot):
    self.root = join(destroot, 'xhtml')
    os.makedirs(self.root)

  def dest(relpath):
    return join(self.destroot, self.subdir, relpath)

class HTMLFormat(BasicFormat):
  """Base class for HTML test suite format."""
  def __init__(destroot):
    self.root = join(destroot, 'html')
    os.makedirs(self.root)

  def dest(relpath):
    return join(self.root, relpath)

  def write(source):
    if isintance(source, XHTMLSource):
      source.writeHTML(source, self)
    else:
      source.write(source, self)
