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
from http.server import BaseHTTPRequestHandler, HTTPServer

here = os.path.abspath(os.path.split(__file__)[0])
repo_root = os.path.abspath(os.path.join(here, os.pardir, os.pardir))

sys.path.insert(0, os.path.join(repo_root, "tools"))
sys.path.insert(0, os.path.join(repo_root, "tools", "six"))

import hashlib
import json

debug = True
myAPI = 'WAIFAKE'
myAPIversion = 0.1
myprotocol = 'http'
myhost = 'localhost'
myport = 4119
doc_root = os.path.join(repo_root, "wai-aria", "tools", "files")

URIroot = myprotocol + '://' + myhost + ':{0}'.format(myport)

# testName is a test designation from the testcase
testName = ""
# testWindow should be a handle to the window under test while a test is running
testWindow = None

def dump_json(obj):
    return json.dumps(obj, indent=4, sort_keys=True)

def add_aria_headers(resp):
    resp.send_header('Content-Type', "application/json")
    add_headers(resp)

def add_headers(resp):
    resp.send_header('Access-Control-Allow-Headers', "Content-Type")
    resp.send_header('Access-Control-Allow-Methods', "POST")
    resp.send_header('Access-Control-Allow-Origin', "*")
    resp.send_header('Access-Control-Expose-Headers', "Allow, Content-Type")
    resp.send_header('Allow', "POST")
    resp.end_headers()

def get_params(request, params):
    resp = { "error": "" }

    # loop over params and attempt to retrieve values
    # return the values in a response dictionary
    #
    # if there is an error, return it in the error member of the response

    submission = {}

    try:
        len = request.headers.__getitem__('content-length')
        print ("Length is " + len )
        content = request.rfile.read(int(len))
        dec = content.decode("utf-8")
        submission = json.loads(dec)
        for item in params:
            try:
                resp[item] = submission[item]
            except:
                if debug:
                    print ("\tParameter " + item + " missing")
                resp['error'] += "No such parameter: " + item + "; "
    except Exception as ex:
        template = "An exception of type {0} occured. Arguments:\n{1!r}"
        message = template.format(type(ex).__name__, ex.args)
        print (message)
        resp['error'] = "Cannot decode submitted body as JSON; "

    return resp

def listenFor(request):
    listenResp = {
            "status":     "READY",
            "statusText": "",
            "log":        ""
            }

    params = get_params(request, [ 'events' ])

    if (params['error'] == ""):
        # we got the input we wanted

        # element to be examined is in the id parameter
        # data to check is in the data parameter
        if debug:
            print ("Handling events")

        try:
            theEvents = params['events']

            # loop over each item and update the results

            for event in theEvents:
                print("Looking for event " + event)
                listenResp['log'] += "   listening for " + event + "\n";

        except Exception as ex:
            template = "An exception of type {0} occured. Arguments:\n{1!r}"
            message = template.format(type(ex).__name__, ex.args)
            print("ERROR: " + message)
            listenResp['status'] = "ERROR"
            listenResp['statusText'] += message

    else:
        listenResp['status'] = "ERROR"
        listenResp['statusText'] = params['error']

    request.send_response(200)
    add_aria_headers(request)
    request.wfile.write(bytes(dump_json(listenResp), "utf-8"))

def listenStop(request):
    listenResp = {
            "status":     "READY",
            "statusText": "",
            "log":        ""
            }

    # element to be examined is in the id parameter
    # data to check is in the data parameter
    if debug:
        print ("Stopping listening")

    request.send_response(200)
    add_aria_headers(request)
    request.wfile.write(bytes(dump_json(listenResp), "utf-8"))

def runTests(request):
    runResp = {
            "status":     "OK",
            "statusText": "",
            "results":    [],
            "log":        ""
            }

    params = get_params(request, [ 'title', 'id', 'data' ])

    if (params['error'] == ""):
        # we got the input we wanted

        # element to be examined is in the id parameter
        # data to check is in the data parameter
        if debug:
            print ("Running test " + params['title'])

        theTests = {}

        try:
            theTests = params['data']

            # loop over each item and update the results

            for assertion in theTests:
                print("Looking at assertion")
                print(assertion[0] + ", " + assertion[1])
                # evaluate the assertion
                myRes = "PASS"
                myMessage = ""
                if assertion[0] == "shouldFail":
                  myRes = "FAIL"
                  myMessage = "Intentional failure"
                runResp['results'].append({ "result": myRes, "log": "This is a log message\nwith a newline.\n", "message": myMessage})

        except Exception as ex:
            template = "An exception of type {0} occured. Arguments:\n{1!r}"
            message = template.format(type(ex).__name__, ex.args)
            print("ERROR: " + message)
            runResp['status'] = "ERROR"
            runResp['statusText'] += message

    else:
        runResp['status'] = "ERROR"
        runResp['statusText'] = params['error']

    request.send_response(200)
    add_aria_headers(request)
    request.wfile.write(bytes(dump_json(runResp), "utf-8"))

def startTest(request):
    testResp = {
            "status": "READY",
            "statusText": "",
            "ATTAname":    "WPT Sample ATTA",
            "ATTAversion": 1,
            "API":         myAPI,
            "APIversion":  myAPIversion,
            "log":         "Just a simple log message to illustrate how that might work\n    Note that this is in a PRE block\n"
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
                print ("Starting test '" + testName + "' at url '" + testWindow + "'")

        except:
            # there is an error
            testResp['status'] = "ERROR"
            testResp['statusText'] += "Failed to find window for " + params.url + " as JSON"

    else:
        testResp['status'] = "ERROR"
        testResp['statusText'] = params['error']

    request.send_response(200)
    add_aria_headers(request)
    request.wfile.write( bytes(dump_json(testResp), "utf-8"))

def endTest(request):

    resp  = {
            "status": "DONE",
            "statusText": "",
            }

    testName = ""
    testWindow = None

    request.send_response(200)
    add_aria_headers(request)
    request.wfile.write(bytes(dump_json(resp), "utf-8"))

def sendError(request):

    request.send_response(404)
    request.send_header("Content-Type", "text/plain")
    add_headers(request)
    request.wfile.write(bytes("Error: bad request\n", "utf-8"))

class theServer(BaseHTTPRequestHandler):
    def do_GET(self):
        self.dispatch()

    def do_POST(self):
        # pull in arguments
        self.dispatch()

    def dispatch(self):
        myPath = self.path
        if (myPath.endswith('start')):
            startTest(self)
        elif (myPath.endswith('startlisten')):
            listenFor(self)
        elif (myPath.endswith('stoplisten')):
            listenStop(self)
        elif (myPath.endswith('end')):
            endTest(self)
        elif (myPath.endswith('test')):
            runTests(self)
        else:
            sendError(self)


if __name__ == '__main__':
    print ('Starting on http://' + myhost + ':{0}/'.format(myport))

    try:
        server = HTTPServer((myhost, myport), theServer)
        server.serve_forever()

    except KeyboardInterrupt:
        print ("Shutting down")
        server.socket.close
