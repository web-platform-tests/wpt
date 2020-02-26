import re
import subprocess
import os
import sys

import serve


def get_route_builder_func(report):
    def get_route_builder(aliases):
        builder = serve.get_route_builder(aliases)
        # Add Wave specific Handler
        from ..wave.wave_server import WaveServer
        wave_server = WaveServer()
        wave_server.initialize(
            configuration_file_path=os.path.abspath("./config.json"),
            reports_enabled=report)

        class WaveHandler(object):
            def __call__(self, request, response):
                wave_server.handle_request(request, response)

        wave_handler = WaveHandler()
        builder.add_handler("*", "/wave*", wave_handler)
        # serving wave specifc testharnessreport.js
        builder.add_static(
            "tools/wave/resources/testharnessreport.js",
            {},
            "text/javascript;charset=utf8",
            "/resources/testharnessreport.js")
        return builder
    return get_route_builder


class ConfigBuilder(serve.ConfigBuilder):
    _default = serve.ConfigBuilder._default
    _default.update({
        # wave specific configuration parameters
        "results": "./results",
        "timeouts": {
            "automatic": 60000,
            "manual": 300000
        },
        "enable_results_import": False,
        "web_root": "/wave",
        "persisting_interval": 20,
        "api_titles": []
    })


def get_parser():
    parser = serve.get_parser()
    # Added wave specific arguments
    parser.add_argument("--report", action="store_true", dest="report",
                        help="Flag for enabling the WPTReporting server")
    return parser


# used for semantic version comparison
def is_semver(prefix, line):
    idx = len(prefix)
    # slice the prefix, because is not valid semantic versioning
    line = line[idx:] if line.find(prefix, 0, idx) != -1 else line
    line = line.strip()
    # semantic versioning, see: https://semver.org/
    # regex: https://regex101.com/r/vkijKf/1/
    regex = re.match(('^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)'
            '(?:-('
            '(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)'
            '(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))'
            '*))'
            '?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$'), line)
    return regex


# execute wptreport version check
def is_wptreport_installed():
    try:
        report_p = subprocess.check_output(["wptreport", "--version"])
    except subprocess.CalledProcessError:
        return False
    for line in report_p:
        if line and not line.isspace():
            if not is_semver("wptreport", line):
                return False
            else:
                return True


# Set command is_wave and start venv with necessary dependencies
def run(venv=None, **kwargs):
    if venv is not None:
        venv.start()
    else:
        raise Exception("Missing virtualenv for serve-wave.")

    if kwargs['report'] is True:
        if not is_wptreport_installed():
            raise Exception("wptreport is not installed. Please install it from https://github.com/w3c/wptreport!!")

    serve.run(config_cls=ConfigBuilder,
              route_builder=get_route_builder_func(kwargs["report"]), **kwargs)
