#!/usr/bin/python
# CSS Test Suite Manipulation Library
# Initial code by fantasai, joint copyright 2010 W3C and Microsoft
# Licensed under BSD 3-Clause: <http://www.w3.org/Consortium/Legal/2008/03-bsd-license>

from os.path import join, exists
from template import Template

class Indexer:
  baseTemplatePath = join(__path__[0], 'templates')

  class Section:
    def __init__(uri, title, sortstr, numstr):
      self.uri = uri
      self.title = title
      self.sortstr = sortstr # sortable (zero-filled) section number
      self.numstr = numstr
      self.tests = {} # lists indexed by group name
    def __cmp__(self, other):
      return self.sortstr.__cmp__(other.sortstr)

  def __init__(self, suite, tocDataPath, splitlevel=0, templatePath=None):
    """Initialize indexer with CSSTestSuite `suite` toc data file
       `tocDataPath` and additional template path `templatePath`.

       The toc data file should be list of tab-separated records, one
       per line, of each spec section's sort string, uri, number/letter,
       and title.
       `splitlevel` is the number of prefix characters common to each
       chapter's sort string in the toc data file: set to zero for a
       single-page index; set to two to create chapter indices when
       using two-digit chapter numbers in the sort string.
    """
    self.suite = suite
    self.splitlevel = splitlevel

    # Initialize template engine
    self.templatePath = [templatePath]
    if templatePath:
      self.templatePath.insert(0, templatePath)
    self.tt = Template({
       'INCLUDE_PATH': self.templatePath,
       'PRE_CHOMP'   : True,
       'POST_CHOMP'  : False,
    })

     # string =  tt.process(tmpl,values)

     # Load toc data
     self.sections = {}
     for record in open(tocDataPath):
       sortstr, uri, numstr, title = record.split('\t')
       uri = intern(uri)
       self.sections[uri] = Section(uri, title, sortstr, numstr)

  def indexGroup(self, group):
    for test in group.iterTests():
      data = test.getMetadata().copy()
      data['file'] = '/'.join(group.name, test.name)
      for uri in data['links']:
        if self.sections.has_key(uri):
          testlist = self.sections[uri].tests.append(data)


  def __writeTemplate(template, data, outfile):
    o = self.tt.process(template, data)
    f = open(outfile, 'w')
    f.write(o.encode('utf-8'))
    f.close()

  def write(self, format):
    """Write indices into test suite build output through format `format`.
    """
    sectionlist = sorted(self.sections.values())

    # Common values
    data = {}
    data['suitetitle'] = suite.title
    data['specroot']   = suite.specroot
    data['indexext']   = format.indexExt
    data['isXML']      = format.indexExt.startswith('.x')
    data['formatdir']  = format.formatDirName
    if self.splitlevel:
      # Split sectionlist into chapters
      chapters = []
      lastChapNum = '$' # some nonmatching initial char
      chap = None
      for section in sectionlist:
        if not section.sortstr.startswith(lastChapNum)
          lastChapNum = section.sortstr[:self.splitlevel]
          chap = section
          chap.sections = []
          chap.testcount = 0
          chapters.append(chap)
          if not chap.tests:
            continue;
        chap.testcount += len(section.tests)
        chap.sections.append(section)

      # generate main toc
      data['chapters'] = chapters
      self.__writeTemplate('chapter-toc.tmpl', data,
                           format.dest('toc%s' % format.indexExt))
      del data['chapters']

      # generate chapter tocs
      data['testext'] = format.testOutExt
      for chap in chapters:
        data['chaptertitle'] = chap.title
        data['testcount']    = chap.testcount
        self.__writeTemplate('test-toc.tmpl', data,
               format.dest('chapter-%s%s' % (chap.sortstr, format.indexExt))
    else:
      data['chapters'] = sectionlist
      self.__writeTemplate('test-toc.tmpl', data,
                           format.dest('toc%s' % format.indexExt))
