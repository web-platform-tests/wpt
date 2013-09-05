#!/usr/bin/python -u
# coding=utf-8
#
#  Copyright © 2013 Hewlett-Packard Development Company, L.P. 
#
#  This work is distributed under the W3C® Software License [1] 
#  in the hope that it will be useful, but WITHOUT ANY 
#  WARRANTY; without even the implied warranty of 
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
#
#  [1] http://www.w3.org/Consortium/Legal/2002/copyright-software-20021231 
#

import sys
import os
import datetime
import time
import optparse
import codecs
import urlparse
import re
import exceptions
import copy

import urllib2
import json

class ListSections(object): # dump spec section data in legacy format for build system
    def __init__(self):
        self.reset()

    def __del__(self):
        pass
  
    def reset(self, specName = None):
        self.mSpecName = specName
        self.mBaseURI = None

    def _printSections(self, sections):
        for section in sections:
            out = self.mBaseURI + section['uri'] + "\t" + section['name'] + "\t" + section['title']
            print out.encode('utf-8')
            if ('children' in section):
                self._printSections(section['children'])
  
  
    def listSections(self, specName):
        self.reset(specName)
      
        uri = 'http://test.csswg.org/shepherd/api/spec?spec=' + specName + '&sections=1'

        file = urllib2.urlopen(uri)
        data = json.load(file)
        file.close()

        if (data):
            self.mBaseURI = data['base_uri']
            self._printSections(data['sections'])
        else:
            print "Unable to retrieve sections for: " + specName

def debugHook(type, value, tb):
   if hasattr(sys, 'ps1') or not sys.stderr.isatty():
      # we are in interactive mode or we don't have a tty-like
      # device, so we call the default hook
      sys.__excepthook__(type, value, tb)
   else:
      import traceback, pdb
      # we are NOT in interactive mode, print the exception...
      traceback.print_exception(type, value, tb)
      print
      # ...then start the debugger in post-mortem mode.
      pdb.pm()


if __name__ == "__main__":      # called from the command line
    parser = optparse.OptionParser(usage = "usage: %prog [options] [SpecName]")
    (options, args) = parser.parse_args()

    sys.excepthook = debugHook

    list = ListSections()

    specName = args[0] if (0 < len(args)) else None

    if (specName):
        list.listSections(specName)
    else:
        parser.print_usage()

    del list # delete early to prevent exception on exit


