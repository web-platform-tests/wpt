import os
import sys

# unless I want to app all the code for CORS in every file I have to do this to import the code
sys.path.append(os.path.dirname(__file__))

from cors_utils import cors

# Function to isolate css test cases
#
def main(request, response):
    response.headers.set("Content-type", "text/html")

    _from = ""
    _to = ""
    _credentials = ""
    _origin = ""
    _crossOrigin = ""
    _operation = ""

    _description = ""

    test_code = ""

    if "from" in request.GET:
        _from = request.GET.first("from")
    else:
        return "Error - from not set"

    if "to" in request.GET:
        _to = request.GET.first("to")
    else:
        return "Error - to not set"

    if "credentials" in request.GET:
        _credentials = request.GET.first("credentials")
    else:
        return "Error - credentials not set"

    if "origin" in request.GET:
        _origin = request.GET.first("origin")
    else:
        return "Error - origin not set"

    if "crossorigin" in request.GET:
        _crossOrigin = request.GET.first("crossorigin")
    else:
        return "Error - crossorigin not set"

    if "operation" in request.GET:
        _operation = request.GET.first("operation")
    else:
        return "Error - operation not set"

    if "description" in request.GET:
        _description = request.GET.first("description")
    else:
        return "Error - description not set"


    if _from[:2] == "HD":
        if _operation == "read success":
            test_code = """
            var ee = document.createElement('link');{}
            ee.onload = my_test.step_func_done(function() {{
                var styles = document.styleSheets[0];
                if(styles.rules == undefined) {{
                    var rule = styles.cssRules[0];
                }} else {{
                    var rule = styles.rules[0];
                }}
                var actual = rule.cssText;
                var expected = "h1 {{ color: red; }}";
                assert_equals(actual, expected);
            }});
            ee.type = 'text/css';
            ee.rel = 'stylesheet';
            ee.href = 'http://{}:{}/sop/resources/css.py?origin={}&credentials={}';
            document.head.appendChild(ee);
            """.format(
                "" if _crossOrigin == "Not set" else "\n\t\t\tee.crossOrigin = '{}';".format(_crossOrigin),
                request.server.config["domains"][""] if _to[3] == "A" else request.server.config["domains"]["www2"],
                request.server.config["ports"]["http"][0],
                _origin,
                _credentials
                )

        elif _operation == "read fail":
            test_code = """
            var ee = document.createElement('link');{}
            ee.onload = my_test.step_func_done(function() {{
                var styles = document.styleSheets[0];

                assert_throws("SECURITY_ERR", function() {{
                    if(styles.rules == undefined) {{
                        rule = styles.cssRules[0];
                    }} else {{
                        rule = styles.rules[0];
                    }}
                    var actual = rule.cssText;
                }})
            }});
            ee.type = 'text/css';
            ee.rel = 'stylesheet';
            ee.href = 'http://{}:{}/sop/resources/css.py?origin={}&credentials={}';
            document.head.appendChild(ee);
            """.format(
                "" if _crossOrigin == "Not set" else "\n\t\t\tee.crossOrigin = '{}';".format(_crossOrigin),
                request.server.config["domains"][""] if _to[3] == "A" else request.server.config["domains"]["www2"],
                request.server.config["ports"]["http"][0],
                _origin,
                _credentials
                )

        elif _operation == "write success":
            test_code = """
            var ee = document.createElement('link');{}
            ee.onload = my_test.step_func_done(function() {{
                var styles = document.styleSheets[0];
                styles.insertRule('h1 {{color: blue !important}}', 1);
                var h1 = document.getElementById("h1");
                var cssColor = window.getComputedStyle(h1, null).getPropertyValue("color");
                assert_equals(cssColor, 'rgb(0, 0, 255)');
            }});
            ee.type = 'text/css';
            ee.rel = 'stylesheet';
            ee.href = 'http://{}:{}/sop/resources/css.py?origin={}&credentials={}';
            document.head.appendChild(ee);
            """.format(
                "" if _crossOrigin == "Not set" else "\n\t\t\tee.crossOrigin = '{}';".format(_crossOrigin),
                request.server.config["domains"][""] if _to[3] == "A" else request.server.config["domains"]["www2"],
                request.server.config["ports"]["http"][0],
                _origin,
                _credentials
                )

        elif _operation == "write fail":
            test_code = """
            var ee = document.createElement('link');{}
            ee.onload = my_test.step_func_done(function() {{
                var styles = document.styleSheets[0];
                assert_throws("SECURITY_ERR", function(){{styles.insertRule('h1 {{color: blue !important}}', 1);}});
            }});
            ee.type = 'text/css';
            ee.rel = 'stylesheet';
            ee.href = 'http://{}:{}/sop/resources/css.py?origin={}&credentials={}';
            document.head.appendChild(ee);
            """.format(
                "" if _crossOrigin == "Not set" else "\n\t\t\tee.crossOrigin = '{}';".format(_crossOrigin),
                request.server.config["domains"][""] if _to[3] == "A" else request.server.config["domains"]["www2"],
                request.server.config["ports"]["http"][0],
                _origin,
                _credentials
                )



    elif _from[:2] == "ED":
        if _operation == "write success":
            test_code = """
            var ee = document.createElement('link');{}
            ee.onload = my_test.step_func_done(function() {{
                var h1 = document.getElementById('h1');
                var cssColor = window.getComputedStyle(h1, null).getPropertyValue("color");
                assert_equals(cssColor, 'rgb(255, 0, 0)');
            }});
            ee.type = 'text/css';
            ee.rel = 'stylesheet';
            ee.href = 'http://{}:{}/sop/resources/css.py?origin={}&credentials={}';
            document.head.appendChild(ee);
            """.format(
                "" if _crossOrigin == "Not set" else "\n\t\t\tee.crossOrigin = '{}';".format(_crossOrigin),
                request.server.config["domains"][""] if _from[3] == "A" else request.server.config["domains"]["www2"],
                request.server.config["ports"]["http"][0],
                _origin,
                _credentials
                )
        elif _operation == "write fail":
            pass



    content = """
<html>
    <head>
        <title>ED: CSS</title>
        <script src="/resources/testharness.js"></script>
    </head>
    <body>
        <h1 id="h1">CSS</h1>
        <script>
        var my_test = async_test('{}');
        function execute_my_test() {{
            {}
        }}
        execute_my_test();
        </script>
    </body>
</html>
""".format(_description, test_code)

    return content