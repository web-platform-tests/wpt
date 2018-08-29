#!/usr/bin/python2

import re

# definition of test cases.
# We will use the names to parse the options for the code
# Additionally we already define if we expect the test to fail (assert_throws)
# or to pass (assert_true)
# if not set the test is executed inside the embedded document
tests = [
        ("HD_A_iframe_ED_A_html_sandbox__not_set__r", "success"),
        ("HD_A_iframe_ED_A_html_sandbox__not_set__w", "success"),
        ("HD_A_iframe_ED_A_html_sandbox__not_set__x", "success"),
        ("HD_A_iframe_ED_A_html_sandbox__empty_value__r", "fail"),
        ("HD_A_iframe_ED_A_html_sandbox__empty_value__w", "fail"),
        ("HD_A_iframe_ED_A_html_sandbox__allow_scripts__r", "fail"),
        ("HD_A_iframe_ED_A_html_sandbox__allow_scripts__w", "fail"),
        ("HD_A_iframe_ED_A_html_sandbox__allow_scripts__x", "success"),
        ("HD_A_iframe_ED_A_html_sandbox__allow_same_origin__r", "success"),
        ("HD_A_iframe_ED_A_html_sandbox__allow_same_origin__w", "success"),
        ("HD_A_iframe_ED_A_html_sandbox__allow_top_navigation__r", "fail"),
        ("HD_A_iframe_ED_A_html_sandbox__allow_top_navigation__w", "fail"),
        ("HD_A_iframe_ED_A_html_sandbox__allow_scripts_allow_same_origin__r", "success"),
        ("HD_A_iframe_ED_A_html_sandbox__allow_scripts_allow_same_origin__w", "success"),
        ("HD_A_iframe_ED_A_html_sandbox__allow_scripts_allow_same_origin__x", "success"),
        ("HD_A_iframe_ED_A_html_sandbox__allow_scripts_allow_top_navigation__r", "fail"),
        ("HD_A_iframe_ED_A_html_sandbox__allow_scripts_allow_top_navigation__w", "fail"),
        ("HD_A_iframe_ED_A_html_sandbox__allow_scripts_allow_top_navigation__x", "success"),
        ("HD_A_iframe_ED_A_html_sandbox__allow_same_origin_allow_top_navigation__r", "success"),
        ("HD_A_iframe_ED_A_html_sandbox__allow_same_origin_allow_top_navigation__w", "success"),
        ("HD_A_iframe_ED_A_html_sandbox__allow_scripts_allow_same_origin_allow_top_navigation__r", "success"),
        ("HD_A_iframe_ED_A_html_sandbox__allow_scripts_allow_same_origin_allow_top_navigation__w", "success"),
        ("HD_A_iframe_ED_A_html_sandbox__allow_scripts_allow_same_origin_allow_top_navigation__x", "success"),
        ("ED_A_iframe_HD_A_html_sandbox__not_set__r", "success"),
        ("ED_A_iframe_HD_A_html_sandbox__not_set__w", "success"),
        ("ED_A_iframe_HD_A_html_sandbox__allow_scripts__r", "success"),
        ("ED_A_iframe_HD_A_html_sandbox__allow_scripts__w", "success"),
        ("ED_A_iframe_HD_A_html_sandbox__allow_scripts_allow_same_origin__r", "success"),
        ("ED_A_iframe_HD_A_html_sandbox__allow_scripts_allow_same_origin__w", "success"),
        ("ED_A_iframe_HD_A_html_sandbox__allow_scripts_allow_top_navigation__r", "success"),
        ("ED_A_iframe_HD_A_html_sandbox__allow_scripts_allow_same_origin_allow_top_navigation__r", "success"),
        ("ED_A_iframe_HD_A_html_sandbox__allow_scripts_allow_same_origin_allow_top_navigation__w", "success"),
        ("HD_A_iframe_ED_B_html_sandbox__not_set__r", "fail"),
        ("HD_A_iframe_ED_B_html_sandbox__not_set__w", "fail"),
        ("HD_A_iframe_ED_B_html_sandbox__not_set__x", "success"),
        ("HD_A_iframe_ED_B_html_sandbox__empty_value__r", "fail"),
        ("HD_A_iframe_ED_B_html_sandbox__empty_value__w", "fail"),
        ("HD_A_iframe_ED_B_html_sandbox__allow_scripts__r", "fail"),
        ("HD_A_iframe_ED_B_html_sandbox__allow_scripts__w", "fail"),
        ("HD_A_iframe_ED_B_html_sandbox__allow_scripts__x", "success"),
        ("HD_A_iframe_ED_B_html_sandbox__allow_same_origin__r", "fail"),
        ("HD_A_iframe_ED_B_html_sandbox__allow_same_origin__w", "fail"),
        ("HD_A_iframe_ED_B_html_sandbox__allow_top_navigation__r", "fail"),
        ("HD_A_iframe_ED_B_html_sandbox__allow_top_navigation__w", "fail"),
        ("HD_A_iframe_ED_B_html_sandbox__allow_scripts_allow_same_origin__r", "fail"),
        ("HD_A_iframe_ED_B_html_sandbox__allow_scripts_allow_same_origin__w", "fail"),
        ("HD_A_iframe_ED_B_html_sandbox__allow_scripts_allow_same_origin__x", "success"),
        ("HD_A_iframe_ED_B_html_sandbox__allow_scripts_allow_top_navigation__r", "fail"),
        ("HD_A_iframe_ED_B_html_sandbox__allow_scripts_allow_top_navigation__w", "fail"),
        ("HD_A_iframe_ED_B_html_sandbox__allow_scripts_allow_top_navigation__x", "success"),
        ("HD_A_iframe_ED_B_html_sandbox__allow_same_origin_allow_top_navigation__r", "fail"),
        ("HD_A_iframe_ED_B_html_sandbox__allow_same_origin_allow_top_navigation__w", "fail"),
        ("HD_A_iframe_ED_B_html_sandbox__allow_scripts_allow_same_origin_allow_top_navigation__r", "fail"),
        ("HD_A_iframe_ED_B_html_sandbox__allow_scripts_allow_same_origin_allow_top_navigation__w", "fail"),
        ("HD_A_iframe_ED_B_html_sandbox__allow_scripts_allow_same_origin_allow_top_navigation__x", "success"),
        ("ED_B_iframe_HD_A_html_sandbox__not_set__r", "success"),
        ("ED_B_iframe_HD_A_html_sandbox__allow_scripts__r", "success"),
        ("ED_B_iframe_HD_A_html_sandbox__allow_scripts__w", "success"),
        ("ED_B_iframe_HD_A_html_sandbox__allow_scripts_allow_same_origin__r", "success"),
        ("ED_B_iframe_HD_A_html_sandbox__allow_scripts_allow_same_origin__w", "success"),
        ("ED_B_iframe_HD_A_html_sandbox__allow_scripts_allow_top_navigation__r", "success"),
        ("ED_B_iframe_HD_A_html_sandbox__allow_scripts_allow_same_origin_allow_top_navigation__r", "success"),
        ("ED_B_iframe_HD_A_html_sandbox__allow_scripts_allow_same_origin_allow_top_navigation__w", "success")
        ]

