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

delay = u'1500'  # Lower value makes the test complete faster, but also higher risk of flaky results

# Test data

tentative_tests = [
    # title,
    # encoding,
    # template_testcase_markup,
    # expect_load,
    # test_nonspeculative
    (
      u'script-src',
      u'utf-8',
      u'<script src="{}"></script>',
      u'true',
      u'true'
    ),
    (
      u'meta-charset-script-src',
      None,
      u'<meta charset=windows-1254><script src="{}"></script>',
      u'true',
      u'true'
    ),
    (
      u'base-href-script-src',
      u'utf-8',
      u'<base href=//{{{{domains[www1]}}}}:{{{{ports[http][0]}}}}><script src="{}"></script>',
      u'true',
      u'true'
    ),
    (
      u'script-src-unsupported-type',
      u'utf-8',
      u'<script src="{}" type=text/plain></script>',
      u'false',
      u'true'
    ),
    (
      u'script-src-type-application-ecmascript',
      u'utf-8',
      u'<script src="{}" type=application/ecmascript></script>',
      u'true',
      u'true'
    ),
    (
      u'script-src-nomodule',
      u'utf-8',
      u'<script src="{}" nomodule></script>',
      u'false',
      u'true'
    ),
    (
      u'script-src-module',
      u'utf-8',
      u'<script src="{}" type=module></script>',
      u'true',
      u'true'
    ),
    (
      u'script-src-async',
      u'utf-8',
      u'<script src="{}" async></script>',
      u'true',
      u'true'
    ),
    (
      u'script-src-defer',
      u'utf-8',
      u'<script src="{}" defer></script>',
      u'true',
      u'true'
    ),
    (
      u'script-src-crossorigin',
      u'utf-8',
      u'<script src="{}" crossorigin></script>',
      u'true',
      u'true'
    ),
    (
      u'script-src-integrity',
      u'utf-8',
      u'<script src="{}" integrity="sha384-OLBgp1GsljhM2TJ+sbHjaiH9txEUvgdDTAzHv2P24donTt6/529l+9Ua0vFImLlb"></script>',
      u'true',
      u'true'
    ),
    (
      u'script-src-referrerpolicy-no-referrer',
      u'utf-8',
      u'<script src="{}" referrerpolicy=no-referrer></script>',
      u'true',
      u'true'
    ),
    (
      u'link-no-rel',
      u'utf-8',
      u'<link href="{}">',
      u'false',
      u'true'
    ),
    (
      u'link-rel-stylesheet',
      u'utf-8',
      u'<link rel=stylesheet href="{}">',
      u'true',
      u'true'
    ),
    (
      u'link-rel-alternate-stylesheet',
      u'utf-8',
      u'<link rel="alternate stylesheet" href="{}">',
      u'false',
      u'true'
    ),
    (
      u'link-rel-stylesheet-disabled',
      u'utf-8',
      u'<link rel="stylesheet" href="{}" disabled>',
      u'false',
      u'true'
    ),
    (
      u'link-rel-stylesheet-nomatch-media',
      u'utf-8',
      u'<link rel=stylesheet href="{}" media="not all">',
      u'false',
      u'true'
    ),
    (
      u'link-rel-stylesheet-unsupported-type',
      u'utf-8',
      u'<link rel=stylesheet href="{}" type=text/plain>',
      u'false',
      u'true'
    ),
    (
      u'link-rel-stylesheet-type-text-css',
      u'utf-8',
      u'<link rel=stylesheet href="{}" type=text/css>',
      u'true',
      u'true'
    ),
    (
      u'link-rel-stylesheet-crossorigin',
      u'utf-8',
      u'<link rel=stylesheet href="{}" crossorigin>',
      u'true',
      u'true'
    ),
    (
      u'link-rel-stylesheet-integrity',
      u'utf-8',
      u'<link rel=stylesheet href="{}" integrity="sha384-OLBgp1GsljhM2TJ+sbHjaiH9txEUvgdDTAzHv2P24donTt6/529l+9Ua0vFImLlb">',
      u'true',
      u'true'
    ),
    (
      u'link-rel-stylesheet-referrerpolicy-no-referrer',
      u'utf-8',
      u'<link rel=stylesheet href="{}" referrerpolicy=no-referrer>',
      u'true',
      u'true'
    ),
    (
      u'link-rel-preload-as-style',
      u'utf-8',
      u'<link rel=preload as=style href="{}">',
      u'true',
      u'true'
    ),
    (
      u'link-rel-preload-as-font-crossorigin',
      u'utf-8',
      u'<link rel=preload as=font href="{}" crossorigin>',
      u'true',
      u'true'
    ),
    (
      u'link-rel-preload-as-script',
      u'utf-8',
      u'<link rel=preload as=script href="{}">',
      u'true',
      u'true'
    ),
    (
      u'link-rel-preload-as-image',
      u'utf-8',
      u'<link rel=preload as=image href="{}">',
      u'true',
      u'true'
    ),
    (
      u'img-src',
      u'utf-8',
      u'<img src="{}">',
      u'true',
      u'true'
    ),
    (
      u'img-data-src',
      u'utf-8',
      u'<img data-src="{}">',
      u'false',
      u'true'
    ),
    (
      # <image> is turned into <img> in the tree builder
      u'image-src',
      u'utf-8',
      u'<image src="{}">',
      u'true',
      u'true'
    ),
    (
      u'img-srcset',
      u'utf-8',
      u'<img srcset="{}">',
      u'true',
      u'true'
    ),
    (
      u'img-src-crossorigin',
      u'utf-8',
      u'<img src="{}" crossorigin>',
      u'true',
      u'true'
    ),
    (
      u'img-src-referrerpolicy-no-referrer',
      u'utf-8',
      u'<img src="{}" referrerpolicy=no-referrer>',
      u'true',
      u'true'
    ),
    (
      u'img-src-loading-lazy',
      u'utf-8',
      u'<img src="{}" loading=lazy>',
      u'false',
      u'false'
    ),
    (
      u'picture-source-unsupported-type',
      u'utf-8',
      u'<picture><source srcset="{}" type=text/plain><img></picture>',
      u'false',
      u'true'
    ),
    (
      u'picture-source-nomatch-media',
      u'utf-8',
      u'<picture><source srcset="{}" media="not all"><img></picture>',
      u'false',
      u'true'
    ),
    (
      u'picture-source-no-img',
      u'utf-8',
      u'<picture><source srcset="{}"></picture>',
      u'false',
      u'true'
    ),
    (
      u'picture-source-br-img',
      u'utf-8',
      u'<picture><source srcset="{}"><br><img></picture>',
      u'true',
      u'true'
    ),
    (
      u'video-poster',
      u'utf-8',
      u'<video poster="{}"></video>',
      u'true',
      u'true'
    ),
    (
      u'xmp-script-src',
      u'utf-8',
      u'<xmp><script src="{}"></script></xmp>',
      u'false',
      u'true'
    ),
    (
      # MathML doesn't have script
      u'math-script-src',
      u'utf-8',
      u'<math><script src="{}"></script></math>',
      u'false',
      u'true'
    ),
    (
      u'math-font-script-src',
      u'utf-8',
      u'<math><font><script src="{}"></script></font></math>',
      u'false',
      u'true'
    ),
    (
      # This breaks out of foreign content, so the script is an HTML script
      # https://html.spec.whatwg.org/multipage/#parsing-main-inforeign
      u'math-font-face-script-src',
      u'utf-8',
      u'<math><font face><script src="{}"></script></font></math>',
      u'true',
      u'true'
    ),
    (
      u'svg-script-href',
      u'utf-8',
      u'<svg><script href="{}"></script></svg>',
      u'true',
      u'true'
    ),
    (
      u'svg-script-xlinkhref',
      u'utf-8',
      u'<svg><script xlink:href="{}"></script></svg>',
      u'true',
      u'true'
    ),
    (
      # SVG script element doesn't have a src attribute
      u'svg-script-src',
      u'utf-8',
      u'<svg><script src="{}"></script></svg>',
      u'false',
      u'true'
    ),
    (
      u'svg-image-href',
      u'utf-8',
      u'<svg><image href="{}"></image></svg>',
      u'true',
      u'true'
    ),
    (
      u'svg-image-xlinkhref',
      u'utf-8',
      u'<svg><image xlink:href="{}"></image></svg>',
      u'true',
      u'true'
    ),
    (
      # SVG image element doesn't have a src attribute
      u'svg-image-src',
      u'utf-8',
      u'<svg><image src="{}"></image></svg>',
      u'false',
      u'true'
    ),
]

