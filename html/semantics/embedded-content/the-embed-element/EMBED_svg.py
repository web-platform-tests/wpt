#!/usr/bin/python2

import re

# definition of test cases.
# We will use the names to parse the options for the code
# Additionally we already define if we expect the test to fail (assert_throws)
# or to pass (assert_true)
# if not set the test is executed inside the embedded document
tests = [
        ("HD_A_embed_ED_A_r", "success"),
        ("HD_A_embed_ED_A_w", "success"),
        ("HD_A_embed_ED_B_r", "fail"),
        ("HD_A_embed_ED_B_w", "fail"),
        ]

head = """
<!DOCTYPE html>
<html>
<head>
    <title>EMBED with SVG test cases</title>
    <script src="/resources/testharness.js"></script>
    <script src="/resources/testharnessreport.js"></script>
</head>
<body>
    <script type="text/javascript">
"""

foot = """
    </script>
    <div id="log"></div>
"""

def main(request, response):
    global tests, head, foot

    origins = {
                "A" : "http://" + request.server.config["domains"][""][""] + ":" + str(request.server.config["ports"]["http"][0]),
                "B" : "http://" + request.server.config["domains"][""]["www2"] + ":" + str(request.server.config["ports"]["http"][0])
            }

    response.headers.set("Content-type", "text/html")

    content = ""

    for (testname, expected) in tests:
        settings = parse_testname(testname)

        privilege = get_privilege(settings)

        description = "{} - {} to {} - {} {}".format(
                                                    settings["ee"],
                                                    settings["from"],
                                                    settings["to"],
                                                    "cross-origin" if(settings["from_domain"] != settings["to_domain"]) else "same-origin",
                                                    privilege
                                                    )

        if(privilege == "write" and settings["from"] == "ED"):
            foot += """<div id="loadbar_{}" style="display:none"><p>Not empty</p></div>""".format(description)


        if(settings["from"] == "ED" or privilege == "execute"):
            content += """
    function f_test_{}(){{
    var ee = document.createElement('{}');
    ee.width = 0;
    ee.height = 0;
    ee.src = "{}/html/semantics/embedded-content/resources/svg_script.py?operation={}&description={}";
    document.body.appendChild(ee);
    fetch_tests_from_window(ee.contentWindow);
    }}""".format(
                testname,
                settings["ee"],
                origins[settings["from_domain"]] if(privilege != "execute") else origins[settings["to_domain"]],
                privilege,
                description
                )
        elif(settings["from"] == "HD"):
            content += """var test_{} =  async_test("{}");\n""".format(
                                                                        testname,
                                                                        description
                                                                      )
            content += "function f_test_{}(){{\n".format(testname)
            payload = get_test_payload(expected, privilege, testname, description)

            content += """
    var ee = document.createElement('{}');
    ee.width = 0;
    ee.height = 0;
    ee.onload = test_{}.step_func_done(function() {{
    {}
    }})
    ee.src = "{}/html/semantics/embedded-content/resources/svg.py";
    document.body.appendChild(ee);
    }}""".format(
                settings["ee"],
                testname,
                payload,
                origins[settings["to_domain"]]
                )

        content += "\nf_test_{}();\n\n".format(testname)


    foot += """
    </body>
</html>"""

    return head + content + foot



# parse_testname
# @param1 testname to be parsed
# @return dictionary with values parsed from @param1
#
def parse_testname(name):
    # HD_A_CANVAS_with_mp4ogg_ED_B_r_cross_origin__not_set__origin__not_set__credentials__not_set_
    parsed_data = re.match(r'^(?P<from>[EH]D)_(?P<from_domain>[AB])_(?P<ee>\w+?)_(?P<to>[EH]D)_(?P<to_domain>[AB])_(?P<privilege>[rwx])$', name)
    if(not parsed_data):
        return "ERROR: supplied test name is invalid"

    return parsed_data.groupdict()

def get_privilege(settings):
    privilege = ""
    if(settings["privilege"] == "r"):
        privilege = "read"
    elif(settings["privilege"] == "w"):
        privilege = "write"
    elif(settings["privilege"] == "x"):
        privilege = "execute"
    else:
        throw("ERROR: Unrecognized privilege")

    if(settings["from_domain"] != settings["to_domain"] and settings["from"] == "ED"):
        if(privilege != "execute"):
            privilege = "partial " + privilege

    return privilege

def get_test_payload(expected, privilege, testname, description):
    payload = "assert_true(false, 'An error occured when contructing the payload in the python script');"
    if(expected == "fail"):
        payload = """
assert_equals(ee.getSVGDocument(), null);"""

    elif(privilege == "write"):
        payload = """
svgDoc = ee.getSVGDocument();
var firstChild = svgDoc.documentElement.firstElementChild;
assert_not_equals(firstChild, null);
svgDoc.documentElement.removeChild(firstChild);
var firstChild = svgDoc.documentElement.firstElementChild;
assert_equals(firstChild, null);"""

    elif(privilege == "read"):
        payload = """
svgDoc = ee.getSVGDocument();
var firstChildName = svgDoc.documentElement.firstElementChild.nodeName;
assert_equals(firstChildName, "rect");"""

    return payload