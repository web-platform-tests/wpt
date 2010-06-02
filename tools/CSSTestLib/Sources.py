#!/usr/bin/python
# CSS Test Source Manipulation Library
# Initial code by fantasai, joint copyright 2010 W3C and Microsoft
# Licensed under BSD 3-Clause: <http://www.w3.org/Consortium/Legal/2008/03-bsd-license>

from os.path import basename, exists, join
import os
import filecmp
import shutil
import re
import html5lib # Warning: This uses a patched version of html5lib
from lxml import etree
from lxml.etree import ParseError
from Utils import getMimeFromExt, escapeToNamedASCII, pathInsideBase, basepath

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
       asserts if this is tried. (.htaccess files are not cached.)
    """
    if self.__cache.has_key(sourcepath):
      source = self.__cache[sourcepath]
      assert isTest == isinstance(source, CSSTestSource)
      assert relpath == source.relpath
      return source

    if isTest:
      source = CSSTestSource(sourcepath, relpath)
    else:
      if basename(sourcepath) == '.htaccess':
        return ConfigSource(sourcepath, relpath)
      mime = getMimeFromExt(sourcepath)
      if mime == 'application/xhtml+xml':
        source = XHTMLSource(sourcepath, relpath)
      else:
        source = FileSource(sourcepath, relpath, mime)
    self.__cache[sourcepath] = source
    return source

class SourceSet:
  """Set of FileSource objects. No two FileSources in the set may
     have the same relpath (except .htaccess files, which are merged).
  """
  def __init__(self, sourceCache):
    self.sourceCache = sourceCache
    self.pathMap = {} # relpath -> source

  def __len__(self):
    return len(self.pathMap)

  def iter(self):
    """Iterate over FileSource objects in SourceSet.
    """
    return self.pathMap.itervalues()

  def addSource(self, source):
    """Add FileSource `source`. Throws exception if we already have
       a FileSource with the same path relpath but different contents.
       (ConfigSources are exempt from this requirement.)
    """
    cachedSource = self.pathMap.get(source.relpath)
    if not cachedSource:
      self.pathMap[source.relpath] = source
    else:
      if source != cachedSource:
        if isinstance(source, ConfigSource):
          cachedSource.append(source)
        else:
          raise Exception("File merge mismatch %s vs %s for %s" % \
                (cachedSource.sourcepath, source.sourcepath, source.relpath))

  def add(self, sourcepath, relpath, isTest=False):
    """Generate and add FileSource from sourceCache. Return the resulting
       FileSource.

       Throws exception if we already have a FileSource with the same path
       relpath but different contents.
    """
    source = self.sourceCache.generateSource(sourcepath, relpath, isTest)
    self.addSource(source)
    return source

  @staticmethod
  def combine(a, b):
    """Merges a and b, and returns whichever one contains the merger (which
       one is chosen based on merge efficiency). Can accept None as an argument.
    """
    if not (a and b):
      return a or b
    if len(a) < len(b):
      return b.merge(a)
    return a.merge(b)

  def merge(self, other):
    """Merge sourceSet's contents into this SourceSet.

       Throws a RuntimeError if there's a sourceCache mismatch.
       Throws an Exception if two files with the same relpath mismatch.
       Returns merge result (i.e. self)
    """
    if self.sourceCache is not other.sourceCache:
      raise RuntimeError

    for source in other.pathMap.itervalues():
      self.addSource(source)

    return self

  def write(self, format):
    """Write files out through OutputFormat `format`.
    """
    for source in self.pathMap.itervalues():
      format.write(source)


class FileSource:
  """Object representing a file. Two FileSources are equal if they represent
     the same file contents. It is recommended to use a SourceCache to generate
     FileSources.
  """

  isTest = False

  def __init__(self, sourcepath, relpath, mimetype=None):
    """Init FileSource from source path. Give it relative path relpath.

       `mimetype` should be the canonical MIME type for the file, if known.
        If `mimetype` is None, guess type from file extension, defaulting to
        the None key's value in extensionMap.
    """
    self.sourcepath = sourcepath
    self.relpath    = relpath
    self.mimetype   = mimetype or getMimeFromExt(sourcepath)
    self.error      = None

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
     shutil.copy(self.sourcepath, format.dest(self.relpath))

  def compact(self):
    """Clears all cached data, preserves computed data."""
    pass

class ConfigSource(FileSource):
  """Object representing a text-based configuration file.
     Capable of merging multiple config-file contents.
  """

  def __init__(self, sourcepath, relpath, mimetype=None):
    """Init ConfigSource from source path. Give it relative path relpath.
    """
    FileSource.__init__(self, sourcepath, relpath, mimetype)
    self.sourcepath = [sourcepath]

  def __eq__(self, other):
    if not isinstance(other, ConfigSource):
      return False
    if self is other or self.sourcepath == other.sourcepath:
      return True
    if len(self.sourcepath) != len(other.sourcepath):
      return False
    for this, that in zip(self.sourcepath, other.sourcepath):
      if not filecmp.cmp(this, that):
        return False
    return True

  def __ne__(self, other):
    return not self == other

  def write(self, format):
    """Writes ConfigSource out to `self.relpath` through Format `format`,
       merging contents of all config files represented by this source.
    """
    f = open(format.dest(self.relpath), 'w')
    for src in self.sourcepath:
      f.write(open(src).read())
      f.write('\n')

  def append(self, other):
    """Appends contents of ConfigSource `other` to this source.
       Asserts if self.relpath != other.relpath.
    """
    assert isinstance(other, ConfigSource)
    assert self != other and self.relpath == other.relpath
    self.sourcepath.extend(other.sourcepath)

class ReftestFilepathError(Exception):
  pass

class ReftestManifest(ConfigSource):
  """Object representing a reftest manifest file and its .htaccess.
     Iterating the ReftestManifest returns (testpath, refpath) tuples
     with paths relative to the manifest.
  """
  def __init__(self, sourcepath, relpath):
    """Init ReftestManifest from source path. Give it relative path `relpath`
       and load its .htaccess file.
    """
    ConfigSource.__init__(self, sourcepath, relpath, 'config/reftest')
    htapath = join(basepath(sourcepath), '.htaccess')
    self.htaccess = ConfigSource(htapath, join(basepath(), '.htaccess')) \
                    if exists(htapath) else None

  def append(self, other):
    """Appends contents of ConfigSource `other` to this source.
       Asserts if self.relpath != other.relpath.
    """
    ConfigSource.append(self, other)
    if self.htaccess and other.htaccess:
      self.htaccess.append(other.htaccess)
    else:
      self.htaccess = self.htaccess or other.htaccess

  def basepath(self):
    """Returns the base relpath of this reftest manifest path, i.e.
       the parent of the manifest file.
    """
    return basepath(self.relpath)

  stripRE = re.compile(r'#.*')
  parseRE = re.compile(r'^\s*==\s*(\S+)\s+(\S+)')

  def __iter__(self):
    """Parse the reftest manifest files represented by this ReftestManifest
       and return path information about each reftest pair as
         ((test-sourcepath, ref-sourcepath), (test-relpath, ref-relpath))
       Raises a ReftestFilepathError if any sources file do not exist or
       if any relpaths point higher than the relpath root.
    """
    for src in self.sourcepath:
      relbase = basepath(self.relpath)
      srcbase = basepath(src)
      for line in open(src):
        line = self.stripRE.sub('', line)
        m = self.parseRE.search(line)
        if m:
          record = ((join(srcbase, m.group(1)), join(srcbase, m.group(2))), \
                    (join(relbase, m.group(1)), join(relbase, m.group(2))))
          if not exists(record[0][0]):
            raise ReftestFilepathError("Manifest Error in %s: "
                                       "Reftest test file %s does not exist." \
                                        % (src, record[0][0]))
          elif not exists(record[0][1]):
            raise ReftestFilepathError("Manifest Error in %s: "
                                       "Reftest reference file %s does not exist." \
                                       % (src, record[0][1]))
          elif not pathInsideBase(record[1][0]):
            raise ReftestFilepathError("Manifest Error in %s: "
                                       "Reftest test replath %s not within relpath root." \
                                       % (src, record[1][0]))
          elif not pathInsideBase(record[1][1]):
            raise ReftestFilepathError("Manifest Error in %s: "
                                       "Reftest test replath %s not within relpath root." \
                                       % (src, record[1][1]))
          yield record

xhtmlns = '{http://www.w3.org/1999/xhtml}'

class XHTMLSource(FileSource):
  """FileSource object with support for XHTML->HTML conversions."""

  # Public Data
  syntaxErrorDoc = \
  u"""
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
      and the source is replaced with an XHTML error message.
    """
    FileSource.__init__(self, sourcepath, relpath)
    self.tree = None

  def cacheAsParseError(self, filename, e):
      """Replace document with an error message."""
      errorDoc = self.syntaxErrorDoc % (filename, e)
      from StringIO import StringIO 
      self.tree = etree.parse(StringIO(errorDoc), parser=self.__parser)

  def parse(self):
    """Parse file and store any parse errors in self.error"""
    self.error = False
    try:
      self.tree = etree.parse(self.sourcepath, parser=self.__parser)
    except etree.ParseError, e:
      self.cacheAsParseError(self.sourcepath, e)
      e.CSSTestLibErrorLocation = self.sourcepath
      self.error = e

  def validate(self):
    """Parse file if not parsed, and store any parse errors in self.error"""
    if self.tree is None:
      self.parse()

  def injectHeadTag(tagSnippet):
    """Inject (prepend) <head> data given in `tagSnippet`, which should be
       a single (XHTML-closed) element. Throws an exception if `tagSnippet`
       is invalid.
    """
    snippet = etree.XML(tagSnippet)
    self.validate()
    head = self.tree.getroot().find('head')
    assert head
    snippet.tail = head.text
    snippet.isCSSTestLibInjection = True
    head.insert(0, snippet)

  def clearInjectedTags():
    if self.tree:
      head = self.tree.getroot().find('head')
      if head:
        for e in head.iterchildren():
          if e.isCSSTestLibInjection:
            head.remove(e)

  def serializeXHTML(self):
    if self.tree is None:
      self.parse()
    return etree.tounicode(self.tree)

  def serializeHTML(self):
    # Parse
    if self.tree is None:
      self.parse()
    # Serialize
    o = html5lib.serializer.serialize(self.tree, tree='lxml',
                                      format='html',
                                      emit_doctype='html',
                                      resolve_entities=False,
                                      omit_optional_tags=False,
                                      minimize_boolean_attributes=True,
                                      quote_attr_values=True)

    # lxml fixup for eating whitespace outside root element
    m = re.search('<!DOCTYPE[^>]+>(\s*)<', o)
    if m.group(1) == '': # match first to avoid perf hit from searching whole doc
      o = re.sub('(<!DOCTYPE[^>]+>)<', '\g<1>\n<', o)
    return o

  def write(self, format, output=None):
    """Write Source through OutputFormat `format`.
       Write contents as string `output` instead if specified.
    """
    if not output:
      if not self.error: # can shortcut as copy if no error
        return FileSource.write(self, format)
      else:
        output = self.serializeXHTML()

    # write
    f = open(format.dest(self.relpath), 'w')
    f.write(output.encode('utf-8'))
    f.close()

  def compact():
    self.tree = None

class CSSTestSourceMetaError(Exception):
  pass

CSSTestTitlePrefix='CSS Test:' # stripped from metadata

class CSSTestSource(XHTMLSource):
  """XHTMLSource representing the main CSS test file. Supports metadata lookups."""

  isTest = True

  def __init__(self, sourcepath, relpath, referenceSource=None):
    """Initialize CSSTestSource by loading from XHTML file `sourcepath`.
       Links to reftest reference FileSource `reference` if given,
       sets up as Selftest otherwise.
       Parse errors are reported as caught exceptions in `self.error`,
       and the source is replaced with an XHTML error message.
    """
    XHTMLSource.__init__(self, sourcepath, relpath)
    self.data = None
    self.ref  = referenceSource
    self.selftest = not referenceSource

  def __cmp__(self, other):
    return cmp(self.name(), other.name())

  def name(self):
    """Extract filename base as test name."""
    return os.path.splitext(basename(self.relpath))[0]

  def setReftest(self, referenceSource):
    """Sets test to be a reftest, with reference relpath `reference`."""
    self.ref = referenceSource

  def isReftest(self):
    return bool(self.ref)

  def setSelftest(self, isSelftest=True):
    self.selftest = isSelftest

  def isSelftest(self):
    return self.selftest

  def parse(self):
    XHTMLSource.parse(self)
    if self.ref:
      self.injectHeadTag('<link rel="reference" href="%s"/>'
                         % relpath(self.ref.relpath, self.relpath))

  # See http://wiki.csswg.org/test/css2.1/format for more info on metadata
  def getMetadata(self):
    """Return dictionary of test metadata. Returns None and stores error
       exception in self.error if there is a parse or metadata error.
       Data fields include:
         - asserts [list of strings]
         - credits [list of (name string, url string) tuples]
         - flags   [list of token strings]
         - links   [list of url strings
         - name    [string]
         - title   [string]
         - reference [relative path to reference; None if not reftest]
    """

    # Check for cached data
    if self.error:
      return None
    if self.data:
      return self.data

    # Make sure we're parsed
    if self.tree is None:
      XHTMLSource.parse(self)
    if self.error:
      return None

    # Extract data
    links = []; credits = []; asserts = [];
    data = {'asserts' : asserts,
            'credits' : credits,
            'flags'   : [], # sorted
            'links'   : links,
            'name'    : self.name(),
            'title'   : '',
            'reference' : self.ref.relpath if self.ref else None,
            'selftest' : self.isSelftest
           }
    def tokenMatch(token, string):
      return bool(re.search('(^|\s+)%s($|\s+)' % token, string))

    head = self.tree.getroot().find(xhtmlns+'head')
    readFlags = False
    try:
      # Scan and cache metadata
      for node in head:
        if node.tag == xhtmlns+'link':
          link = node.get('href').strip()
          # help links
          if tokenMatch('help', node.get('rel')):
            if not link:
              raise CSSTestSourceMetaError("Help link missing href value.")
            if not link.startswith('http://') or link.startswith('https://'):
              raise CSSTestSourceMetaError("Help link must be absolute URL.")
            links.append(intern(link))
          # credits
          elif tokenMatch('author', node.get('rel')):
            name = node.get('title')
            name = name.strip() if name else name
            if not name:
              raise CSSTestSourceMetaError("Author link missing name (title attribute).")
            credits.append((intern(escapeToNamedASCII(name)), intern(link)))
        elif node.tag == xhtmlns+'meta':
          metatype = node.get('name')
          metatype = metatype.strip() if metatype else metatype
          # requirement flags
          if metatype == 'flags':
            if readFlags:
              raise CSSTestSourceMetaError("Flags must only be specified once.")
            readFlags = True
            data['flags'] = [intern(flag) for flag in sorted(node.get('content').split())]
          # test assertions
          elif metatype == 'assert':
            asserts.append(node.get('content').strip())
        # test title
        elif node.tag == xhtmlns+'title':
          title = node.text.strip()
          if not title.startswith(CSSTestTitlePrefix):
            raise CSSTestSourceMetaError("Title must start with %s" % CSSTestTitlePrefix)
          data['title'] = title[len(CSSTestTitlePrefix):].strip()
    # Cache error and return
    except CSSTestSourceMetaError, e:
      e.CSSTestLibErrorLocation = self.sourcepath
      self.error = e
      return None

    # Cache data and return
    self.data = data
    return data

  def hasFlag(self, flag):
    data = self.getMetadata()
    if data:
      return flag in data['flags']
    return False

  def augmentHead(next=None, prev=None):
    """Add extra useful metadata to the head.
         * Adds next/prev links to paths given
         * Adds link to reference if reftest
    """
    self.validate()
    if next:
      self.injectHeadTag('<link rel="next" href="%s"/>' % next)
    if prev:
      self.injectHeadTag('<link rel="prev" href="%s"/>' % prev)

