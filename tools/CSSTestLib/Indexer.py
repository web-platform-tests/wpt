#!/usr/bin/python
# CSS Test Suite Manipulation Library
# Initial code by fantasai, joint copyright 2010 W3C and Microsoft
# Licensed under BSD 3-Clause: <http://www.w3.org/Consortium/Legal/2008/03-bsd-license>

# Define contains vmethod for Template Toolkit
from template.stash import list_op
@list_op("contains")
def list_contains(l, x):
  return x in l

import sys
import re
import os
from os.path import join, exists, abspath
from template import Template
import CSSTestLib
from Utils import listfiles
from OutputFormats import ExtensionMap
import shutil

class Section:
  def __init__(self, uri, title, numstr):
    self.uri = uri
    self.title = title
    self.numstr = numstr
    self.tests = []
  def __cmp__(self, other):
    return cmp(self.natsortkey(), other.natsortkey())
  def chapterNum(self):
    return self.numstr.partition('.')[0]
  def natsortkey(self):
    chunks = self.numstr.split('.')
    for index in range(len(chunks)):
      if chunks[index].isdigit():
        # wrap in tuple with '0' to explicitly specify numbers come first
        chunks[index] = (0, int(chunks[index]))
      else:
        chunks[index] = (1, chunks[index])
    return (chunks, self.numstr)

