#!/opt/local/bin/python2.6
# CSS Test Source Manipulation Library
# Initial code by fantasai, joint copyright 2010 W3C and Microsoft
# Licensed under BSD 3-Clause: <http://www.w3.org/Consortium/Legal/2008/03-bsd-license>

import re
import os
from os.path import join, exists, splitext, dirname
from Sources import CSSTestSource, XHTMLSource

class ExtensionMap:
  """ Given a file extension mapping (e.g. {'.xht' : '.htm'}), provides
      a translate function for paths.
  """
  def __init__(self, extMap):
    self.extMap = extMap

  def translate(self, path):
    for ext in self.extMap:
      if path.endswith(ext):
        return splitext(path)[0] + self.extMap[ext]
    return path

class BasicFormat:
  """Base class. A Format manages all the conversions and location
     transformations (e.g. subdirectory for all tests in that format)
     associated with a test suite format.

     The base class implementation performs no conversions or
     format-specific location transformations."""
  formatDirName = None
  indexExt      = '.html'

  def __init__(self, destroot, extMap=None):
    """Creates format root of the output tree. `destroot` is the root path
       of the output tree.

       extMap provides a file extension mapping, e.g. {'.xht' : '.htm'}
    """
    self.root = destroot
    if not exists(self.root):
      os.makedirs(self.root)
    self.extMap = ExtensionMap(extMap or {})
    self.subdir = None

  def setSubDir(self, name=None):
    """Sets format to write into group subdirectory `name`.
    """
    self.subdir = name

  def dest(self, relpath):
    """Returns final destination of relpath in this format and ensures that the
       parent directory exists."""
    # Translate path
    dest = join(self.root, self.subdir, relpath) if self.subdir \
           else join(self.root, relpath)
    # Ensure parent
    parent = dirname(dest)
    if not exists(parent):
      os.makedirs(parent)

    return dest

  def write(self, source):
    """Write FileSource to destination, following all necessary
       conversion methods."""
    source.write(self, source)

  testTransform = False
  # def testTransform(self, outputString, source) if needed

class XHTMLFormat(BasicFormat):
  """Base class for XHTML test suite format. Builds into 'xhtml1' subfolder
     of root.
  """
  formatDirName = 'xhtml1'
  indexExt      = '.xht'

  def __init__(self, destroot, extMap=None):
    BasicFormat.__init__(self, join(destroot, self.formatDirName), extMap)
  def write(self, source):
    # skip HTMLonly tests
    if hasattr(source, 'hasFlag') and source.hasFlag('HTMLonly'):
      return
    source.write(self)

class HTMLFormat(BasicFormat):
  """Base class for HTML test suite format. Builds into 'html4' subfolder
     of root.
  """
  formatDirName = 'html4'

  def __init__(self, destroot, extMap=None):
    if not extMap:
      extMap = {'.xht' : '.htm', '.xhtml' : '.html' }
    BasicFormat.__init__(self, join(destroot, self.formatDirName), extMap)

  def dest(self, relpath):
    return BasicFormat.dest(self, self.extMap.translate(relpath))

  def write(self, source):
    # skip nonHTML tests
    if hasattr(source, 'hasFlag') and source.hasFlag('nonHTML'):
      return
    if isinstance(source, XHTMLSource):
      source.write(self, source.serializeHTML())
    else:
      source.write(self)


class XHTMLPrintFormat(XHTMLFormat):
  """Base class for XHTML Print test suite format. Builds into 'xhtml1print'
     subfolder of root.
  """
  formatDirName = 'xhtml1print'

  def __init__(self, destroot, testSuiteName, extMap=None):
    BasicFormat.__init__(self, join(destroot, self.formatDirName), extMap)
    self.testSuiteName = testSuiteName

  def write(self, source):
    if source.isTest:
      if not source.hasFlag('HTMLonly'):
        source.write(self, self.testTransform(source))
    else:
      XHTMLFormat.write(self, source)

  def testTransform(self, source):
    assert isinstance(source, CSSTestSource)
    output = source.serializeXHTML()

    headermeta = {'suitename' : self.testSuiteName,
                  'testid'    : source.name(),
                  'margin'    : '',
                 }
    if re.search('@page\s*{[^}]*@', output):
      # Don't use headers and footers when page tests margin boxes
      output = re.sub('(<body[^>]*>)',
                      '\1\n' + self.__htmlstart % headermeta,
                      output);
      output = re.sub('(</body[^>]*>)',
                      '\1\n' + self.__htmlend % headermeta,
                      output);
    else:
      # add margin rule only when @page statement does not exist
      if not re.search('@page', output):
        headermeta['margin'] = self.__margin
      output = re.sub('</title>',
                      '</title>\n  <style type="text/css">%s</style>' % \
                        (self.__css % headermeta),
                      output);
    return output;

  # template bits
  __margin = 'margin: 7%;';
  __font = 'font: italic 8pt sans-serif; color: gray;'
  __css = """
    @page { %s
            %%(margin)s
            counter-increment: page;
            @top-left { content: "%%(suitename)s"; }
            @top-right { content: "Test %%(testid)s"; }
            @bottom-right { content: counter(page); }
          }
""" % __font
  __htmlstart = '<p style="%s">Start of %%(suitename)s %%(testid)s.</p>' % __font
  __htmlend = '<p style="%s">End of %%(suitename)s %%(testid)s.</p>' % __font

