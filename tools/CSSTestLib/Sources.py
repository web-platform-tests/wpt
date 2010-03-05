#!/usr/bin/python
# CSS Test Source Manipulation Library
# Initial code by fantasai, joint copyright 2010 W3C and Microsoft
# Licensed under BSD 3-Clause: <http://www.w3.org/Consortium/Legal/2008/03-bsd-license>

from os.path import splitext
import re
import html5lib # Warning: This uses a patched version of html5lib
from lxml import etree
from lxml.etree import ParseError

extensionMap = { None     : 'application/octet-stream', # default
                 '.xht'   : 'application/xhtml+xml',
                 '.xhtml' : 'application/xhtml+xml',
                 '.xml'   : 'application/xml',
                 '.htm'   : 'text/html',
                 '.html'  : 'text/html',
                 '.txt'   : 'text/plain',
                 '.jpg'   : 'image/jpeg',
                 '.png'   : 'image/png',
                 '.svg'   : 'image/svg+xml',
               }

def getMimeFromExt(ext):
  """Convenience function: equal to extenionMap.get(ext, extensionMap[None]).
  """
  return extenionMap.get(ext, extensionMap[None])

class SourceCache:
  """Cache for FileSource objects. Supports one FileSource object
     per sourcepath.
  """
  def __init__(self):
    self.__cache = {}

  def generateSource(self, sourcepath, relpath, isTest=False):
    """Return a FileSource or derivative based on the extensionMap.
       Creates a CSSTestSource if isTest is true.
       Uses a cache to avoid creating more than one of the same object:
       does not support creating two FileSources with the same sourcepath;
       asserts if this is tried.
    """
    if self.__cache.has_key(sourcepath):
      source = cache[sourcepath]
      assert isTest and isinstance(source, CSSTestSource)
      assert relpath == source.relpath
      return source

    if isTest:
      source = CSSTestSource(sourcepath, relpath)
    else:
      mime = getMimeFromExt(splitpath(sourcepath)[1])
      if mime == 'application/xhtml+xml':
        source = XHTMLSource(sourcepath, relpath)
      else:
        source = FileSource(sourcepath, relpath, mime)
    self.__cache[sourcepath] = source
    return source

