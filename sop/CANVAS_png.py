#!/usr/bin/python2

import re

# definition of test cases.
# We will use the names to parse the options for the code
# Additionally we already define if we expect the test to fail (assert_throws)
# or to pass (assert_true)
tests = [
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin__not_set__origin__not_set__credentials__not_set_",        "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin__not_set__origin__not_set__credentials_true",             "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin__not_set__origin__not_set__credentials_false",            "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin__not_set__origin_A_credentials__not_set_",                "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin__not_set__origin_A_credentials_true",                     "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin__not_set__origin_A_credentials_false",                    "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin__not_set__origin_B_credentials__not_set_",                "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin__not_set__origin_B_credentials_true",                     "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin__not_set__origin_B_credentials_false",                    "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin__not_set__origin_wildcard_credentials__not_set_",         "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin__not_set__origin_wildcard_credentials_true",              "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin__not_set__origin_wildcard_credentials_false",             "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin_anonymous_origin__not_set__credentials__not_set_",        "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin_anonymous_origin__not_set__credentials_true",             "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin_anonymous_origin__not_set__credentials_false",            "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin_anonymous_origin_A_credentials__not_set_",                "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin_anonymous_origin_A_credentials_true",                     "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin_anonymous_origin_A_credentials_false",                    "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin_anonymous_origin_B_credentials__not_set_",                "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin_anonymous_origin_B_credentials_true",                     "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin_anonymous_origin_B_credentials_false",                    "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin_anonymous_origin_wildcard_credentials__not_set_",         "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin_anonymous_origin_wildcard_credentials_true",              "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin_anonymous_origin_wildcard_credentials_false",             "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin_use_credentials_origin__not_set__credentials__not_set_",  "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin_use_credentials_origin__not_set__credentials_true",       "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin_use_credentials_origin__not_set__credentials_false",      "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin_use_credentials_origin_A_credentials__not_set_",          "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin_use_credentials_origin_A_credentials_true",               "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin_use_credentials_origin_A_credentials_false",              "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin_use_credentials_origin_B_credentials__not_set_",          "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin_use_credentials_origin_B_credentials_true",               "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin_use_credentials_origin_B_credentials_false",              "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin_use_credentials_origin_wildcard_credentials__not_set_",   "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin_use_credentials_origin_wildcard_credentials_true",        "success"),
        ("HD_A_CANVAS_with_png_ED_A_r_cross_origin_use_credentials_origin_wildcard_credentials_false",       "success"),
        ("HD_A_CANVAS_with_png_ED_B_r_cross_origin__not_set__origin__not_set__credentials__not_set_",        "fail"),
        ("HD_A_CANVAS_with_png_ED_B_r_cross_origin__not_set__origin__not_set__credentials_true",             "fail"),
        ("HD_A_CANVAS_with_png_ED_B_r_cross_origin__not_set__origin__not_set__credentials_false",            "fail"),
        ("HD_A_CANVAS_with_png_ED_B_r_cross_origin__not_set__origin_A_credentials__not_set_",                "fail"),
        ("HD_A_CANVAS_with_png_ED_B_r_cross_origin__not_set__origin_A_credentials_true",                     "fail"),
        ("HD_A_CANVAS_with_png_ED_B_r_cross_origin__not_set__origin_A_credentials_false",                    "fail"),
        ("HD_A_CANVAS_with_png_ED_B_r_cross_origin__not_set__origin_B_credentials__not_set_",                "fail"),
        ("HD_A_CANVAS_with_png_ED_B_r_cross_origin__not_set__origin_B_credentials_true",                     "fail"),
        ("HD_A_CANVAS_with_png_ED_B_r_cross_origin__not_set__origin_B_credentials_false",                    "fail"),
        ("HD_A_CANVAS_with_png_ED_B_r_cross_origin__not_set__origin_wildcard_credentials__not_set_",         "fail"),
        ("HD_A_CANVAS_with_png_ED_B_r_cross_origin__not_set__origin_wildcard_credentials_true",              "fail"),
        ("HD_A_CANVAS_with_png_ED_B_r_cross_origin__not_set__origin_wildcard_credentials_false",             "fail"),
        ("HD_A_CANVAS_with_png_ED_B_r_cross_origin_anonymous_origin_A_credentials__not_set_",                "success"),
        ("HD_A_CANVAS_with_png_ED_B_r_cross_origin_anonymous_origin_A_credentials_true",                     "success"),
        ("HD_A_CANVAS_with_png_ED_B_r_cross_origin_anonymous_origin_A_credentials_false",                    "success"),
        ("HD_A_CANVAS_with_png_ED_B_r_cross_origin_anonymous_origin_wildcard_credentials__not_set_",         "success"),
        ("HD_A_CANVAS_with_png_ED_B_r_cross_origin_anonymous_origin_wildcard_credentials_true",              "success"),
        ("HD_A_CANVAS_with_png_ED_B_r_cross_origin_anonymous_origin_wildcard_credentials_false",             "success"),
        ("HD_A_CANVAS_with_png_ED_B_r_cross_origin_use_credentials_origin_A_credentials_true",               "success")
        ]

