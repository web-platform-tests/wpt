import os
import sys

# unless I want to app all the code for CORS in every file I have to do this to import the code
sys.path.append(os.path.dirname(__file__))

from cors_utils import cors

# Function to return a simple HTML document containing JavaScript code and
# to apply CORS response header according
# to the GET parameters
#
def main(request, response):
    cors(request, response)
    response.headers.set("Content-type", "text/html")

    description = "No description provided"
    test_code = ""

    if "description" in request.GET:
        description = request.GET.first("description")

    if "operation" in request.GET:
        operation = request.GET.first("operation")

        if operation == "read":
            test_code = """
    var p = window.parent;
    assert_greater_than(p.document.documentElement.innerHTML.length, 0);
    """
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
        elif operation == "partial write fail":
            test_code = """
    assert_throws("SECURITY_ERR", function(){{window.parent.document}});"""
        elif operation == "partial write success":
            test_code = """
        top.location = TheLocation + '#test'; // leads to the result page not loading properly
        assert_true(true);"""

    html = """
<html>
    <head>
        <title>ED: HTML</title>
        <script src='/resources/testharness.js'></script>
    </head>
    <body>
    <h1 id="h1">ED: HTML</h1>
    <script>
    test(function() {{
    {}
    }}, '{}');
    </script>
    </body>
</html>
""".format(test_code, description)

    return html

