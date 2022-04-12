# Current code status:
#
# This was originally written by Philip Taylor for use at
# http://philip.html5.org/tests/canvas/suite/tests/
#
# It has been adapted for use with the Web Platform Test Suite suite at
# https://github.com/web-platform-tests/wpt/
#
# The original version had a number of now-removed features (multiple versions of
# each test case of varying verbosity, Mozilla mochitests, semi-automated test
# harness). It also had a different directory structure.

# To update or add test cases:
#
# * Modify the tests*.yaml files.
# 'name' is an arbitrary hierarchical name to help categorise tests.
# 'desc' is a rough description of what behaviour the test aims to test.
# 'testing' is a list of references to spec.yaml, to show which spec sentences
# this test case is primarily testing.
# 'code' is JavaScript code to execute, with some special commands starting with '@'
# 'expected' is what the final canvas output should be: a string 'green' or 'clear'
# (100x50 images in both cases), or a string 'size 100 50' (or any other size)
# followed by Python code using Pycairo to generate the image.
#
# * Run "./build.sh".
# This requires a few Python modules which might not be ubiquitous.
# It will usually emit some warnings, which ideally should be fixed but can
# generally be safely ignored.
#
# * Test the tests, add new ones to Git, remove deleted ones from Git, etc.


import os
import re
import sys

try:
    import cairocffi as cairo
except ImportError:
    import cairo

try:
    import syck as yaml  # compatible and lots faster
except ImportError:
    import yaml


def simpleEscapeJS(str):
    return str.replace("\\", "\\\\").replace('"', '\\"')


def escapeJS(str):
    str = simpleEscapeJS(str)
    str = re.sub(
        r"\[(\w+)]", r'[\\""+(\1)+"\\"]', str
    )  # kind of an ugly hack, for nicer failure-message output
    return str


def expand_nonfinite(method, argstr, tail):
    """
    >>> print expand_nonfinite('f', '<0 a>, <0 b>', ';')
    f(a, 0);
    f(0, b);
    f(a, b);
    >>> print expand_nonfinite('f', '<0 a>, <0 b c>, <0 d>', ';')
    f(a, 0, 0);
    f(0, b, 0);
    f(0, c, 0);
    f(0, 0, d);
    f(a, b, 0);
    f(a, b, d);
    f(a, 0, d);
    f(0, b, d);
    """
    # argstr is "<valid-1 invalid1-1 invalid2-1 ...>, ..." (where usually
    # 'invalid' is Infinity/-Infinity/NaN)
    args = []
    for arg in argstr.split(", "):
        a = re.match("<(.*)>", arg).group(1)
        args.append(a.split(" "))
    calls = []
    # Start with the valid argument list
    call = [args[j][0] for j in range(len(args))]
    # For each argument alone, try setting it to all its invalid values:
    for i in range(len(args)):
        for a in args[i][1:]:
            c2 = call[:]
            c2[i] = a
            calls.append(c2)

    # For all combinations of >= 2 arguments, try setting them to their
    # first invalid values. (Don't do all invalid values, because the
    # number of combinations explodes.)
    def f(c, start, depth):
        for i in range(start, len(args)):
            if len(args[i]) > 1:
                a = args[i][1]
                c2 = c[:]
                c2[i] = a
                if depth > 0:
                    calls.append(c2)
                f(c2, i + 1, depth + 1)

    f(call, 0, 0)

    return "\n".join("{}({}){}".format(method, ", ".join(c), tail) for c in calls)


def map_name(test, name_mapping):
    name = test["name"]
    mapped_name = None
    for mn in sorted(name_mapping.keys(), key=len, reverse=True):
        if name.startswith(mn):
            mapped_name = f"{name_mapping[mn]}/{name}"
            break
    if not mapped_name:
        print("LIKELY ERROR: %s has no defined target directory mapping" % name)
    if "manual" in test:
        mapped_name += "-manual"
    return mapped_name


