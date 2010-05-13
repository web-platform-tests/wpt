#!/usr/bin/python
# CSS Test Suite Manipulation Library Utilities
# Initial code by fantasai, joint copyright 2010 W3C and Microsoft
# Licensed under BSD 3-Clause: <http://www.w3.org/Consortium/Legal/2008/03-bsd-license>

###### File path manipulation ######

import os.path

def pathInsideBase(path, base=''):
  path = os.path.normpath(path)
  if base:
    base = os.path.normpath(base)
    pathlist = path.split(os.path.sep)
    baselist = base.split(os.path.sep)
    while baselist:
      p = pathlist.pop(0)
      b = baselist.pop(0)
      if p != b:
        return False
    return not pathlist[0].startswith(os.path.pardir)
  return not path.startswith(os.path.pardir)

###### MIME types and file extensions ######

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

def getMimeFromExt(filepath):
  """Convenience function: equal to extenionMap.get(ext, extensionMap[None]).
  """
  if filepath.endswith('.htaccess'):
    return 'config/htaccess'
  ext = os.path.splitext(filepath)[1]
  return extensionMap.get(ext, extensionMap[None])

###### Escaping ######

import types
from htmlentitydefs import entitydefs

entityify = dict([c,e] for e,c in entitydefs.iteritems())

def escapeMarkup(data):
  """Escape markup characters (&, >, <). Copied from xml.sax.saxutils.
  """
  # must do ampersand first
  data = data.replace("&", "&amp;")
  data = data.replace(">", "&gt;")
  data = data.replace("<", "&lt;")
  return data

def escapeToNamedASCII(text):
  """Combines escapeToNamed and escapeToASCII.
  """
  return escapeToNamed(text).encode('Latin-1', 'xmlcharrefreplace')

def escapeToNamed(text):
  """Escape characters with named entities.
  """
  escapable = set()

  for c in text:
    if ord(c) > 127:
      escapable.add(c)
  if type(text) == types.UnicodeType:
    for c in escapable:
      text = text.replace(c, "&%s;" % entityify[c.encode('Latin-1', 'replace')])
  else:
    for c in escapable:
      text = text.replace(c, "&%s;" % entityify[c])
  return text

def escapeToASCII(text):
  """Numeric-escape characters above 127. Returns standard (non-Unicode) string.
  """
  nonascii = {}
  for c in text:
    if ord(c) > 127:
      nonascii[c] = "&#x%X;" % ord(c)

  return str(text)