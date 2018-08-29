#!/usr/bin/python2

import re

# definition of test cases.
# We will use the names to parse the options for the code
# Additionally we already define if we expect the test to fail (assert_throws)
# or to pass (assert_true)
tests = [
        ("HD_A_object_ED_A_x"),
        ("ED_A_object_HD_A_r"),
        ("ED_A_object_HD_A_w"),
        ("HD_A_object_ED_B_x"),
        ("ED_B_object_HD_A_r"),
        ("ED_B_object_HD_A_w")
        ]

head = """
<!DOCTYPE html>
<html>
<head>
    <title>IFRAME, EMBED, OBJECT with SVG test cases - bugged in FF</title>
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

    for (testname) in tests:
        settings = parse_testname(testname)

        privilege = get_privilege(settings)

        description = "{} - {} to {} - {} {}".format(
                                                    settings["ee"],
                                                    settings["from"],
                                                    settings["to"],
                                                    "cross-origin" if(settings["from_domain"] != settings["to_domain"]) else "same-origin",
                                                    privilege
                                                    )

        if(privilege == "write"):
            foot += """<div id="loadbar_{}" style="display:none"><p>Not empty</p></div>""".format(description)

        content += "function f_test_{}(){{\n".format(testname)

        content += """
    var ee = document.createElement('{}');
    ee.width = 0;
    ee.height = 0;
    ee.data = "{}/sop/resources/svg_script.py?operation={}&description={}";
    document.body.appendChild(ee);
    fetch_tests_from_window(ee.contentWindow);
    }}""".format(
                settings["ee"],
                origins[settings["from_domain"]],
                privilege,
                description
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