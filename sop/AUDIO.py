#!/usr/bin/python2

import re

# definition of test cases.
# We will use the names to parse the options for the code
# Additionally we already define if we expect the test to fail (assert_throws)
# or to pass (assert_true)
tests = [
        ("HD_A_AUDIO_ED_A_r", "success"),
        ("HD_A_AUDIO_ED_B_r", "success")
        ]

head = """
<!DOCTYPE html>
<html>
<head>
    <title>AUDIO test cases</title>
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

        test_check = ""

        if(expected == "success"):
            test_check = """assert_true(audio.duration >= 4);"""
        else:
            return "The test case {} has an invalid expected behavior.".format(testname)

        content += """var test_{} = async_test("{} - partial read {}");\n""".format(testname,
                                                                            settings["ee"],
                                                                            "cross-origin" if(settings["from_domain"] != settings["to_domain"]) else "same-origin",
                                                                                            )
        content += "function f_test_{}(){{\n".format(testname)

        content += """
    var audio = document.createElement('audio');
    audio.onloadeddata = test_{}.step_func_done(function() {{
        audio.muted = true;
        audio.play();
        audio.pause();
        {}
    }})
    
    var source = document.createElement("source");
    source.src = "{}/sop/resources/mp3.py";
    source.type = "audio/mpeg";
    audio.appendChild(source);

    audio.controls = true;
    audio.style.display = "none";

    document.body.appendChild(audio);
    }}""".format(
                testname,
                test_check,
                origins[settings["to_domain"]],
                )
        content += "\nf_test_{}();\n\n".format(testname)

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