import os
import sys

# unless I want to app all the code for CORS in every file I have to do this to import the code
sys.path.append(os.path.dirname(__file__))

from cors_utils import cors

# Function to return a svg image and
# apply CORS response header according
# to the GET parameters
#
def main(request, response):
    cors(request, response)
    # Set content type, this file only returns svg pictures
    response.headers.set("Content-type", "image/svg+xml")

    description = "No description provided"
    test_code = ""

    if "description" in request.GET:
        description = request.GET.first("description")

    if "operation" in request.GET:
        operation = request.GET.first("operation")
        if operation == "read":
            test_code = """
var p = window.parent;
assert_greater_than(p.document.documentElement.innerHTML.length, 0);"""
        elif operation == "write":
            test_code = """
var pDoc = window.parent.document;
var text = pDoc.createElement("acronym");
text.setAttribute("title", "Test for write access to HD");
text.appendChild(pDoc.createTextNode("yes"));
var target = pDoc.getElementById("loadbar_{}");
target.innerHTML = "";
assert_equals(target.innerHTML, "");
target.appendChild(text);
assert_equals(target.firstChild, text);""".format(description)
        elif operation == "execute":
            test_code = """
assert_true(true);"""
        elif operation == "partial read":
            test_code = """
var p = window.parent;
assert_greater_than(p.frames.length, 0);"""
        elif operation == "partial write":
            test_code = """
assert_throws("SECURITY_ERR", function(){{window.parent.document}});""" # we can always write to window.parent.location but shouldn't be able to access window.parent.document
        else:
            test_code = "assert_true(false, 'Provided operation was neither read, write or execute.');"

    content = """
<svg id="svgroot" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" height="111" width="111">
    <rect width="111" height="111" style="fill:rgb(255,0,0);" />
    <script xlink:href="/resources/testharness.js"/>
    <script>
        test(function(t) {{
            {}
        }}, '{}');
    </script>
</svg>
    """.format(
        test_code,
        description
        )

    return content