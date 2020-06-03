import errno
import os
import socket
import subprocess
import time

try:
    from urllib.request import urlopen
    from urllib.error import URLError
except ImportError:
    from urllib2 import urlopen, URLError

from tools.wpt import wpt

def is_port_8080_in_use():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.bind(("127.0.0.1", 8080))
    except socket.error as e:
        if e.errno == errno.EADDRINUSE:
            return True
        else:
            raise e
    finally:
        s.close()
    return False

def test_serve():
    print("Checking port")
    if is_port_8080_in_use():
        assert False, "WAVE Test Runner failed: Port 8080 already in use."
    print("Port good")

    print("Calling serve-wave")
    f = open("/tmp/log.txt", "w")
    p = subprocess.Popen([os.path.join(wpt.localpaths.repo_root, "wpt"),
        "serve-wave",
        "--config",
        os.path.join(wpt.localpaths.repo_root, "tools/wave/tests/config.json")],
        stdout=f, #subprocess.PIPE,
        stderr=subprocess.STDOUT
    )

    start = time.time()
    try:
        while True:
            print("Polling server...")
            if p.poll() is not None:
                print('p.poll() returned non-None')
                assert False, "WAVE Test Runner failed: Server not running."
            if time.time() - start > 10 * 60:
                print('TIMED OUT')
                assert False, "WAVE Test Runner failed: Server did not start responding within 6m."
            try:
                resp = urlopen("http://web-platform.test:8080/_wave/api/sessions/public")
                print('Got a response:')
                print(resp)
            except URLError:
                print("Server not responding, waiting another 10s.")
                time.sleep(10)
            else:
                assert resp.code == 200
                print('SUCCESS')
                break
    finally:
        p.terminate()
        output, _ = p.communicate()
        print(output)