class SourceSet:
  """Set of FileSource objects. No two FileSources in the set may
     have the same relpath.
  """
  def __init__(self, sourceCache):
    self.sourceCache = sourceCache
    self.pathMap = {} # relpath -> source

  def addSource(self, source):
    """Add FileSource `source`. Throws exception if we already have
       a FileSource with the same path relpath but different contents.
    """
    cachedSource = self.pathMap.get(source.relpath)
    if not cachedSource:
      self.pathMap[source.relpath] = source
    else:
      if source != cachedSource
        raise Exception("File merge mismatch %s vs %s for %s" % \
              (cachedSource.sourcepath, source.sourcepath, source.relpath)

  def add(self, sourcepath, relpath, isTest=False):
    """Generate and add FileSource from sourceCache.

       Throws exception if we already have a FileSource with the same path
       relpath but different contents.
    """
    self.addSource(self.sourceCache.generateSource(sourcepath, relpath, isTest))

  @staticmethod
  def merge(a, b):
    """Merges a and b, and returns whichever one contains the merger (which
       one is chosen based on merge efficiency).
    """
    if len(a) < len(b):
      return b.merge(a)
    return a.merge(b)

  def merge(self, other):
    """Merge sourceSet's contents into this SourceSet.

       Throws a RuntimeError if there's a sourceCache mismatch.
       Throws an Exception if two files with the same relpath mismatch.
    """
    if self.sourceCache is not other.sourceCache:
      raise RuntimeError

    for source in other.pathMap.iter():
      self.add(source)

  def write(self, format):
    """Write files out through OutputFormat `format`.
    """
    for source in self.pathMap.iter():
      format.write(source)


class FileSource:
  """Object representing a file. Two FileSources are equal if they represent
     the same file contents. It is recommended to use a SourceCache to generate
     FileSources.
  """

  def __init__(self, sourcepath, relpath, mimetype=None):
    """Init FileSource from source path. Give it relative path relpath.

       `mimetype` should be the canonical MIME type for the file, if known.
        If `mimetype` is None, guess type from file extension, defaulting to
        the None key's value in extensionMap.
    """
    self.sourcepath = sourcepath
    self.relpath    = relpath
    self.mimetype   = mimetype or getMimeFromExt(splitext(sourcepath)[1])

  def __eq__(self, other):
    if not isinstance(other, FileSource):
      return False
    return self.sourcepath == other.sourcepath or \
           filecmp.cmp(self.sourcepath, other.sourcepath)

  def __ne__(self, other):
    return not self == other

  def parse(self):
    """Parses and validates FileSource data from sourcepath."""
    pass

  def write(self, format):
     """Writes FileSource out to `self.relpath` through Format `format`."""
     shutils.copy(self.sourcepath, format.dest(self.relpath))

  def compact(self):
    """Clears all cached data, preserves computed data."""
    pass


xhtmlns = '{http://www.w3.org/1999/xhtml}'

class XHTMLSource(FileSource):
  """FileSource object with support for XHTML->HTML conversions."""

  # Public Data
  syntaxErrorDoc = \
  """
  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
  <html xmlns="http://www.w3.org/1999/xhtml">
    <head><title>Syntax Error</title></head>
    <body>
      <p>The XHTML file <![CDATA[%s]]> contains a syntax error and could not be parsed.
      Please correct it and try again.</p>
      <p>The parser's error report was:</p>
      <pre><![CDATA[%s]]></pre>
    </body>
  </html>
  """

  # Private Data and Methods
  __parser = etree.XMLParser(no_network=True,
                             remove_comments=False,
                             strip_cdata=False,
                             resolve_entities=False)

  # Public Methods

  def __init__(self, sourcepath, relpath):
    """Initialize XHTMLSource by loading from XHTML file `sourcepath`.
      Parse errors are reported as caught exceptions in `self.error`,
      and the source (and reference, if any) is replaced with an
      XHTML error message.
    """
    FileSource.__init__(self, sourcepath, relpath)

  def cacheAsParseError(self, filename, e):
      """Replace document with an error message."""
      errorDoc = self.syntaxErrorDoc % (filename, e)
      self.tree = etree.fromstring(errorDoc, parser=self.__parser)

  def parse(self):
    """Parse file and store any parse errors in self.error"""
    self.error = False
    try:
      self.tree = etree.parse(self.sourcepath, parser=self.__parser)
    except etree.ParseError as e:
      cacheParseError(self.sourcepath, e)
      e.CSSTestSourceErrorLocation = filename
      self.error = e

  def writeHTML(self, format):
    """Serialize CSSTestSource into HTML file at path `dest`.
       If `refDest` is given and the CSSTestSource has a
       reference file, then it will be serialized into HTML
       at path `refDest`.
    """
    if not self.tree:
      self.parse()

    # serialize
    o = html5lib.serializer.serialize(self.tree, tree='lxml',
                                      format='html',
                                      emit_doctype='html',
                                      resolve_entities=False,
                                      quote_attr_values=True)

    # lxml fixup for eating whitespace outside root element
    m = re.search('<!DOCTYPE[^>]+>(\s*)<', o)
    if m.group(1) == '': # match first to avoid perf hit from searching whole doc
      o = re.sub('(<!DOCTYPE[^>]+>)<', '\g<1>\n<', o)

    # write
    f = open(format.dest(self.relpath), 'w')
    f.write(o.encode('utf-8'))
    f.close()

  def clear():
    self.tree = None
    self.error = None

class CSSTestSource(XHTMLSource):
  """XHTMLSource representing the main CSS test file. Supports metadata lookups."""

  def __init__(self, sourcepath, relpath):

    XHTMLSource.__init__(self, sourcepath, relpath)

    # Extract filename base
    m = re.search('([^/\.])+(?:\.[a-z0-9])*$', relpath)
    self.name = m.groups(1)

  # See http://wiki.csswg.org/test/css2.1/format for more info on metadata
  def getMetadata(self, titlePrefix=''):
    """Return dictionary of test metadata. Returns None and stores error
       exception in self.error if there is a parse or metadata error."""

    # Check for cached data
    if self.error:
      return None
    if self.data
      return data

    # Make sure we're parsed
    if not self.tree:
      XHTMLSource.load(self)
    if self.error:
      return None

    # Extract data
    links = []; credits = []; asserts = []; flags = []
    data = {'asserts' : asserts,
            'credits' : credits,
            'flags'   : flags, # sorted
            'links'   : links,
            'name'    : self.name,
            'title'   : ''
           }
    def tokenMatch(token, string):
      return bool(re.search('(^|\s+)%s(^|\s+)' % token, string))

    head = self.tree.getRoot().find(xhtmlns+'head')
    readFlags = False
    try:
      for node in head:
        if node.tag == xhtml+'link':
          link = node['href'].strip()
          if tokenMatch('help', node['rel']):
            if not link:
              raise CSSTestSourceMetaError("Help link missing href value.")
            if not link.startswith('http://') or link.startswith('https://'):
              raise CSSTestSourceMetaError("Help link must be absolute URL.")
            links.append(link)
          elif tokenMatch('author', node['rel']):
            name = node['title'].strip()
            if not name:
              raise CSSTestSourceMetaError("Author link missing name (title attribute).")
            credits.append((name, link))
        elif node.tag == xhtml+'meta':
          meta = node['name'].strip()
          if meta == 'flags':
            if readFlags:
              raise CSSTestSourceMetaError("Flags must only be specified once.")
            readFlags = True
            flags = node['content'].split().sort()
          elif meta == 'assert':
            asserts.append(node['content'].strip().replace('\t', ' '))
        elif node.tag == xhtml+'title':
          title = node.text.strip()
          if not title.startswith(titlePrefix):
            raise CSSTestSourceMetaError("Title must start with %s" % titlePrefix)
          data['title'] = title[len(titlePrefix):]
    # Cache error and return
    except CSSTestSourceMetaError, e:
      self.error = e
      return None

    # Cache data and return
    self.data = data
    return data