def expand_test_code(code):
    code = re.sub(
        r"@nonfinite ([^(]+)\(([^)]+)\)(.*)",
        lambda m: expand_nonfinite(m.group(1), m.group(2), m.group(3)),
        code,
    )  # must come before '@assert throws'

    code = re.sub(
        r"@assert pixel (\d+,\d+) == (\d+,\d+,\d+,\d+);",
        r'_assertPixel(canvas, \1, \2, "\1", "\2");',
        code,
    )

    code = re.sub(
        r"@assert pixel (\d+,\d+) ==~ (\d+,\d+,\d+,\d+);",
        r'_assertPixelApprox(canvas, \1, \2, "\1", "\2", 2);',
        code,
    )

    code = re.sub(
        r"@assert pixel (\d+,\d+) ==~ (\d+,\d+,\d+,\d+) \+/- (\d+);",
        r'_assertPixelApprox(canvas, \1, \2, "\1", "\2", \3);',
        code,
    )

    code = re.sub(
        r"@assert throws (\S+_ERR) (.*);",
        r'assert_throws_dom("\1", function() { \2; });',
        code,
    )

    code = re.sub(
        r"@assert throws (\S+Error) (.*);",
        r"assert_throws_js(\1, function() { \2; });",
        code,
    )

    code = re.sub(
        r"@assert (.*) === (.*);",
        lambda m: '_assertSame(%s, %s, "%s", "%s");'
        % (m.group(1), m.group(2), escapeJS(m.group(1)), escapeJS(m.group(2))),
        code,
    )

    code = re.sub(
        r"@assert (.*) !== (.*);",
        lambda m: '_assertDifferent(%s, %s, "%s", "%s");'
        % (m.group(1), m.group(2), escapeJS(m.group(1)), escapeJS(m.group(2))),
        code,
    )

    code = re.sub(
        r"@assert (.*) =~ (.*);",
        lambda m: f"assert_regexp_match({m.group(1)}, {m.group(2)});",
        code,
    )

    code = re.sub(
        r"@assert (.*);",
        lambda m: f'_assert({m.group(1)}, "{escapeJS(m.group(1))}");',
        code,
    )

    code = re.sub(r" @moz-todo", "", code)

    code = re.sub(r"@moz-UniversalBrowserRead;", "", code)

    assert "@" not in code

    return code


def generate_test(
    templates,
    test,
    name_mapping,
    canvas_output_dir,
    offscreen_output_dir,
    include_done=False,
):
    name = test["name"]

    mapped_name = map_name(test, name_mapping)
    if not mapped_name:
        mapped_name = name

    if "canvasType" in test:
        HTMLCanvas_test = False
        OffscreenCanvas_test = False

        for t in test["canvasType"]:
            t = t.lower()
            if t == "htmlcanvas":
                HTMLCanvas_test = True
            elif t == "offscreencanvas":
                OffscreenCanvas_test = True
    else:
        HTMLCanvas_test = canvas_output_dir is not None
        OffscreenCanvas_test = offscreen_output_dir is not None

    if not test.get("testing", []):
        print("Test %s doesn't refer to any spec points" % name)

    if test.get("expected", "") == "green" and re.search(
        r"@assert pixel .* 0,0,0,0;", test["code"]
    ):
        print("Probable incorrect pixel test in %s" % name)

    code = expand_test_code(test["code"])

    expectation_html = ""
    if "expected" in test and test["expected"] is not None:
        expected = test["expected"]
        expected_img = None
        if expected == "green":
            expected_img = "/images/green-100x50.png"
        elif expected == "clear":
            expected_img = "/images/clear-100x50.png"
        else:
            if ";" in expected:
                print("Found semicolon in %s" % name)
            expected = re.sub(
                r"^size (\d+) (\d+)",
                r"surface = cairo.ImageSurface(cairo.FORMAT_ARGB32, \1, \2)\ncr = cairo.Context(surface)",
                expected,
            )

            if mapped_name.endswith("-manual"):
                png_name = mapped_name[: -len("-manual")]
            else:
                png_name = mapped_name

            for output_dir in (canvas_output_dir, offscreen_output_dir):
                if output_dir is None:
                    continue
                current_expected = (
                    f"{expected}\nsurface.write_to_png('{output_dir}/{png_name}.png')\n"
                )
                eval(
                    compile(current_expected, "<test %s>" % test["name"], "exec"),
                    {},
                    {"cairo": cairo},
                )

            expected_img = "%s.png" % name

        if expected_img:
            expectation_html = (
                '<p class="output expectedtext">Expected output:'
                + '<p><img src="%s" class="output expected" id="expected" alt="">'
                % (expected_img)
            )

    canvas = test.get("canvas", 'width="100" height="50"')

    notes = '<p class="notes">%s' % test["notes"] if "notes" in test else ""

    timeout = (
        '\n<meta name="timeout" content="%s">' % test["timeout"]
        if "timeout" in test
        else ""
    )

    scripts = ""
    for s in test.get("scripts", []):
        scripts += '<script src="%s"></script>\n' % (s)

    variants = test.get("script-variants", {})
    script_variants = [
        (v, '<script src="%s"></script>\n' % (s)) for (v, s) in variants.items()
    ]
    if not script_variants:
        script_variants = [("", "")]

    images = ""
    for i in test.get("images", []):
        id = i.split("/")[-1]
        if "/" not in i:
            i = "../images/%s" % i
        images += f'<img src="{i}" id="{id}" class="resource">\n'
    for i in test.get("svgimages", []):
        id = i.split("/")[-1]
        if "/" not in i:
            i = "../images/%s" % i
        images += (
            '<svg><image xlink:href="{}" id="{}" class="resource"></svg>\n'.format(
                i, id
            )
        )
    images = images.replace("../images/", "/images/")

    fonts = ""
    fonthack = ""
    for i in test.get("fonts", []):
        fonts += '@font-face {{\n  font-family: {};\n  src: url("/fonts/{}.ttf");\n}}\n'.format(
            i, i
        )
        # Browsers require the font to actually be used in the page
        if test.get("fonthack", 1):
            fonthack += (
                '<span style="font-family: %s; position: absolute; visibility: hidden">A</span>\n'
                % i
            )
    if fonts:
        fonts = "<style>\n%s</style>\n" % fonts

    fallback = test.get("fallback", '<p class="fallback">FAIL (fallback content)</p>')

    desc = test.get("desc", "")
    escaped_desc = simpleEscapeJS(desc)

    attributes = test.get("attributes", "")
    if attributes:
        context_args = "'2d', %s" % attributes.strip()
        attributes = ", " + attributes.strip()
    else:
        context_args = "'2d'"

    for (variant, extra_script) in script_variants:
        name_variant = "" if not variant else "." + variant

        template_params = {
            "attributes": attributes,
            "canvas": canvas,
            "code": code,
            "context_args": context_args,
            "desc": desc,
            "escaped_desc": escaped_desc,
            "expected": expectation_html,
            "fallback": fallback,
            "fonthack": fonthack,
            "fonts": fonts,
            "images": images,
            "name": name + name_variant,
            "notes": notes,
            "scripts": scripts + extra_script,
            "timeout": timeout,
        }

        offscreen_template = templates["w3coffscreencanvas"]
        worker_template = templates["w3cworker"]
        canvas_template = templates["w3ccanvas"]

        if not include_done or "then(t_pass, t_fail);" in code:
            offscreen_template = templates["w3coffscreencanvas"].replace(
                "t.done();\n\n", ""
            )
            worker_template = templates["w3cworker"].replace("t.done();\n\n", "")
            canvas_template = templates["w3ccanvas"].replace("t.done();\n", "")

        if OffscreenCanvas_test:
            with open(
                f"{offscreen_output_dir}/{mapped_name}{name_variant}.html",
                "wt",
                encoding="utf-8",
            ) as f:
                f.write(offscreen_template % template_params)
            timeout = (
                "// META: timeout=%s\n" % test["timeout"] if "timeout" in test else ""
            )
            template_params["timeout"] = timeout
            with open(
                f"{offscreen_output_dir}/{mapped_name}{name_variant}.worker.js",
                "wt",
                encoding="utf-8",
            ) as f:
                f.write(worker_template % template_params)

        if HTMLCanvas_test:
            with open(
                f"{canvas_output_dir}/{mapped_name}{name_variant}.html",
                "wt",
                encoding="utf-8",
            ) as f:
                f.write(canvas_template % template_params)