class Indexer:

  def __init__(self, suite, tocDataPath, splitChapter=False, templatePathList=None,
               extraData=None, overviewTmplNames=None, overviewCopyExts=('.css', 'htaccess')):
    """Initialize indexer with CSSTestSuite `suite` toc data file
       `tocDataPath` and additional template paths in list `templatePathList`.

       The toc data file should be list of tab-separated records, one
       per line, of each spec section's uri, number/letter, and title.
       `splitChapter` selects a single page index if False, chapter 
       indicies if True.
       `extraData` can be a dictionary whose data gets passed to the templates.
       `overviewCopyExts` lists file extensions that should be found
       and copied from the template path into the main build directory.
       The default value is ['.css', 'htaccess'].
       `overviewTemplateNames` lists template names that should be
       processed from the template path into the main build directory.
       The '.tmpl' extension, if any, is stripped from the output filename.
       The default value is ['index.html.tmpl', 'index.xht.tmpl', 'testinfo.data.tmpl']
    """
    self.suite        = suite
    self.splitChapter = splitChapter
    self.extraData    = extraData
    self.overviewCopyExtPat = re.compile('.*(%s)$' % '|'.join(overviewCopyExts))
    self.overviewTmplNames = overviewTmplNames if overviewTmplNames is not None \
      else ['index.html.tmpl', 'index.xht.tmpl', 'testinfo.data.tmpl',
            'implementation-report-TEMPLATE.data.tmpl']

    # Initialize template engine
    self.templatePath = [join(CSSTestLib.__path__[0], 'templates')]
    if templatePathList:
      self.templatePath.extend(templatePathList)
    self.templatePath = [abspath(path) for path in self.templatePath]
    self.tt = Template({
       'INCLUDE_PATH': self.templatePath,
       'ENCODING'    : 'utf-8',
       'PRE_CHOMP'   : 1,
       'POST_CHOMP'  : 0,
    })

    # Load toc data
    self.sections = {}
    for record in open(tocDataPath):
      uri, numstr, title = record.split('\t')
      uri = intern(uri)
      self.sections[uri] = Section(uri, title, numstr)

    # Initialize storage
    self.errors = set()
    self.contributors = {}
    self.alltests = []

  def indexGroup(self, group):
    for test in group.iterTests():
      data = test.getMetadata()
      if data: # Shallow copy for template output
        data = data.copy()
        data['links'] = [link for link in data['links']
                         if link.find(self.suite.specroot) > -1]
        data['file'] = '/'.join((group.name, test.relpath)) \
                       if group.name else test.relpath
        self.alltests.append(data)
        for uri in data['links']:
          if self.sections.has_key(uri):
            testlist = self.sections[uri].tests.append(data)
        for credit in data['credits']:
          self.contributors[credit[0]] = credit[1]
      else:
        self.errors.add(test.error)

  def __writeTemplate(self, template, data, outfile):
    o = self.tt.process(template, data)
    f = open(outfile, 'w')
    f.write(o.encode('utf-8'))
    f.close()

  def writeOverview(self, destDir, errorOut=sys.stderr, addTests=[]):
    """Write format-agnostic pages such as test suite overview pages,
       test data files, and error reports.

       Indexed errors are reported to errorOut, which must be either
       an output handle such as sys.stderr, a tuple of
       (template filename string, output filename string)
       or None to suppress error output.

       `addTests` is a list of additional test paths, relative to the
       overview root; it is intended for indexing raw tests
    """

    # Set common values
    data = self.extraData.copy()
    data['suitetitle']   = self.suite.title
    data['suite']        = self.suite.name
    data['specroot']     = self.suite.specroot
    data['contributors'] = self.contributors
    data['tests']        = self.alltests
    data['extmap']       = ExtensionMap({'.xht':''})
    data['formats']      = self.suite.formats
    data['addtests']     = addTests

    # Copy simple copy files
    for tmplDir in reversed(self.templatePath):
      files = listfiles(tmplDir)
      for file in files:
        if self.overviewCopyExtPat.match(file):
          shutil.copy(join(tmplDir, file), join(destDir, file))

    # Generate indexes
    for tmpl in self.overviewTmplNames:
      out = tmpl[0:-5] if tmpl.endswith('.tmpl') else tmpl
      self.__writeTemplate(tmpl, data, join(destDir, out))

    # Report errors
    errors = sorted(self.errors)
    if type(errorOut) is type(('tmpl','out')):
      data['errors'] = errors
      self.__writeTemplate(errorOut[0], data, join(destDir, errorOut[1]))
    else:
      sys.stdout.flush()
      for error in errors:
        print >> errorOut, "Error in %s: %s" % \
                           (error.CSSTestLibErrorLocation, error)

  def writeIndex(self, format):
    """Write indices into test suite build output through format `format`.
    """

    # Set common values
    data = self.extraData.copy()
    data['suitetitle'] = self.suite.title
    data['suite']      = self.suite.name
    data['specroot']   = self.suite.specroot
    
    data['indexext']   = format.indexExt
    data['isXML']      = format.indexExt.startswith('.x')
    data['formatdir']  = format.formatDirName
    data['extmap']     = format.extMap
    data['tests']      = self.alltests

    # Generate indices:

    # Reftest indices
    self.__writeTemplate('reftest-toc.tmpl', data,
                         format.dest('reftest-toc%s' % format.indexExt))
    self.__writeTemplate('reftest.tmpl', data,
                         format.dest('reftest.list'))

    # Table of Contents
    sectionlist = sorted(self.sections.values())
    if self.splitChapter:
      # Split sectionlist into chapters
      chapters = []
      lastChapNum = '$' # some nonmatching initial char
      chap = None
      for section in sectionlist:
        if section.chapterNum() != lastChapNum:
          lastChapNum = section.chapterNum()
          chap = section
          chap.sections = []
          chap.testcount = 0
          chapters.append(chap)
          if not chap.tests:
            continue;
        chap.testcount += len(section.tests)
        chap.sections.append(section)

      # Generate main toc
      data['chapters'] = chapters
      self.__writeTemplate('chapter-toc.tmpl', data,
                           format.dest('toc%s' % format.indexExt))
      del data['chapters']

      # Generate chapter tocs
      for chap in chapters:
        data['chaptertitle'] = chap.title
        data['testcount']    = chap.testcount
        data['sections']     = chap.sections
        self.__writeTemplate('test-toc.tmpl', data, format.dest('chapter-%s%s' \
                             % (chap.numstr, format.indexExt)))

    else: # not splitChapter
      data['chapters'] = sectionlist
      self.__writeTemplate('test-toc.tmpl', data,
                           format.dest('toc%s' % format.indexExt))
      del data['chapters']