head = """
<!DOCTYPE html>
<html>
<head>
    <title>IFRAME sandbox test cases</title>
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

        sandbox = get_sandbox(settings["sandbox"])

        # fixup for three test cases which do not follow the general rule:
        if ("allow-same-origin" not in sandbox) and (settings["from_domain"] == settings["to_domain"]) and (settings["from"] == "ED"):
            privilege = "partial " + privilege

        if(sandbox == ""):
            sandbox_desc = "Not Set"
        elif(sandbox == "ee.sandbox = '';"):
            sandbox_desc = "empty value"
        else:
            sandbox_desc = sandbox[14:-2]

        description = "{} - Sandbox: {} - {} to {} - {} - {}".format(
                                                    settings["ee"].upper(),
                                                    sandbox_desc,
                                                    settings["from"],
                                                    settings["to"],
                                                    "cross-origin" if(settings["from_domain"] != settings["to_domain"]) else "same-origin",
                                                    privilege
                                                    )

        # Add loadbar div which will be used by the corresponding test case
        if(privilege == "write" and settings["from"] == "ED"):
            foot += """<div id="loadbar_{}" style="display:none"><p>Not empty</p></div>""".format(description)

        if(settings["from"] == "ED" or privilege == "execute"):
            content += """
    function f_test_{}(){{
    var ee = document.createElement('iframe');
    ee.width = 0;
    ee.height = 0;
    {}
    ee.src = "{}/sop/resources/html_script.py?operation={}&description={}";
    document.body.appendChild(ee);
    fetch_tests_from_window(ee.contentWindow);
    }}""".format(
                testname,
                sandbox,
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
    var ee = document.createElement('iframe');
    ee.width = 0;
    ee.height = 0;
    {}
    ee.onload = test_{}.step_func_done(function() {{
    {}
    }})
    ee.src = "{}/sop/resources/html.py";
    document.body.appendChild(ee);
    }}""".format(
                sandbox,
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
    parsed_data = re.match(r'^(?P<from>[EH]D)_(?P<from_domain>[AB])_(?P<ee>\w+?)_(?P<to>[EH]D)_(?P<to_domain>[AB])_html_sandbox_(?P<sandbox>.*)__(?P<privilege>[rwx])$', name)
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
var htmlDoc = ee.contentDocument;
htmlDoc.body.innerHTML = 'New content';
var htmlSource = htmlDoc.documentElement.innerHTML;
assert_greater_than(htmlSource.indexOf('New content'), 0);"""

    elif(privilege == "read"):
        payload = """
var htmlDoc = ee.contentDocument;
var htmlSource = htmlDoc.documentElement.innerHTML;
assert_greater_than(htmlSource.indexOf('ED: HTML'), 0);"""

    return payload

def get_sandbox(sandbox_string):
    sandbox = ""

    if(sandbox_string == "_not_set"):
        return sandbox

    elif(sandbox_string == "_empty_value"):
        sandbox = "ee.sandbox = '';"

    else:
        sandbox = "ee.sandbox = '"
        s_string = sandbox_string.split("allow")
        for val in s_string:
            if(val != "_"):
                val = "allow" + val
                val = val.rstrip("_")
                val = val.replace("_", "-")
                sandbox += val + " "
        sandbox = sandbox.rstrip(" ")
        sandbox += "';"

    return sandbox