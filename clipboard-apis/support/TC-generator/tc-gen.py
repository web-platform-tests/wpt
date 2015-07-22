# TC-gen.py
# This script extracts all tests from the spec text and
# builds the test suite

import os, re, codecs

spec_path = os.path.abspath(os.path.dirname(__file__)+os.sep+'..'+os.sep+'index.html')
tc_path = os.path.abspath(os.path.dirname(__file__)+os.sep+'..'+os.sep+'testsuite')+os.sep

tc_path = "C:\\mozilla\\web-platform-tests\\clipboard-apis\\"

template = u"""<!DOCTYPE html>
<html><head>
    <meta charset="UTF-8">
    <title>  ClipboardEvent - {title}</title>
    <script src="/resources/testharness.js"></script>
    <script src="/resources/testharnessreport.js"></script>
    <script src="support/_lib.js"></script>
    <script>
{test_javascript_code}
    </script>
</head>
<body>

    <p>FAILED (This TC requires JavaScript enabled)</p>
    {test_html}
    <div id="log"></div>
    <script>
    var dataToPaste={data_to_paste};
    var externalPassCondition={external_pass_condition};
    var eventTarget={event_target};
    var eventType='{event_type}';
    window.onload=function(){{
        setupTest( eventTarget, eventType, dataToPaste, externalPassCondition );
    }}
    </script>
</body></html>
"""


default_event_target = 'document' # Note: include quotes in string if passing a string..
default_test_html = '<form><input id="input_text" autofocus onfocus="this.select()" value="copied text"></form>'

f = codecs.open(spec_path, 'r', 'UTF-8')
spec_text = f.read()
f.close()
r = re.compile('<script>\s*(/\*\* (?P<title>.+?)\*/\s*\n(?P<script>.+?))</script>', re.I | re.S)
testcounter = 1
rubytemplate = """
describe "Clipboard events testsuite" do
  before(:all) do
    @browser = OperaWatir::Browser.new
    $base = '/web-platform-tests/clipboard-apis/testsuite/'
  end
%s
end
"""
rubycode=""
rbatom = """
    it "%i %s" do
        doSingleTest %i
    end
"""
for match in re.finditer(r, spec_text):
    test_info = {"title":match.groupdict()["title"], "test_javascript_code":match.groupdict()["script"], "data_to_paste":"''", "targets":default_event_target, "external_pass_condition":"null", "test_html":default_test_html}
    test_info["test_javascript_code"] = "/** %s */\n%s" % (test_info["title"], test_info["test_javascript_code"]) # add title comment back..
    test_data_map = { "Test HTML":"test_html", "Events":"events", "Targets":"targets", "paste data":"data_to_paste", "External pass condition - clipboard data":"external_pass_condition" }
    for name in test_data_map:
        value = test_data_map[name]
        rx = re.compile(r"\/\*\s*"+name+": (.+?)\*\/", re.S)
        try:
            test_info[value] = re.search(rx, test_info['test_javascript_code']).group(1)
            if name is 'Test HTML' and '<\\/script' in test_info[value]:
                test_info[value] = test_info[value].replace('<\\/script', '</script')
        except Exception, e:
            test_info.setdefault(value, '')
            continue
    if 'events' in test_info:
        test_info['events'] = test_info['events'].strip().split(' ')
    if 'targets' in test_info:
        test_info['targets'] = test_info['targets'].strip().split(' ')
    rubycode += rbatom % (testcounter, test_info['title'], testcounter)
    base_title = test_info['title']
    for event in test_info['events']:
        for target in test_info['targets']:
            test_info['event_type'] = event
            test_info['event_target'] = target
            test_info['title'] = base_title + ' - ' + event + ' on ' + target
            fn = re.sub('[ ]+', '_', re.sub('[^a-zA-Z0-9 ]+', '', test_info['title'])).lower() + '.html'
            f = codecs.open(tc_path + fn, 'w', 'UTF-8')
            f.write(template.format(**test_info))
            f.close()
            testcounter += 1
            print('wrote %s, %s'%(fn, test_info['title']))

f=open(tc_path+'testlist.rb', 'w')
f.write(rubytemplate % rubycode)
f.close()