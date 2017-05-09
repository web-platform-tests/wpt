# atta-example
#
# a skeletal implementation of an Accessible Technology Test Adapter
#
# Developed by Benjamin Young (@bigbulehat) and Shane McCarron (@halindrome).
# Sponsored by Spec-Ops (https://spec-ops.io)
#
# Copyright (c) 2016 Spec-Ops
#
# for license information, see http://www.w3.org/Consortium/Legal/2008/04-testsuite-copyright.html

import os
import sys

here = os.path.abspath(os.path.split(__file__)[0])
repo_root = os.path.abspath(os.path.join(here, os.pardir, os.pardir))

sys.path.insert(0, os.path.join(repo_root, "tools"))
sys.path.insert(0, os.path.join(repo_root, "tools", "six"))
sys.path.insert(0, os.path.join(repo_root, "tools", "html5lib"))
sys.path.insert(0, os.path.join(repo_root, "tools", "wptserve"))
sys.path.insert(0, os.path.join(repo_root, "tools", "pywebsocket", "src"))
sys.path.insert(0, os.path.join(repo_root, "tools", "py"))
sys.path.insert(0, os.path.join(repo_root, "tools", "pytest"))
sys.path.insert(0, os.path.join(repo_root, "tools", "webdriver"))

import hashlib
import json
import urlparse

import wptserve
from wptserve.logger import set_logger, get_logger

debug = True
myAPI = 'WAIFAKE'
myAPIversion = 0.1
myprotocol = 'http'
myhost = 'localhost'
port = 4119
doc_root = os.path.join(repo_root, "wai-aria", "tools", "files")

URIroot = myprotocol + '://' + myhost + ':{0}'.format(port)

# testName is a test designation from the testcase
testName = ""
# testWindow should be a handle to the window under test while a test is running
testWindow = None

def dump_json(obj):
    return json.dumps(obj, indent=4, sort_keys=True)

def add_cors_headers(resp):
    headers_file = doc_root + '/cors.headers'
    resp.headers.update(load_headers_from_file(headers_file))

def load_headers_from_file(path):
    headers = []
    with open(path, 'r') as header_file:
        data = header_file.read()
        headers = [tuple(item.strip() for item in line.split(":", 1))
                   for line in data.splitlines() if line]
    return headers

def get_params(request, params):
    resp = { "error": "" }

    logger = get_logger()

    # loop over params and attempt to retrieve values
    # return the values in a response dictionary
    #
    # if there is an error, return it in the error member of the response

    submission = {}

    try:
        submission = json.loads(request.body)
        for item in params:
            try:
                resp[item] = submission[item]
            except:
                if debug:
                    print "\tParameter " + item + " missing"
                resp['error'] += "No such parameter: " + item + "; "
    except:
        resp['error'] = "Cannot decode submitted body as JSON; "

    return resp

@wptserve.handlers.handler
def head(request, response):
    response.status = 200

    add_cors_headers(response)
    response.headers.update(load_headers_from_file(doc_root + '/aria.headers'))

    response.content = None


@wptserve.handlers.handler
def options(request, response):
    add_cors_headers(response)
    response.headers.update(load_headers_from_file(doc_root + '/aria.headers'))

    response.status = 200

    add_cors_headers(response)
    response.headers.update(load_headers_from_file(doc_root + '/aria.headers'))
    response.headers.update("Content-Type", "text/plain")

    response.content = "ATTA Options\n";


@wptserve.handlers.handler
def runTests(request, response):
    logger = get_logger()
    runResp = {
            "status":     "OK",
            "statusText": "",
            "results":    []
            }

    params = get_params(request, [ 'title', 'id', 'data' ])

    if (params['error'] == ""):
        # we got the input we wanted

        # element to be examined is in the id parameter
        # data to check is in the data parameter
        if debug:
            print "Running test " + params['title']

        theTests = {}

        try:
            theTests = params['data']

            # loop over each item and update the results

            for assertion in theTests:
                # evaluate the assertion
                runResp['results'].append({ "result": "PASS", "message": ""})

        except Exception as ex:
            template = "An exception of type {0} occured. Arguments:\n{1!r}"
            message = template.format(type(ex).__name__, ex.args)
            logger.error(message)
            runResp['status'] = "ERROR"
            runResp['statusText'] += message

    else:
        runResp['status'] = "ERROR"
        runResp['statusText'] = params['error']

    add_cors_headers(response)
    response.headers.update(load_headers_from_file(doc_root + '/aria.headers'))
    response.status = 200
    response.content = dump_json(runResp)

@wptserve.handlers.handler
def startTest(request, response):
    method = request.method

    testResp = {
            "status": "READY",
            "statusText": "",
            "ATTAname":    "WPT Sample ATTA",
            "ATTAversion": 1,
            "API":         myAPI,
            "APIversion":  myAPIversion
            }

    params = get_params(request, [ 'test', 'url' ])

    if (params['error'] == ""):
        # we got the input we wanted

        # look for a window that talks about URL

        try:
            # do nothing
            testResp['status'] = "READY"
            testName = params['test']
            # this would be a REAL A11Y reference
            testWindow = params['url']

            if debug:
                print "Starting test '" + testName + "' at url '" + testWindow + "'"

        except:
            # there is an error
            testResp['status'] = "ERROR"
            testResp['statusText'] += "Failed to find window for " + params.url + " as JSON"

    else:
        testResp['status'] = "ERROR"
        testResp['statusText'] = params['error']

    add_cors_headers(response)
    response.headers.update(load_headers_from_file(doc_root + '/aria.headers'))
    response.status = 200

    if (method != "HEAD"):
        response.content = dump_json(testResp)
    else:
        response.content = "ATTA Head\n"
        response.headers.update("Content-Type", "text/plain")

@wptserve.handlers.handler
def endTest(request, response):
    method = request.method

    resp  = {
            "status": "DONE",
            "statusText": "",
            }

    testName = ""
    testWindow = None

    add_cors_headers(response)
    response.headers.update(load_headers_from_file(doc_root + '/aria.headers'))
    response.status = 200
    response.content = dump_json(resp)

class myLogger(object):
    def critical(self, msg):
        print "CRITICAL: " + msg
        pass

    def error(self, msg):
        print "ERROR: " + msg
        pass

    def info(self, msg):
        print "INFO: " + msg
        pass

    def warning(self, msg):
        print "WARN: " + msg
        pass

    def debug(self, msg):
        print "DEBUG: " + msg
        pass

if __name__ == '__main__':
    print 'http://' + myhost + ':{0}/'.format(port)
    set_logger(myLogger())

    routes = [
        ("HEAD", "", head),
        ("GET", "", wptserve.handlers.file_handler),
        ("GET", "index.html", wptserve.handlers.file_handler),

        # start a test
        ("POST", "start", startTest),
        ("GET", "start", startTest),
        ("HEAD", "start", startTest),

        # perform an individual test
        ("POST", "test", runTests),
        ("GET", "test", runTests),

        # end testing
        ("GET", "end", endTest),
        ("POST", "end", endTest),
    ]

    httpd = wptserve.server.WebTestHttpd(host=myhost, bind_hostname=myhost, port=port, doc_root=doc_root,
                                         routes=routes)
    httpd.start(block=True)
