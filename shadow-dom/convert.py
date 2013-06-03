#!/usr/bin/python3

# Distributed under both the W3C Test Suite License [1] and the W3C
# 3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
# policies and contribution forms [3].
#
# [1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
# [2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
# [3] http://www.w3.org/2004/10/27-testcases

import os
import os.path
import re
import shutil
import sys


__author__ = 'Yuta Kitamura <yutak@google.com>'


# The name of output directory.
# NOTE: If a directory with the same name already exists, the content will be
# REMOVED.
OUTPUT_DIRECTORY = 'out'


# <tuple indicating section hierarchy> => <section title>
SECTION_TITLES = {
    ( 4,): 'shadow-trees',
    ( 4,  1): 'upper-boundary-encapsulation',
    ( 4,  2): 'lower-boundary-encapsulation',
    ( 4,  3): 'satisfying-matching-criteria',
    ( 4,  4): 'distributed-pseudo-element',
    ( 4,  5): 'hosting-multiple-shadow-trees',
    ( 4,  6): 'reprojection',
    ( 4,  7): 'composition',
    ( 4,  8): 'nested-shadow-trees',
    ( 4,  9): 'rendering-shadow-trees',
    ( 4, 10): 'custom-pseudo-elements',
    ( 5,): 'events',
    ( 5,  1): 'event-retargeting',
    ( 5,  2): 'retargeting-relatedtarget',
    ( 5,  3): 'retargeting-focus-events',
    ( 5,  4): 'events-that-are-always-stopped',
    ( 5,  5): 'event-dispatch',
    ( 5,  6): 'event-retargeting-example',
    ( 6,): 'styles',
    ( 6,  1): 'css-variables',
    ( 6,  2): 'text-decoration-property',
    ( 6,  3): 'at-host-at-rule',
    ( 7,): 'user-interaction',
    ( 7,  1): 'ranges-and-selections',
    ( 7,  2): 'focus-navigation',
    ( 7,  3): 'active-element',
    ( 7,  4): 'editing',
    ( 7,  5): 'assistive-technology',
    ( 8,): 'html-elements-in-shadow-trees',
    ( 8,  1): 'inert-html-elements',
    ( 8,  2): 'html-forms',
    ( 9,): 'html-elements-and-their-shadow-trees',
    (10,): 'elements-and-dom-objects',
    (10,  1): 'shadowroot-object',
    (10,  1,  1): 'shadowroot-attributes',
    (10,  1,  2): 'shadowroot-methods',
    (10,  2): 'extensions-to-element-interface',
    (10,  2,  1): 'attributes',
    (10,  2,  2): 'methods',
    (10,  3): 'csshostrule-interface',
    (10,  3,  1): 'csshostrule-attributes',
    (10,  3,  2): 'csshostrule-methods',
    (10,  4): 'the-content-html-element',
    (10,  5): 'the-shadow-html-element',
    }


HTML_TEMPLATE = """<!DOCTYPE html>
<!--
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
-->
<html>
<head>
<title>Shadow DOM Test: {title}</title>
{authors}<link rel="help" href="{help}">
<meta name="assert" content="{assert_}">
<script src="/resources/testharness.js"></script>
<script src="/resources/testharnessreport.js"></script>
<script src="{root_dir}/testcommon.js"></script>
<link rel="stylesheet" href="/resources/testharness.css">
</head>
<body>
<div id="log"></div>
<script>
{test_content}
</script>
</body>
</html>
"""


AUTHOR_TEMPLATE = '<link rel="author" title="{name}" href="mailto:{email}">\n'


def Main():
  CreateOutputDirectory()

  test_dir_pattern = re.compile(r'^\d\d_')
  for path in sorted(os.listdir('.')):
    if os.path.isdir(path) and test_dir_pattern.match(path):
      RunTestDirectory(path)

  files_to_copy = ['LICENSE', 'testcommon.js']
  dirs_to_copy = ['resources']

  for file in files_to_copy:
    print('Copying file {}...'.format(file))
    shutil.copy2(file, os.path.join(OUTPUT_DIRECTORY, file))

  for dir in dirs_to_copy:
    print('Copying directory {}...'.format(dir))
    shutil.copytree(dir, os.path.join(OUTPUT_DIRECTORY, dir))

  print('Done!')


def CreateOutputDirectory():
  if os.path.exists(OUTPUT_DIRECTORY):
    if not os.path.islink(OUTPUT_DIRECTORY) and os.path.isdir(OUTPUT_DIRECTORY):
      shutil.rmtree(OUTPUT_DIRECTORY)
    else:
      print('Path "{}" exists and is not a directory.'.format(OUTPUT_DIRECTORY),
            file=sys.stderrr)
      sys.exit(1)

  os.mkdir(OUTPUT_DIRECTORY)


def RunTestDirectory(src_dir):
  section_path = ExtractSectionPath(src_dir)
  depth = len(section_path)
  dir_components = []
  for i in range(depth):
    component = '{:02d}-{}'.format(section_path[i],
                                   SECTION_TITLES[section_path[:(i + 1)]])
    dir_components.append(component)
  dest_dir = os.path.join(OUTPUT_DIRECTORY, *dir_components)

  os.makedirs(dest_dir, exist_ok=True)

  # TODO(yutak): Should we take care of <test>_<subtest> structure?
  # Might be better to look into after mass conversion.
  serial = 1
  for src_name in sorted(os.listdir(src_dir)):
    if os.path.splitext(src_name)[1] == '.js':
      # This test contains no tests. Let's skip it, and don't even bother
      # assigning a test serial.
      if src_name == 'A_06_00_05.js':
        continue

      dest_name = 'test-{:03d}.html'.format(serial)
      RunTestFile(src_dir, src_name, dest_dir, dest_name, depth)
      serial += 1


