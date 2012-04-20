#!/usr/bin/env python

import argparse
import json

class TestGenerator:
    """Class used for generating an .xht file for each test defined by entries
       in the json file."""

    def __init__(self, harness_url, vendor, tests):
        self.harness_url = harness_url
        self.vendor = vendor
        self.spec_url = tests["SPEC_URL"]
        self.tests = tests

    def getTestFileName(self, file_prefix, idx):
        return file_prefix + str(idx+1).rjust(3, '0') + ".xht"

    def getSpecURL(self):
        return self.spec_url

    def getSpecSectionURL(self, spec_section):
        return self.getSpecURL() + spec_section

    def getVendorPrefix(self):
        return "-"+self.vendor+"-"

    def getHarnessURL(self):
        return self.harness_url

    def generateTest(self, file_prefix, spec_section, idx, test):
        file_name = self.getTestFileName(file_prefix, idx)
        print file_name
        test["SPEC_SECTION"] = self.getSpecSectionURL(spec_section)
        test["VENDOR_PREFIX"] = self.getVendorPrefix()
        test["HARNESS_URL"] = self.getHarnessURL()
        file = open(file_name, "w")
        file.write(self.test_file_template.format(**test))
        file.close()

    def generateGroup(self, group):
        file_prefix = group["FILE_PREFIX"]
        spec_section = group["SPEC_SECTION"]

        for i,test in enumerate(group["TESTS"]):
            self.generateTest(file_prefix, spec_section, i, test)

    def generateTests(self):
        for group in self.tests["GROUPS"]:
            self.generateGroup(group)

    test_file_template = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
 <head>
  <title>CSS Test: {DESCRIPTION}</title>
  <link rel="author" title="{AUTHOR_NAME}" href="mailto:{AUTHOR_EMAIL}"/>
  <link rel="help" href="{SPEC_SECTION}"/>
  <meta name="flags" content="visual scroll {TOKENS}" />
  <meta name="assert" content="{ASSERTION}"/>
  <script src="{HARNESS_URL}testharness.js" type="text/javascript" />
  <script src="{HARNESS_URL}testharnessreport.js" type="text/javascript" />
  <style type="text/css"><![CDATA[
   body {{ margin: 0; }}
   html, body, #test {{ width: 100%; height: 100%; }}
   #log {{ padding: 1em; display: none; }}
   /* Reset viewport values to initial values to ignore UA stylesheet. */
   @{VENDOR_PREFIX}viewport {{
    width: auto;
    height: auto;
    zoom: auto;
    min-zoom: auto;
    max-zoom: auto;
    user-zoom: zoom;
    orientation: auto;
    resolution: auto;
   }}
  ]]></style>
  <style type="text/css"><![CDATA[
   /* CSS for the test below. */
   @{VENDOR_PREFIX}viewport {{
    {VIEWPORT_DESC}
   }}
   /* Set root element font-size to something different from the initial
      font-size to make sure 'rem' and 'em' for @viewport is based on the
      initial font-size, not the root element font-size. */
   html {{ font-size: 2rem; }}
   body {{ font-size: 0.5rem; }}
  ]]></style>
  <script type="text/javascript"><![CDATA[
   var test = async_test("CSS Test: {DESCRIPTION}");
   window.onload = function(){{

    /* Disable the stylesheet that contains the @viewport to test. */
    document.styleSheets.item(1).disabled = true;

    /* Initialize an object to store viewport values to be used by the test
       asserts. */
    var viewport = new Object();

    /* An element with the same size as the initial containing block. */
    var testElm = document.getElementById("test");

    /* Retrieve the initial viewport values before applying the @viewport to
       test. */
    viewport.initialWidth = testElm.offsetWidth;
    viewport.initialHeight = testElm.offsetHeight;
    viewport.fontSize = parseInt(getComputedStyle(testElm, "").fontSize);

    /* Enable the stylesheet that contains the @viewport to test. */
    document.styleSheets.item(1).disabled = false;

    /* Retrieve the actual viewport values for the test. */
    viewport.actualWidth = testElm.offsetWidth;
    viewport.actualHeight = testElm.offsetHeight;
    viewport.zoom = viewport.initialWidth / window.innerWidth;

    /* Check viewport values. */
    test.step(function(){{
        {TEST_FUNCTION}
    }});

    /* Finished. Show the results. */
    test.done();
    document.styleSheets.item(1).disabled = true;
    document.getElementById("log").style.display = "block";
   }}
  ]]></script>
 </head>
 <body>
  <div id="test">
   <div id="log">Test not run. Javascript required.</div>
  </div>
 </body>
</html>
"""

def main():
    parser = argparse.ArgumentParser(description="Generate the CSS Device Adaptation testsuite.", formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument("-u", "--harness-url", default="http://w3c-test.org/resources/", help="The URL of the directory where the testharness files are found.")
    parser.add_argument("-v", "--vendor", default="", help="The vendor string used for @viewport and corresponding CSSOM names. For instance 'o' for @-o-viewport. By default, no prefix will be added.")
    parser.add_argument("infile", type=file, help="The input .json file which contains the tests.")

    args = parser.parse_args()
    tests = json.load(args.infile)

    generator = TestGenerator(args.harness_url, args.vendor, tests)

    print "\nGenerating tests for " + generator.getSpecURL() + ":\n"

    generator.generateTests()

    print "\nDone.\n"

if __name__ == '__main__':
    main()
