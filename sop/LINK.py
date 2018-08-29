#!/usr/bin/python2

import re

# definition of test cases.
# We will use the names to parse the options for the code
# Additionally we already define if we expect the test to fail (assert_throws)
# or to pass (assert_true)
tests = [
        ("HD_A_LINK_ED_A_cross_origin__not_set__origin__not_set__credentials__not_set__r", "success"),
        ("HD_A_LINK_ED_A_cross_origin__not_set__origin__not_set__credentials__not_set__w", "success"),
        ("HD_A_LINK_ED_A_cross_origin__not_set__origin__not_set__credentials_true_r", "success"),
        ("HD_A_LINK_ED_A_cross_origin__not_set__origin__not_set__credentials_true_w", "success"),
        ("HD_A_LINK_ED_A_cross_origin__not_set__origin__not_set__credentials_false_r", "success"),
        ("HD_A_LINK_ED_A_cross_origin__not_set__origin__not_set__credentials_false_w", "success"),
        ("HD_A_LINK_ED_A_cross_origin__not_set__origin_A_credentials__not_set__r", "success"),
        ("HD_A_LINK_ED_A_cross_origin__not_set__origin_A_credentials__not_set__w", "success"),
        ("HD_A_LINK_ED_A_cross_origin__not_set__origin_A_credentials_true_r", "success"),
        ("HD_A_LINK_ED_A_cross_origin__not_set__origin_A_credentials_true_w", "success"),
        ("HD_A_LINK_ED_A_cross_origin__not_set__origin_A_credentials_false_r", "success"),
        ("HD_A_LINK_ED_A_cross_origin__not_set__origin_A_credentials_false_w", "success"),
        ("HD_A_LINK_ED_A_cross_origin__not_set__origin_B_credentials__not_set__r", "success"),
        ("HD_A_LINK_ED_A_cross_origin__not_set__origin_B_credentials__not_set__w", "success"),
        ("HD_A_LINK_ED_A_cross_origin__not_set__origin_B_credentials_true_r", "success"),
        ("HD_A_LINK_ED_A_cross_origin__not_set__origin_B_credentials_true_w", "success"),
        ("HD_A_LINK_ED_A_cross_origin__not_set__origin_B_credentials_false_r", "success"),
        ("HD_A_LINK_ED_A_cross_origin__not_set__origin_B_credentials_false_w", "success"),
        ("HD_A_LINK_ED_A_cross_origin__not_set__origin_wildcard_credentials__not_set__r", "success"),
        ("HD_A_LINK_ED_A_cross_origin__not_set__origin_wildcard_credentials__not_set__w", "success"),
        ("HD_A_LINK_ED_A_cross_origin__not_set__origin_wildcard_credentials_true_r", "success"),
        ("HD_A_LINK_ED_A_cross_origin__not_set__origin_wildcard_credentials_true_w", "success"),
        ("HD_A_LINK_ED_A_cross_origin__not_set__origin_wildcard_credentials_false_r", "success"),
        ("HD_A_LINK_ED_A_cross_origin__not_set__origin_wildcard_credentials_false_w", "success"),
        ("HD_A_LINK_ED_A_cross_origin_anonymous_origin__not_set__credentials__not_set__r", "success"),
        ("HD_A_LINK_ED_A_cross_origin_anonymous_origin__not_set__credentials__not_set__w", "success"),
        ("HD_A_LINK_ED_A_cross_origin_anonymous_origin__not_set__credentials_true_r", "success"),
        ("HD_A_LINK_ED_A_cross_origin_anonymous_origin__not_set__credentials_true_w", "success"),
        ("HD_A_LINK_ED_A_cross_origin_anonymous_origin__not_set__credentials_false_r", "success"),
        ("HD_A_LINK_ED_A_cross_origin_anonymous_origin__not_set__credentials_false_w", "success"),
        ("HD_A_LINK_ED_A_cross_origin_anonymous_origin_A_credentials__not_set__r", "success"),
        ("HD_A_LINK_ED_A_cross_origin_anonymous_origin_A_credentials__not_set__w", "success"),
        ("HD_A_LINK_ED_A_cross_origin_anonymous_origin_A_credentials_true_r", "success"),
        ("HD_A_LINK_ED_A_cross_origin_anonymous_origin_A_credentials_true_w", "success"),
        ("HD_A_LINK_ED_A_cross_origin_anonymous_origin_A_credentials_false_r", "success"),
        ("HD_A_LINK_ED_A_cross_origin_anonymous_origin_A_credentials_false_w", "success"),
        ("HD_A_LINK_ED_A_cross_origin_anonymous_origin_B_credentials__not_set__r", "success"),
        ("HD_A_LINK_ED_A_cross_origin_anonymous_origin_B_credentials__not_set__w", "success"),
        ("HD_A_LINK_ED_A_cross_origin_anonymous_origin_B_credentials_true_r", "success"),
        ("HD_A_LINK_ED_A_cross_origin_anonymous_origin_B_credentials_true_w", "success"),
        ("HD_A_LINK_ED_A_cross_origin_anonymous_origin_B_credentials_false_r", "success"),
        ("HD_A_LINK_ED_A_cross_origin_anonymous_origin_B_credentials_false_w", "success"),
        ("HD_A_LINK_ED_A_cross_origin_anonymous_origin_wildcard_credentials__not_set__r", "success"),
        ("HD_A_LINK_ED_A_cross_origin_anonymous_origin_wildcard_credentials__not_set__w", "success"),
        ("HD_A_LINK_ED_A_cross_origin_anonymous_origin_wildcard_credentials_true_r", "success"),
        ("HD_A_LINK_ED_A_cross_origin_anonymous_origin_wildcard_credentials_true_w", "success"),
        ("HD_A_LINK_ED_A_cross_origin_anonymous_origin_wildcard_credentials_false_r", "success"),
        ("HD_A_LINK_ED_A_cross_origin_anonymous_origin_wildcard_credentials_false_w", "success"),
        ("HD_A_LINK_ED_A_cross_origin_use_credentials_origin__not_set__credentials__not_set__r", "success"),
        ("HD_A_LINK_ED_A_cross_origin_use_credentials_origin__not_set__credentials__not_set__w", "success"),
        ("HD_A_LINK_ED_A_cross_origin_use_credentials_origin__not_set__credentials_true_r", "success"),
        ("HD_A_LINK_ED_A_cross_origin_use_credentials_origin__not_set__credentials_true_w", "success"),
        ("HD_A_LINK_ED_A_cross_origin_use_credentials_origin__not_set__credentials_false_r", "success"),
        ("HD_A_LINK_ED_A_cross_origin_use_credentials_origin__not_set__credentials_false_w", "success"),
        ("HD_A_LINK_ED_A_cross_origin_use_credentials_origin_A_credentials__not_set__r", "success"),
        ("HD_A_LINK_ED_A_cross_origin_use_credentials_origin_A_credentials__not_set__w", "success"),
        ("HD_A_LINK_ED_A_cross_origin_use_credentials_origin_A_credentials_true_r", "success"),
        ("HD_A_LINK_ED_A_cross_origin_use_credentials_origin_A_credentials_true_w", "success"),
        ("HD_A_LINK_ED_A_cross_origin_use_credentials_origin_A_credentials_false_r", "success"),
        ("HD_A_LINK_ED_A_cross_origin_use_credentials_origin_A_credentials_false_w", "success"),
        ("HD_A_LINK_ED_A_cross_origin_use_credentials_origin_B_credentials__not_set__r", "success"),
        ("HD_A_LINK_ED_A_cross_origin_use_credentials_origin_B_credentials__not_set__w", "success"),
        ("HD_A_LINK_ED_A_cross_origin_use_credentials_origin_B_credentials_true_r", "success"),
        ("HD_A_LINK_ED_A_cross_origin_use_credentials_origin_B_credentials_true_w", "success"),
        ("HD_A_LINK_ED_A_cross_origin_use_credentials_origin_B_credentials_false_r", "success"),
        ("HD_A_LINK_ED_A_cross_origin_use_credentials_origin_B_credentials_false_w", "success"),
        ("HD_A_LINK_ED_A_cross_origin_use_credentials_origin_wildcard_credentials__not_set__r", "success"),
        ("HD_A_LINK_ED_A_cross_origin_use_credentials_origin_wildcard_credentials__not_set__w", "success"),
        ("HD_A_LINK_ED_A_cross_origin_use_credentials_origin_wildcard_credentials_true_r", "success"),
        ("HD_A_LINK_ED_A_cross_origin_use_credentials_origin_wildcard_credentials_true_w", "success"),
        ("HD_A_LINK_ED_A_cross_origin_use_credentials_origin_wildcard_credentials_false_r", "success"),
        ("HD_A_LINK_ED_A_cross_origin_use_credentials_origin_wildcard_credentials_false_w", "success"),
        ("ED_A_LINK_HD_A_cross_origin__not_set__origin__not_set__credentials__not_set__w", "success"),
        ("ED_A_LINK_HD_A_cross_origin__not_set__origin__not_set__credentials_true_w", "success"),
        ("ED_A_LINK_HD_A_cross_origin__not_set__origin__not_set__credentials_false_w", "success"),
        ("ED_A_LINK_HD_A_cross_origin__not_set__origin_A_credentials__not_set__w", "success"),
        ("ED_A_LINK_HD_A_cross_origin__not_set__origin_A_credentials_true_w", "success"),
        ("ED_A_LINK_HD_A_cross_origin__not_set__origin_A_credentials_false_w", "success"),
        ("ED_A_LINK_HD_A_cross_origin__not_set__origin_B_credentials__not_set__w", "success"),
        ("ED_A_LINK_HD_A_cross_origin__not_set__origin_B_credentials_true_w", "success"),
        ("ED_A_LINK_HD_A_cross_origin__not_set__origin_B_credentials_false_w", "success"),
        ("ED_A_LINK_HD_A_cross_origin__not_set__origin_wildcard_credentials__not_set__w", "success"),
        ("ED_A_LINK_HD_A_cross_origin__not_set__origin_wildcard_credentials_true_w", "success"),
        ("ED_A_LINK_HD_A_cross_origin__not_set__origin_wildcard_credentials_false_w", "success"),
        ("ED_A_LINK_HD_A_cross_origin_anonymous_origin__not_set__credentials__not_set__w", "success"),
        ("ED_A_LINK_HD_A_cross_origin_anonymous_origin__not_set__credentials_true_w", "success"),
        ("ED_A_LINK_HD_A_cross_origin_anonymous_origin__not_set__credentials_false_w", "success"),
        ("ED_A_LINK_HD_A_cross_origin_anonymous_origin_A_credentials__not_set__w", "success"),
        ("ED_A_LINK_HD_A_cross_origin_anonymous_origin_A_credentials_true_w", "success"),
        ("ED_A_LINK_HD_A_cross_origin_anonymous_origin_A_credentials_false_w", "success"),
        ("ED_A_LINK_HD_A_cross_origin_anonymous_origin_B_credentials__not_set__w", "success"),
        ("ED_A_LINK_HD_A_cross_origin_anonymous_origin_B_credentials_true_w", "success"),
        ("ED_A_LINK_HD_A_cross_origin_anonymous_origin_B_credentials_false_w", "success"),
        ("ED_A_LINK_HD_A_cross_origin_anonymous_origin_wildcard_credentials__not_set__w", "success"),
        ("ED_A_LINK_HD_A_cross_origin_anonymous_origin_wildcard_credentials_true_w", "success"),
        ("ED_A_LINK_HD_A_cross_origin_anonymous_origin_wildcard_credentials_false_w", "success"),
        ("ED_A_LINK_HD_A_cross_origin_use_credentials_origin__not_set__credentials__not_set__w", "success"),
        ("ED_A_LINK_HD_A_cross_origin_use_credentials_origin__not_set__credentials_true_w", "success"),
        ("ED_A_LINK_HD_A_cross_origin_use_credentials_origin__not_set__credentials_false_w", "success"),
        ("ED_A_LINK_HD_A_cross_origin_use_credentials_origin_A_credentials__not_set__w", "success"),
        ("ED_A_LINK_HD_A_cross_origin_use_credentials_origin_A_credentials_true_w", "success"),
        ("ED_A_LINK_HD_A_cross_origin_use_credentials_origin_A_credentials_false_w", "success"),
        ("ED_A_LINK_HD_A_cross_origin_use_credentials_origin_B_credentials__not_set__w", "success"),
        ("ED_A_LINK_HD_A_cross_origin_use_credentials_origin_B_credentials_true_w", "success"),
        ("ED_A_LINK_HD_A_cross_origin_use_credentials_origin_B_credentials_false_w", "success"),
        ("ED_A_LINK_HD_A_cross_origin_use_credentials_origin_wildcard_credentials__not_set__w", "success"),
        ("ED_A_LINK_HD_A_cross_origin_use_credentials_origin_wildcard_credentials_true_w", "success"),
        ("ED_A_LINK_HD_A_cross_origin_use_credentials_origin_wildcard_credentials_false_w", "success"),
        ("HD_A_LINK_ED_B_cross_origin__not_set__origin__not_set__credentials__not_set__r", "fail"),
        ("HD_A_LINK_ED_B_cross_origin__not_set__origin__not_set__credentials__not_set__w", "fail"),
        ("HD_A_LINK_ED_B_cross_origin__not_set__origin__not_set__credentials_true_r", "fail"),
        ("HD_A_LINK_ED_B_cross_origin__not_set__origin__not_set__credentials_true_w", "fail"),
        ("HD_A_LINK_ED_B_cross_origin__not_set__origin__not_set__credentials_false_r", "fail"),
        ("HD_A_LINK_ED_B_cross_origin__not_set__origin__not_set__credentials_false_w", "fail"),
        ("HD_A_LINK_ED_B_cross_origin__not_set__origin_A_credentials__not_set__r", "fail"),
        ("HD_A_LINK_ED_B_cross_origin__not_set__origin_A_credentials__not_set__w", "fail"),
        ("HD_A_LINK_ED_B_cross_origin__not_set__origin_A_credentials_true_r", "fail"),
        ("HD_A_LINK_ED_B_cross_origin__not_set__origin_A_credentials_true_w", "fail"),
        ("HD_A_LINK_ED_B_cross_origin__not_set__origin_A_credentials_false_r", "fail"),
        ("HD_A_LINK_ED_B_cross_origin__not_set__origin_A_credentials_false_w", "fail"),
        ("HD_A_LINK_ED_B_cross_origin__not_set__origin_B_credentials__not_set__r", "fail"),
        ("HD_A_LINK_ED_B_cross_origin__not_set__origin_B_credentials__not_set__w", "fail"),
        ("HD_A_LINK_ED_B_cross_origin__not_set__origin_B_credentials_true_r", "fail"),
        ("HD_A_LINK_ED_B_cross_origin__not_set__origin_B_credentials_true_w", "fail"),
        ("HD_A_LINK_ED_B_cross_origin__not_set__origin_B_credentials_false_r", "fail"),
        ("HD_A_LINK_ED_B_cross_origin__not_set__origin_B_credentials_false_w", "fail"),
        ("HD_A_LINK_ED_B_cross_origin__not_set__origin_wildcard_credentials__not_set__r", "fail"),
        ("HD_A_LINK_ED_B_cross_origin__not_set__origin_wildcard_credentials__not_set__w", "fail"),
        ("HD_A_LINK_ED_B_cross_origin__not_set__origin_wildcard_credentials_true_r", "fail"),
        ("HD_A_LINK_ED_B_cross_origin__not_set__origin_wildcard_credentials_true_w", "fail"),
        ("HD_A_LINK_ED_B_cross_origin__not_set__origin_wildcard_credentials_false_r", "fail"),
        ("HD_A_LINK_ED_B_cross_origin__not_set__origin_wildcard_credentials_false_w", "fail"),
        ("HD_A_LINK_ED_B_cross_origin_anonymous_origin_A_credentials__not_set__r", "success"),
        ("HD_A_LINK_ED_B_cross_origin_anonymous_origin_A_credentials__not_set__w", "success"),
        ("HD_A_LINK_ED_B_cross_origin_anonymous_origin_A_credentials_true_r", "success"),
        ("HD_A_LINK_ED_B_cross_origin_anonymous_origin_A_credentials_true_w", "success"),
        ("HD_A_LINK_ED_B_cross_origin_anonymous_origin_A_credentials_false_r", "success"),
        ("HD_A_LINK_ED_B_cross_origin_anonymous_origin_A_credentials_false_w", "success"),
        ("HD_A_LINK_ED_B_cross_origin_anonymous_origin_wildcard_credentials__not_set__r", "success"),
        ("HD_A_LINK_ED_B_cross_origin_anonymous_origin_wildcard_credentials__not_set__w", "success"),
        ("HD_A_LINK_ED_B_cross_origin_anonymous_origin_wildcard_credentials_true_r", "success"),
        ("HD_A_LINK_ED_B_cross_origin_anonymous_origin_wildcard_credentials_true_w", "success"),
        ("HD_A_LINK_ED_B_cross_origin_anonymous_origin_wildcard_credentials_false_r", "success"),
        ("HD_A_LINK_ED_B_cross_origin_anonymous_origin_wildcard_credentials_false_w", "success"),
        ("HD_A_LINK_ED_B_cross_origin_use_credentials_origin_A_credentials_true_r", "success"),
        ("HD_A_LINK_ED_B_cross_origin_use_credentials_origin_A_credentials_true_w", "success"),
        ("ED_B_LINK_HD_A_cross_origin__not_set__origin__not_set__credentials__not_set__w", "success"),
        ("ED_B_LINK_HD_A_cross_origin__not_set__origin__not_set__credentials_true_w", "success"),
        ("ED_B_LINK_HD_A_cross_origin__not_set__origin__not_set__credentials_false_w", "success"),
        ("ED_B_LINK_HD_A_cross_origin__not_set__origin_A_credentials__not_set__w", "success"),
        ("ED_B_LINK_HD_A_cross_origin__not_set__origin_A_credentials_true_w", "success"),
        ("ED_B_LINK_HD_A_cross_origin__not_set__origin_A_credentials_false_w", "success"),
        ("ED_B_LINK_HD_A_cross_origin__not_set__origin_B_credentials__not_set__w", "success"),
        ("ED_B_LINK_HD_A_cross_origin__not_set__origin_B_credentials_true_w", "success"),
        ("ED_B_LINK_HD_A_cross_origin__not_set__origin_B_credentials_false_w", "success"),
        ("ED_B_LINK_HD_A_cross_origin__not_set__origin_wildcard_credentials__not_set__w", "success"),
        ("ED_B_LINK_HD_A_cross_origin__not_set__origin_wildcard_credentials_true_w", "success"),
        ("ED_B_LINK_HD_A_cross_origin__not_set__origin_wildcard_credentials_false_w", "success"),
        ("ED_B_LINK_HD_A_cross_origin_anonymous_origin_A_credentials__not_set__w", "success"),
        ("ED_B_LINK_HD_A_cross_origin_anonymous_origin_A_credentials_true_w", "success"),
        ("ED_B_LINK_HD_A_cross_origin_anonymous_origin_A_credentials_false_w", "success"),
        ("ED_B_LINK_HD_A_cross_origin_anonymous_origin_wildcard_credentials__not_set__w", "success"),
        ("ED_B_LINK_HD_A_cross_origin_anonymous_origin_wildcard_credentials_true_w", "success"),
        ("ED_B_LINK_HD_A_cross_origin_anonymous_origin_wildcard_credentials_false_w", "success"),
        ("ED_B_LINK_HD_A_cross_origin_use_credentials_origin_A_credentials_true_w", "success")
        ]

