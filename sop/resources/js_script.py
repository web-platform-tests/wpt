import os
import sys

# unless I want to app all the code for CORS in every file I have to do this to import the code
sys.path.append(os.path.dirname(__file__))

from cors_utils import cors

# Function to return a javascript and
# to apply CORS response header according
# to the GET parameters
#
def main(request, response):
    cors(request, response)
    # Set content type, this file only returns javascript code
    response.headers.set("Content-type", "text/javascript")

    description = "No description provided"
    test_code = ""

    if "description" in request.GET:
        description = request.GET.first("description")


    if "operation" in request.GET:
        operation = request.GET.first("operation")


        if operation == "read":
            test_code = """
assert_greater_than(document.documentElement.innerHTML.length, 0);"""
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
assert_true(true);
"""

    script = """
test(function(t) {{
    {}
}}, '{}');
""".format(
        test_code,
        description
        )

    return script