def genTestUtils(
    test_yaml_directory: str,
    TEMPLATEFILE: str,
    NAME2DIRFILE: str,
    canvas_output_dir: str = None,
    offscreen_output_dir: str = None,
    include_done: bool = False,
) -> None:
    # Run with --test argument to run unit tests
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        import doctest

        doctest.testmod()
        sys.exit()

    with open(TEMPLATEFILE, "rt") as f:
        templates = yaml.safe_load(f.read())

    with open(NAME2DIRFILE, "rt") as f:
        name_mapping = yaml.safe_load(f.read())

    tests = []
    TESTSFILES = [
        os.path.join(test_yaml_directory, f)
        for f in os.listdir(test_yaml_directory)
        if f.endswith(".yaml")
    ]
    for testfile in TESTSFILES:
        with open(testfile, "rt") as f:
            for t in yaml.safe_load(f.read()):
                if "DISABLED" in t:
                    continue
                if "meta" in t:
                    eval(compile(t["meta"], "<meta test>", "exec"), {}, {"tests": tests})
                else:
                    tests.append(t)

    # Ensure the test output directories exist
    testdirs = {d for d in [canvas_output_dir, offscreen_output_dir] if d is not None}
    for map_dir in set(name_mapping.values()):
        for d in testdirs.copy():
            testdirs.add(f"{d}/{map_dir}")

    for d in testdirs:
        try:
            os.mkdir(d)
        except OSError:
            pass  # ignore if it already exists

    used_tests = {}
    for i, test in enumerate(tests):
        name = test["name"]
        print("\r(%s)" % name, " " * 32, "\t")

        if name in used_tests:
            print("Test %s is defined twice" % name)
        used_tests[name] = 1

        generate_test(
            templates,
            test,
            name_mapping,
            canvas_output_dir,
            offscreen_output_dir,
            include_done,
        )

    print()