tests = [
    # title,
    # encoding,
    # template_testcase_markup,
    # expect_load,
    # test_nonspeculative
]

# Templates

preamble = u"""<!DOCTYPE html>
<!-- DO NOT EDIT. This file has been generated. Source:
     /html/syntax/speculative-parsing/tools/generate.py
-->"""

# Notes on `encodingcheck` in the URL below
#
# - &Gbreve; is the HTML character reference for U+011E LATIN CAPITAL LETTER G WITH BREVE
# - In windows-1254, this character is encoded as 0xD0.
#   When used in the query part of a URL, it gets percent-encoded as %D0.
# - In windows-1252 (usually the fallback encoding), that character can't be encoded, so is instead
#   represented as &#286; percent-encoded, so %26%23286%3B.
#   https://url.spec.whatwg.org/#query-state
#   https://url.spec.whatwg.org/#code-point-percent-encode-after-encoding
# - In utf-8, it's percent-encoded as utf-8: %C4%9E
# - stash.py will store this value as "param-encodingcheck"

url_wptserve_sub = u"/html/syntax/speculative-parsing/resources/stash.py?action=put&amp;uuid={{GET[uuid]}}&amp;encodingcheck=&Gbreve;"
url_js_sub = u"/html/syntax/speculative-parsing/resources/stash.py?action=put&amp;uuid=${uuid}&amp;encodingcheck=&Gbreve;"


