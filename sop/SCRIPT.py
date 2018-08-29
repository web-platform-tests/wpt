#!/usr/bin/python2

import re

# definition of test cases.
# We will use the names to parse the options for the code
# Additionally we already define if we expect the test to fail (assert_throws)
# or to pass (assert_true)
tests = [
        ("HD_A_script_ED_A_r", ""),
        ("HD_A_script_ED_A_w", ""),
        ("HD_A_script_ED_A_x", ""),
        ("ED_A_script_HD_A_r", ""),
        ("ED_A_script_HD_A_w", ""),
        ("HD_A_script_ED_B_r", ""),
        ("HD_A_script_ED_B_w", ""),
        ("HD_A_script_ED_B_x", ""),
        ("ED_B_script_HD_A_r", ""),
        ("ED_B_script_HD_A_w", "")
        ]

head = """
<!DOCTYPE html>
<html>
<head>
    <title>SCRIPT test cases</title>
    <script src="/resources/testharness.js"></script>
    <script src="/resources/testharnessreport.js"></script>
</head>
<body>
    <script type="text/javascript">
"""

foot = """
    </script>
    <div id="log"></div>
</body>
</html>
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

        test_check = ""

        script_file = "js.py"

        if(settings["from"] == "HD" and settings["privilege"] != "x"):
            if(settings["privilege"] == "r"):
                test_check = """
                ee.onload = test_{0}.step_func_done(function(){{
                    var source = embedded_f_test_{0}.toString();
                    assert_greater_than(source.indexOf("secret"), 0);
                }})
                """.format(testname)
            elif(settings["privilege"] == "w"):
                test_check = """
                ee.onload = test_{0}.step_func_done(function(){{
                    var oldSecret = embedded_f_test_{0}();
                    embedded_f_test_{0} = function() {{return 1;}};
                    var newSecret = embedded_f_test_{0}();
                    assert_equals(oldSecret, 42);
                    assert_equals(newSecret, 1);
                }})
            """.format(testname)

            content += """var test_{} = async_test("SCRIPT - {} to {} - {} - {}");\n""".format(testname,
                                                                                            settings["from"],
                                                                                            settings["to"],
                                                                                            "cross-origin" if(settings["from_domain"] != settings["to_domain"]) else "same-origin",
                                                                                            privilege
                                                                                            )
        else:
            script_file = "js_script.py"


        if(settings["from"] == "ED" and settings["privilege"] == "w"):
            foot += """<div id="loadbar_SCRIPT - {} {} to {} {} - {} - {}" style="display: none"><p>Not empty</p></div>""".format(
                                                                                                                                    settings["from"],
                                                                                                                                    settings["from_domain"],
                                                                                                                                    settings["to"],
                                                                                                                                    settings["to_domain"],
                                                                                                                                    "same-origin" if settings["from_domain"] == settings["to_domain"] else "cross-origin",
                                                                                                                                    privilege
                                                                                                                                    )


        content += "function f_test_{}(){{\n".format(testname)

        if(script_file == "js.py"):
            content += """
                var ee = document.createElement('script');
                {}
                ee.src = '{}/sop/resources/js.py?script_name=embedded_f_test_{}';
                document.body.appendChild(ee);
            }}
            """.format(
                    test_check,
                    origins["A"] if(settings["from_domain"] == settings["to_domain"]) else origins["B"],
                    testname
                    )
        else:
            content +="""
                var ee = document.createElement('script');
                ee.src = '{}/sop/resources/js_script.py?operation={}&description=SCRIPT - {} {} to {} {} - {} - {}';
                document.body.appendChild(ee);
            }}
            """.format(
                        origins["A"] if(settings["from_domain"] == settings["to_domain"]) else origins["B"],
                        privilege,
                        settings["from"],
                        settings["from_domain"],
                        settings["to"],
                        settings["to_domain"],
                        "same-origin" if settings["from_domain"] == settings["to_domain"] else "cross-origin",
                        privilege
                        )

        content += "f_test_{}();\n\n".format(testname)

    return head + content + foot



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