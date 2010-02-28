#!/usr/bin/python
# CSS Test Source Manipulation Library
# Initial code by fantasai, joint copyright 2010 W3C and Microsoft
# Licensed under BSD 3-Clause: <http://www.w3.org/Consortium/Legal/2008/03-bsd-license>

import re
import html5lib # Warning: This uses a patched version of html5lib
from lxml import etree
from lxml.etree import ParseError

class CSSTestSourceMetaError(Exception):
  pass

class CSSTestSource:
  """Object representing a CSS test suite test."""

  #### HTML/XHTML Parsing and Serialization Methods ###################

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

  def __tree2HTML(tree, dest=None):
    """Serializes lxml etree `tree` to HTML and writes it to `dest`,
       if specified, else returns as a string."""

    # serialize
    o = html5lib.serializer.serialize(tree, tree='lxml',
                                      format='html',
                                      emit_doctype='html',
                                      resolve_entities=False,
                                      quote_attr_values=True)

    # lxml fixup for eating whitespace outside root element
    m = re.search('<!DOCTYPE[^>]+>(\s*)<', o)
    if m.group(1) == '': # run match to avoid perf hit from searching whole doc
      o = re.sub('(<!DOCTYPE[^>]+>)<', '\g<1>\n<', o)

    # write
    f = open(dest, 'w')
    f.write(o.encode('utf-8'))
    f.close()
  __tree2HTML = staticmethod(__tree2HTML)

  # Public Methods
  def __init__(self, source, reference=None):
    """Initialize CSSTestSource with XHTML file(s)
        - as self-describing test given by test filepath `source` or
        - as reftest given by test filepath `source` and reference
          filepath `reference`.
      Parse errors are reported as caught exceptions in `self.error`,
      and the source (and reference, if any) is replaced with an
      XHTML error message.
    """
    self.error = False
    def HandleParseError(filename, e):
        """Replace document with an error message, and reraise exception."""
        errorDoc = self.syntaxErrorDoc % (filename, e)
        self.tree = etree.fromstring(errorDoc, parser=self.__parser)
        self.reference = etree.fromstring(errorDoc, parser=self.__parser)
        e.CSSTestSourceErrorLocation = filename
        self.error = e

    # Parse test
    try:
      self.tree = etree.parse(source, parser=self.__parser)
    except etree.ParseError as e:
      HandleParseError(source, e)
    else:
      # Parse reference
      if reference:
        try:
          self.reference = etree.parse(reference, parser=self.__parser)
        except etree.ParseError as e:
          HandleParseError(reference, e)
      else:
        self.reference = None

    # Extract filename base
    m = re.search('([^/\.])+(?:\.[a-z0-9])*$', source)
    self.name = m.groups(1)


  def writeHTML(self, dest, refDest=None):
    """Serialize CSSTestSource into HTML file at path `dest`.
       If `refDest` is given and the CSSTestSource has a
       reference file, then it will be serialized into HTML
       at path `refDest`.
    """
    self.__tree2HTML(self.tree, dest)
    if refDest and self.reference:
      self.__tree2HTML(self.reference, refDest)

  #### CSS Test File Metadata Methods #################################
  ## See http://wiki.csswg.org/test/css2.1/format for more info

  xhtml = '{http://www.w3.org/1999/xhtml}'


  def parseMetadata(self, titlePrefix=''):
    """Return dictionary of test metadata."""
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

    head = self.tree.getRoot().find(xhtml+'head')
    readFlags = False
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
    return data