def ExtractSectionPath(path):
  section_path = []
  prefix_pattern = re.compile(r'^(\d\d)_')
  while True:
    match = prefix_pattern.match(path)
    if not match:
      break
    section_num = int(match.group(1))
    if section_num > 0:
      section_path.append(section_num)
    path = path[3:]
  return tuple(section_path)


def RunTestFile(src_dir, src_name, dest_dir, dest_name, depth):
  src_path = os.path.join(src_dir, src_name)
  dest_path = os.path.join(dest_dir, dest_name)
  root_dir = ('../' * depth)[:-1]

  print('{} =>\n  {}'.format(src_path, dest_path))

  with open(src_path, 'rt') as src_fp, open(dest_path, 'wt') as dest_fp:
    src = src_fp.read()
    prologue_regex = re.compile(r'^var A_[0-9_]+ = ({$(?:.|\n)*?^});$',
                                flags=re.MULTILINE)
    match = prologue_regex.search(src)
    assert match

    # HACK! Let's make the JavaScript mapping into something that Python can
    # understand.
    prologue_str = re.sub(r'^\s*([a-z]+):', r'"\1":', match.group(1),
                          flags=re.MULTILINE)

    # A_04_06_01.js contains "//TODO" comment in the prologue block.
    prologue_str = re.sub(r'^\s*//', r'#', prologue_str, flags=re.MULTILINE)

    prologue = eval(prologue_str)

    # Some tests have broken "author" field (missing email). Fix it up here.
    src = re.sub(r'author:\'Aleksei Yu\. Semenov\'',
                 'author: \'Aleksei Yu. Semenov <sgrekhov@unipro.ru>\'',
                 src)

    # Extract the authors.
    author_regex = re.compile(r'author\s*:\s*[\'"](.+?)\s*<(.+)>[\'"]')
    authors = set(author_regex.findall(src))
    authors_html = ''.join([AUTHOR_TEMPLATE.format(name=name, email=email)
                            for name, email in authors])

    # Some tests have duplicate test names, and that is rendered as an error
    # with the latest test harness. Fix those by appending a suffix.
    # TODO(yutak): More readable name is desirable, but I'll probably leave that
    # as a post-mass-conversion task.
    known_dup_tests = ['A_04_00_01_T12',
                       'A_10_01_01_03_02_T02',
                       'A_10_01_01_04_02_T01',
                       'A_10_04_02_T01']
    for test_name in known_dup_tests:
      count = src.count(test_name)
      if count == 0:
        continue
      # Make sure the name occurs exactly twice.
      assert count == 2

      src = src.replace(test_name, test_name + '_02')
      src = src.replace(test_name + '_02', test_name + '_01', 1)

    # Some tests are known to be slow. Give these tests more time to run.
    known_slow_tests = ['A_08_01_01_T01', 'A_08_02_03_T01']

    # Remove unnecessary part of the code.
    license_comment_regex = re.compile(
        r'/\*\s*Distributed under both the W3C[^*]+\*/',
        flags=re.MULTILINE)

    src = license_comment_regex.sub('', src)
    src = prologue_regex.sub('', src)

    test_name_and_props_regex = re.compile(
        r'\'([^\']+)\'\s*,\s*PROPS\([^\)]+\)',
        flags=re.MULTILINE)
    def DropProps(match):
      if match.group(1) in known_slow_tests:
        return "'{}', {{ timeout: 5000 }}".format(match.group(1))
      return "'{}'".format(match.group(1))
    src = test_name_and_props_regex.sub(DropProps, src)

    # Some tests puts utility functions in an object whose name is same as
    # the test name.
    tests_wanting_object = ['A_04_01_01.js', 'A_04_01_09.js']
    if src_name in tests_wanting_object:
      src = 'var {} = new Object();\n\n{}'.format(src_name[:-3], src.lstrip())

    # Update the relative URIs.
    src = re.sub(r'resources/', root_dir + '/resources/', src)

    # Some tests don't have "link" metadata!
    if src_name.startswith('A_05_02_'):
      prologue['link'] = ('http://www.w3.org/TR/2013/WD-shadow-dom-201305214'
                          '#retargeting-related-target')
    elif src_name.startswith('A_05_03_'):
      prologue['link'] = ('http://www.w3.org/TR/2013/WD-shadow-dom-20130514/'
                          '#retargeting-focus-events')
    elif src_name.startswith('A_05_04_'):
      prologue['link'] = ('http://www.w3.org/TR/2013/WD-shadow-dom-20130514/'
                          '#events-that-are-always-stopped')
    elif src_name.startswith('A_05_05_'):
      prologue['link'] = ('http://www.w3.org/TR/2013/WD-shadow-dom-20130514/'
                          '#event-dispatch')
    else:
      # Otherwise, adjust the reference so it points to a snapshot of the
      # specification, not the latest one.
      help_regex = re.compile(r'^[^#]+#(.+)$')
      match = help_regex.match(prologue['link'])
      assert match
      prologue['link'] = (
          'http://www.w3.org/TR/2013/WD-shadow-dom-20130514/#{}'.format(
              match.group(1)))

    # Remove extra whitespaces.
    line_end_whitespaces_regex = re.compile(r'[ \t]+$', flags=re.MULTILINE)
    src = line_end_whitespaces_regex.sub('', src)
    src = src.strip()

    dest_fp.write(HTML_TEMPLATE.format(
        root_dir=root_dir,
        title=src_name[:-3],  # TODO(yutak): Needs better title.
        authors=authors_html,
        help=prologue['link'],
        assert_=prologue['assert'],
        test_content=src))

if __name__ == '__main__':
  Main()
