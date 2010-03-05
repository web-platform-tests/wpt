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

  def __init__(self, destroot, specName=None):
    """Creates format root of the output tree. `destroot` is the root
       of the output tree."""
    self.specName = specName or ''
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

  # def stringTransform(outputString, source) if needed

class XHTMLFormat(BasicFormat):
  """Base class for XHTML test suite format. Builds into 'xhtml1' subfolder of root."""
  formatDirName = 'xhtml1'
  def __init__(self, destroot, specName=None):
    BasicFormat.__init__(self, join(destroot, self.formatDirName), specName)

class XHTMLPrintFormat(BasicFormat):
  """Base class for XHTML Print test suite format. Builds into 'xhtml1print' subfolder of root."""
  formatDirName = 'xhtml1print'
  def __init__(self, destroot, specName=None):
    BasicFormat.__init__(self, join(destroot, self.formatDirName), specName)

  __margin = 'margin: 7%;';
  __font = 'font: italic 8pt sans-serif; color: gray;'
  __css = """
    @page { %s
            %%(margin)s
            counter-increment: page;
            @top-left { content: "%%(specname)s"; }
            @top-right { content: "Test %%(testid)s"; }
            @bottom-right { content: counter(page); }
          }
""" % __font
  __htmlstart = '<p style="%s">Start of %%(specname)s %%(testid)s.</p>' % __font
  __htmlend = '<p style="%s">End of %%(specname)s %%(testid)s.</p>' % __font

  def testTransform(self, outputString, source):
    assert isinstance(source, CSSTestSource):

    headermeta = {'specname' : self.specName,
                  'testid'   : source.name(),
                  'margin'   : '',
                 }
    if re.search('@page\s*{[^}]*@', outputString):
      # Don't use headers and footers when page tests margin boxes
      re.replace('(<body[^>]*>)',
                 '\1\n' + self.__htmlstart % headermeta,
                 outputString);
      re.replace('(</body[^>]*>)',
                 '\1\n' + self.__htmlend % headermeta,
                 outputString);
    else:
      if not re.search('@page', outputString):
        # add margin rule only when @page statement does not exist
        headermeta['margin'] = self.__margin
      }
      re.replace('</title>',
                 '<title>\n  <style type="text/css">%s</style>' % headermeta,
                 outputString);

    return outputString;


class HTMLFormat(BasicFormat):
  """Base class for HTML test suite format. Builds into 'html4' subfolder of root."""
  formatDirName = 'html4'

  def __init__(self, destroot, specName=None):
    BasicFormat.__init__(self, join(destroot, self.formatDirName), specName)

  def write(source):
    if isintance(source, XHTMLSource):
      source.writeHTML(source, self)
    else:
      source.write(source, self)