# Nonspeculative (normal) case to compare results with

template_nonspeculative = u"""{preamble}
{encoding_decl}
<title>Speculative parsing, non-speculative (helper file): {title}</title>
non-speculative case
{testcase_markup}
<!-- block the load event for a bit: -->
<script src="/common/slow.py?delay={delay}"></script>
"""

# Scenario: page load

template_pageload_toplevel = u"""{preamble}
{encoding_decl}
<title>Speculative parsing, page load: {title}</title>
<script src=/resources/testharness.js></script>
<script src=/resources/testharnessreport.js></script>
<script src=/common/utils.js></script>
<script src=/html/syntax/speculative-parsing/resources/speculative-parsing-util.js></script>
<body>
<script>
  setup({{single_test: true}});
  const uuid = token();
  const iframe = document.createElement('iframe');
  iframe.src = `resources/{title}-framed.sub.html?uuid=${{uuid}}`;
  document.body.appendChild(iframe);
  expect_fetched_onload(uuid, {expect_load})
    .then(compare_with_nonspeculative(uuid, '{title}', {test_nonspeculative}))
    .then(done);
</script>
"""

template_pageload_framed = u"""{preamble}
{encoding_decl}
<title>Speculative parsing, page load (helper file): {title}</title>
<script src="/common/slow.py?delay={delay}"></script>
<script>
  document.write('<plaintext>');
</script>
speculative case
{testcase_markup}
"""

# Scenario: document.write()

template_docwrite = u"""{preamble}
{encoding_decl}
<title>Speculative parsing, document.write(): {title}</title>
<script src=/resources/testharness.js></script>
<script src=/resources/testharnessreport.js></script>
<script src=/common/utils.js></script>
<script src=/html/syntax/speculative-parsing/resources/speculative-parsing-util.js></script>
<script>
  setup({{single_test: true}});
  const uuid = token();
  expect_fetched_onload(uuid, {expect_load})
    .then(compare_with_nonspeculative(uuid, '{title}', {test_nonspeculative}))
    .then(done);
  document.write(`
    <script src="/common/slow.py?delay={delay}"><\\/script>
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
{encoding_decl}
<title>Speculative parsing, prerender: {title}</title>
...
"""

template_prerender_linked = u"""{preamble}
{encoding_decl}
<title>Speculative parsing, prerender (helper file): {title}</title>
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

def generate_tests(testcase, tentative):
    title, encoding, template_testcase_markup, expect_load, test_nonspeculative = testcase
    ext = u""
    if tentative:
        ext = u".tentative"

    if encoding is None:
        encoding_decl = u"<!-- no meta charset -->"
    else:
        encoding_decl = f"<meta charset={encoding}>"

    html_testcase_markup = template_testcase_markup.format(url_wptserve_sub)
    js_testcase_markup = template_testcase_markup.format(url_js_sub).replace(u"</script>", u"<\/script>")

    if test_nonspeculative is u'true':
        nonspeculative = template_nonspeculative.format(preamble=preamble, encoding_decl=encoding_decl, title=title, testcase_markup=html_testcase_markup, delay=delay)
        write_file(f"resources/{title}-nonspeculative.sub.html", nonspeculative)

    pageload_toplevel = template_pageload_toplevel.format(preamble=preamble, encoding_decl=encoding_decl, title=title, expect_load=expect_load, test_nonspeculative=test_nonspeculative)
    write_file(f"page-load/{title}{ext}.html", pageload_toplevel)
    pageload_framed = template_pageload_framed.format(preamble=preamble, encoding_decl=encoding_decl, title=title, testcase_markup=html_testcase_markup, delay=delay)
    write_file(f"page-load/resources/{title}-framed.sub.html", pageload_framed)

    docwrite = template_docwrite.format(preamble=preamble, encoding_decl=encoding_decl, title=title, expect_load=expect_load, testcase_markup=js_testcase_markup, test_nonspeculative=test_nonspeculative, delay=delay)
    write_file(f"document-write/{title}{ext}.sub.html", docwrite)

for testcase in tests:
    generate_tests(testcase, False)

for testcase in tentative_tests:
    generate_tests(testcase, True)