head = """
<!DOCTYPE html>
<html>
<head>
    <title>LINK test cases</title>
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

        content += "function f_test_{}(){{\n".format(testname)

        if(settings["credentials"] == "_not_set_"):
            credentials = "Not set"
        else:
            credentials = settings["credentials"]

        if(settings["cross_origin"] == "_not_set_"):
            cross_origin = "Not set"
        else:
            cross_origin = settings["cross_origin"].strip("_").replace("_", "-")

        if(settings["origin"] == "_not_set_"):
            origin = "Not set"
        else:
            origin = settings["origin"]


        content += """
        var wrapper = document.createElement("iframe");
        wrapper.width = 0;
        wrapper.height = 0;
        wrapper.src = '{}/sop/resources/css_wrapper.py?from={}&to={}&origin={}&crossorigin={}&credentials={}&operation={} {}&description=LINK - {} to {} - {} - CO: {}, O: {}, UC: {} - {}';
        document.body.appendChild(wrapper);
        fetch_tests_from_window(wrapper.contentWindow);
        }}
        """.format(
                origins["A"],
                settings["from"] + " " + settings["from_domain"],
                settings["to"] + " " + settings["to_domain"],
                origin,
                cross_origin,
                credentials,
                "read" if(settings["privilege"] == "r") else "write",
                expected,
                settings["from"],
                settings["to"],
                "same-origin" if settings["from_domain"] == settings["to_domain"] else "cross-origin",
                cross_origin,
                origin,
                credentials,
                "read" if(settings["privilege"] == "r") else "write"
                )
        content += "\nf_test_{}();\n\n".format(testname)

    return head + content + foot



# parse_testname
# @param1 testname to be parsed
# @return dictionary with values parsed from @param1
#
def parse_testname(name):
    # HD_A_CANVAS_with_mp4ogg_ED_B_r_cross_origin__not_set__origin__not_set__credentials__not_set_
    parsed_data = re.match(r'^(?P<from>[EH]D)_(?P<from_domain>[AB])_(?P<ee>\w+?)_(?P<to>[EH]D)_(?P<to_domain>[AB])_cross_origin_(?P<cross_origin>\w+)_origin_(?P<origin>\w+)_credentials_(?P<credentials>\w+)_(?P<privilege>[rwx])$', name)
    if(not parsed_data):
        return "ERROR: supplied test name is invalid"

    return parsed_data.groupdict()