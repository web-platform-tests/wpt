#!/usr/bin/env python3

# Usage: python3 generate.py
#
# This will remove all existing files in the generated directories and generate new tests.


# Notes on potential confusion with the 3 string substitution features in different layers:
#
# - In Python strings when calling .format(): {something} or {}
#   To get a literal {} use {{}}.
#   The template_* variables are ones below are those that will use .format().
#   https://docs.python.org/3/library/string.html#formatstrings
# - JS template literals: ${something}
#   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
# - wptserve server-side substitution when generating a response: {{GET[something]}}
#   https://web-platform-tests.org/writing-tests/server-pipes.html#sub

import os, shutil

target_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + "/generated"

# Test data

tests = [
    # title, template_testcase_markup, expect_load
    (u'script-src', u'<script src={}></script>', u'true'),
    (u'script-src-unsupported-type', u'<script src={} type=text/plain></script>', u'false'),
    (u'img-src', u'<img src={}>', u'true'),
    (u'picture-source-unsupported-type', u'<picture><source srcset={} type=text/plain><img></picture>', u'false'),
    (u'picture-source-nomatch-media', u'<picture><source srcset={} media="not all"><img></picture>', u'false'),
    (u'picture-source-no-img', u'<picture><source srcset={}></picture>', u'false'),
    (u'picture-source-br-img', u'<picture><source srcset={}><br><img></picture>', u'true'),
]

preamble = u"""<!DOCTYPE html>
<meta charset=utf-8>
<!-- DO NOT EDIT. This file has been generated. Source:
     /html/syntax/preload-scanner.tentative/tools/generate.py
-->"""

url_wptserve_sub = u"/html/syntax/preload-scanner.tentative/resources/stash.py?action=put&uuid={{GET[uuid]}}"
url_js_sub = u"/html/syntax/preload-scanner.tentative/resources/stash.py?action=put&uuid=${uuid}"


# Templates

# Nonspeculative (normal) case to compare results with

template_nonspeculative = u"""{preamble}
<title>Preload scanner, non-speculative (helper file): {title}</title>
non-speculative case
{testcase_markup}
<!-- block the load event for a bit: -->
<script src=/common/slow.py><\\/script>
"""

# Scenario: page load

template_pageload_toplevel = u"""{preamble}
<title>Preload scanner, page load: {title}</title>
<script src=/resources/testharness.js></script>
<script src=/resources/testharnessreport.js></script>
<script src=/common/utils.js></script>
<script src=/html/syntax/preload-scanner.tentative/resources/preload-scanner-util.js></script>
<body>
<script>
  setup({{single_test: true}});
  const uuid = token();
  const iframe = document.createElement('iframe');
  iframe.src = `resources/{title}-framed.sub.html?uuid=${{uuid}}`;
  document.body.appendChild(iframe);
  expect_fetched_onload(uuid, {expect_load})
    .then(compare_with_nonspeculative(uuid, '{title}'))
    .then(done);
</script>
"""

template_pageload_framed = u"""{preamble}
<title>Preload scanner, page load (helper file): {title}</title>
<script src=/common/slow.py></script>
<script>
  document.write('<plaintext>');
</script>
speculative case
{testcase_markup}
"""

# Scenario: document.write()

template_docwrite = u"""{preamble}
<title>Preload scanner, document.write(): {title}</title>
<script src=/resources/testharness.js></script>
<script src=/resources/testharnessreport.js></script>
<script src=/common/utils.js></script>
<script src=/html/syntax/preload-scanner.tentative/resources/preload-scanner-util.js></script>
<script>
  setup({{single_test: true}});
  const uuid = token();
  expect_fetched_onload(uuid, {expect_load})
    .then(compare_with_nonspeculative(uuid, '{title}'))
    .then(done);
  document.write(`
    <script src=/common/slow.py><\\/script>
    <script>
     document.write('<plaintext>');
    <\\/script>
    speculative case in document.write
    {testcase_markup}
  `);
</script>
"""

# Scenario: <link rel=prerender> - TODO(zcorpan)

template_prerender_toplevel = u"""{preamble}
<title>Preload scanner, prerender: {title}</title>
...
"""

template_prerender_linked = u"""{preamble}
<title>Preload scanner, prerender (helper file): {title}</title>
...
"""

# Generate tests

# wipe target_dir
if os.path.isdir(target_dir):
    shutil.rmtree(target_dir)

def write_file(path, content):
    path = os.path.join(target_dir, path)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    file = open(os.path.join(target_dir, path), 'w')
    file.write(content)
    file.close()

for testcase in tests:
    title, template_testcase_markup, expect_load = testcase

    html_testcase_markup = template_testcase_markup.format(url_wptserve_sub)
    js_testcase_markup = template_testcase_markup.format(url_js_sub).replace(u"</script>", u"<\/script>")

    nonspeculative = template_nonspeculative.format(preamble=preamble, title=title, testcase_markup=html_testcase_markup)
    write_file(f"resources/{title}-nonspeculative.sub.html", nonspeculative)

    pageload_toplevel = template_pageload_toplevel.format(preamble=preamble, title=title, expect_load=expect_load)
    write_file(f"page-load/{title}.html", pageload_toplevel)
    pageload_framed = template_pageload_framed.format(preamble=preamble, title=title, testcase_markup=html_testcase_markup)
    write_file(f"page-load/resources/{title}-framed.sub.html", pageload_framed)

    docwrite = template_docwrite.format(preamble=preamble, title=title, expect_load=expect_load, testcase_markup=js_testcase_markup)
    write_file(f"document-write/{title}.html", docwrite)
