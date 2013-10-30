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

class UpdateTemplates(object): # dump spec section data in legacy format for build system
    def __init__(self):
        self.mServer = 'http://test.csswg.org/shepherd'

    def __del__(self):
        pass

    def _callAPI(self, uri):
        request = urllib2.Request(os.path.join(self.mServer, 'api', uri), headers = { 'Accept' : 'application/vnd.csswg.shepherd.v1+json, application/json' })
        file = urllib2.urlopen(request)
        data = file.read()
        data = json.loads(data)
        file.close()
        return data
    
    def _str(self, value):
        if (value):
            return str(value)
        return ''
    
    def getFlags(self):
        flags = self._callAPI('flag')
        
        if (flags):
            out = open('tools/w3ctestlib/templates/flags.tmpl', 'w')
            out.write('[% flagInfo = {\n')
            for flag in flags:
                flag = flags[flag]
                out.write("  '" + flag['name'] + "' => { ")
                out.write("title => '" + self._str(flag['description']) + "', ")
                out.write("abbr => '" + self._str(flag['title']) + "'")
                out.write(" },\n")
            out.write('}\n%]')
            out.close()
        else:
            print "Unable to fetch test flag data\n"

    def _user(self, user):
        if (user):
            data = user['full_name']
            if ('organization' in user):
                data += ', ' + user['organization']
            if ('uri' in user):
                data += ', ' + user['uri']
            elif ('email' in user):
                data += ', &lt;' + user['email'].replace('@', ' @') + '&gt;'
            return data
        return 'None Yet'

    def getSpecs(self):
        specs = self._callAPI('spec')
        suites = self._callAPI('suite');

        if (specs and suites):
            out = open('tools/w3ctestlib/templates/suites.tmpl', 'w')
            out.write('[% suites = {\n')
            for suite in suites:
                suite = suites[suite]
                spec = specs['_' + suite['specs'][0]]
                owner = suite['owners'][0] if ('owners' in suite) else None
                out.write("  '" + suite['name'] + "' => { ")
                out.write("title => '" + self._str(suite['title']) + "', ")
                out.write("spec => '" + self._str(spec['title']) + "', ")
                out.write("specroot => '" + self._str(spec['base_uri']) + "', ")
                out.write("owner => '" + self._user(owner) + "', ")
                out.write("harness => '" + self._str(suite['name']) + "', ")
                out.write("status => '" + self._str(suite['status']) + "' ")
                out.write(" },\n")
            out.write('}\n%]')
            out.close()
        else:
            print "Unable to fetch test suite data\n"


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
    parser = optparse.OptionParser(usage = "usage: %prog [options]")
    (options, args) = parser.parse_args()

    sys.excepthook = debugHook

    updater = UpdateTemplates()

    updater.getFlags()
    updater.getSpecs()

    del updater # delete early to prevent exception on exit