head = """
<!DOCTYPE html>
<html>
<head>
    <title>CANVAS PNG test cases</title>
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
                "A" : "http://" + request.server.config["domains"][""] + ":" + str(request.server.config["ports"]["http"][0]),
                "B" : "http://" + request.server.config["domains"]["www2"] + ":" + str(request.server.config["ports"]["http"][0])
            }

    response.headers.set("Content-type", "text/html")

    content = ""

    for (testname, expected) in tests:
        settings = parse_testname(testname)

        cross_origin = ""
        if(settings["cross_origin"] == "anonymous"):
            cross_origin = 'img.crossOrigin = "anonymous";'
        elif(settings["cross_origin"] == "use_credentials"):
            cross_origin = 'img.crossOrigin = "use-credentials";'


        test_check = ""

        if(expected == "success"):
            test_check = """var pixel = ctx.getImageData(2,3,1,1);
        var data = pixel.data;
        assert_true(data[0] == 255);"""
        elif(expected == "fail"):
            test_check = """assert_throws("SECURITY_ERR", function(){ctx.getImageData(2,3,1,1);} );"""
        else:
            return "The test case {} has an invalid expected behavior.".format(testname)

        content += """var test_{} = async_test("{} - {} - {} - CO: {}, O: {}, UC: {}");\n""".format(testname,
                                                                                            settings["ee"],
                                                                                            settings["additional_info_ee"].upper(),
                                                                                            "cross-origin" if(settings["from_domain"] != settings["to_domain"]) else "same-origin",
                                                                                            settings["cross_origin"].strip("_").replace("_", "-"),
                                                                                            settings["origin"].upper(),
                                                                                            settings["credentials"].strip("_").replace("_", "-")
                                                                                            )
        content += "function f_test_{}(){{\n".format(testname)

        content += """
    var img = document.createElement('img');
    {}
    img.onload = test_{}.step_func_done(function() {{
        var c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        var ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0);
        {}
    }})
    img.src = "{}/sop/resources/png.py?origin={}&credentials={}";
    }}
        """.format(
                cross_origin,
                testname,
                test_check,
                origins[settings["to_domain"]],
                settings["origin"],
                settings["credentials"],
                )
        content += "f_test_{}();\n\n".format(testname)

    return head + content + foot



# parse_testname
# @param1 testname to be parsed
# @return dictionary with values parsed from @param1
#
def parse_testname(name):
    # HD_A_CANVAS_with_png_ED_B_r_cross_origin__not_set__origin__not_set__credentials__not_set_
    parsed_data = re.match(r'^(?P<from>[EH]D)_(?P<from_domain>[AB])_(?P<ee>\w+?)_with_(?P<additional_info_ee>\w+)_(?P<to>[EH]D)_(?P<to_domain>[AB])_(?P<privilege>[rwx])_cross_origin_(?P<cross_origin>\w+)_origin_(?P<origin>\w+)_credentials_(?P<credentials>\w+)$', name)
    if(not parsed_data):
        return "ERROR: supplied test name is invalid"

    return parsed_data.groupdict()