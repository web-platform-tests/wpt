#!/usr/bin/python

# tpl2tc - A tool for creating test cases from test templates
# Author: payman@opera.com

__version__ = "0.1"

import os
import sys
import fnmatch
import re
from string import Template
from optparse import OptionParser
import common

def clean_tests(root_path):
    if os.path.isfile(root_path):
        delete_tests(os.path.dirname(root_path), os.path.basename(root_path))
    else:
        log('Deleting all tests (non-template files) in ' + root_path + ':')
        for root, dirs, files in os.walk(root_path):
            for filename in fnmatch.filter(files, '*.tpl'):
                delete_tests(root, filename)

def delete_tests(template_dir, template_filename):
    template_dir =  os.path.relpath(template_dir)
    log('Deleting tests created from ' + os.path.join(template_dir, template_filename) + ':')
    i = 0
    testsuite = get_testsuite(template_dir, template_filename)
    for test in testsuite:
        if 'test_suffix' not in test or re.search('\s', test['test_suffix']) is not None:
            test_suffix = '%03d' % i
            i += 1
        else:
            test_suffix = test['test_suffix']
        if 'test_extension' not in test or re.search('\s', test['test_extension']) is not None:
            test_extension = 'html'
        else:
            test_extension = test['test_extension']
        test_filename = os.path.join(template_dir, os.path.splitext(template_filename)[0] + '-' + test_suffix + '.' + test_extension)
        if  os.path.isfile(test_filename):
            log(test_filename)
            os.remove(test_filename)

def create_tests(root_path):
    if os.path.isfile(root_path):
        create_test(os.path.dirname(root_path), os.path.basename(root_path))
    else:
        log('Creating tests for all template files in ' + root_path + ':')
        for root, dirs, files in os.walk(root_path):
            for filename in fnmatch.filter(files, '*.tpl'):
                create_test(root, filename)

def create_test(template_dir, template_filename):
    template_dir =  os.path.relpath(template_dir)
    log('Creating tests for ' + os.path.join(template_dir, template_filename) + ':')
    template_file = open(os.path.join(template_dir, template_filename), 'r')
    file_contents = template_file.read()
    template_file.close()
    pattern = re.compile('^\$include (.+)$', re.M)
    try:
        file_contents = re.sub(pattern, get_included_template(template_dir), file_contents)
    except IOError as e:
        sys.stderr.write(str(e))
        exit(1)
    template = Template(file_contents)
    i = 0
    testsuite = get_testsuite(template_dir, template_filename)
    for test in testsuite:
        if 'test_suffix' not in test or re.search('\s', test['test_suffix']) is not None:
            test_suffix = '%03d' % i
            i += 1
        else:
            test_suffix = test['test_suffix']
        if 'test_extension' not in test or re.search('\s', test['test_extension']) is not None:
            test_extension = 'html'
        else:
            test_extension = test['test_extension']
        if 'open_comment_delimiter' not in test:
            open_comment_delimiter = '<!--'
        else:
            open_comment_delimiter = test['open_comment_delimiter']
        if 'close_comment_delimiter' not in test:
            close_comment_delimiter = '-->'
        else:
            close_comment_delimiter = test['close_comment_delimiter']
        test_filename = os.path.join(template_dir, os.path.splitext(template_filename)[0] + '-' + test_suffix + '.' + test_extension)
        test_file = open(test_filename, 'w')
        test_str = template.safe_substitute(test['test_mapping'])
        doctype = re.match('<!doctype.*?>', test_str, re.I)
        if doctype is not None:
            comment_pos = doctype.end()
        else:
            comment_pos = 0
        comment = open_comment_delimiter + " This file was generated from '" + template_filename + "' using '" + os.path.basename(__file__)  + "'. Please do not edit manually! " + close_comment_delimiter
        if comment_pos != 0:
            comment = '\n' + comment
        else:
            comment = comment + '\n'
        test_str = test_str[:comment_pos] + comment + test_str[comment_pos:]
        test_file.write(test_str)
        log(os.path.join(test_filename))
        test_file.close()

def get_testsuite(template_dir, template_filename):
    if os.path.join(template_dir, template_filename) in common.testsuite:
        testsuite = common.testsuite[os.path.join(template_dir, template_filename)]
    elif template_dir in common.testsuite:
        testsuite = common.testsuite[template_dir]
    else:
        testsuite = common.testsuite['*']
    return testsuite

def get_included_template(template_dir):
    def func(matchobj):
        if os.path.isabs(matchobj.group(1)):
            included_template = matchobj.group(1)
        else:
            included_template = os.path.join(template_dir, matchobj.group(1))
        try:
            file = open(included_template, 'r')
            return file.read()
        except:
            raise IOError("Error! You have '" + matchobj.group(0) + "' in your the template, but'" + included_template + "' is not a file!\n")
    return func

def log(message):
    global options
    if options.debug:
        sys.stderr.write(message + "\n")

def main():
    global options
    parser = OptionParser(usage='A tool to create tests from test templates.')
    parser.add_option('-d', '--dir', metavar='DIR', dest='dir', help='The directory to look for template files. (Default value is the current directory)')
    parser.add_option('-f', '--file', metavar='FILE', dest='file', help='The template file to generate tests from.')
    parser.add_option('-c', '--clean', action='store_true', dest='clean', help='Delete all generated files. (Can also be used together with -d or -f)')
    parser.add_option('--debug', action='store_true', dest='debug', help='Print log messages for debugging.')
    (options, args) = parser.parse_args()

    if options.dir and options.file:
        sys.stderr.write('Please choose either directory or file, not both!\n')
        return
    elif options.dir:
        if os.path.isdir(options.dir):
            root_path = options.dir
        else:
            sys.stderr.write("'" + options.dir + "' is not a directory!\n")
            return
    elif options.file:
        if os.path.isfile(options.file) and os.path.splitext(options.file)[1] == '.tpl':
            root_path = options.file
        else:
            sys.stderr.write("'" + options.file + "' is not a template (.tpl) file!\n")
            return
    else:
        root_path = '.'

    if options.clean is not None:
        clean_tests(root_path)
    else:
        create_tests(root_path)

if __name__ == "__main__":
    main()
