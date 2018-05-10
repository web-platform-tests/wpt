import json
import os
import subprocess
import time
import sys
import urllib2

# Some tests may emit errors that the URL of the originating document. The
# server is configured with the following explicit values so that the test
# expectations can be defined statically.
configuration_file = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), 'wpt-server-config.json'
)

class WPTServer(object):
    def __init__(self, wpt_root):
        self.wpt_root = wpt_root
        with open(configuration_file, 'r') as handle:
            config = json.load(handle)
        self.host = config["browser_host"]
        self.http_port = config["ports"]["http"][0]
        self.https_port = config["ports"]["https"][0]
        self.base_url = 'http://%s:%s' % (self.host, self.http_port)
        self.https_base_url = 'https://%s:%s' % (self.host, self.https_port)

    def start(self):
        self.devnull = open(os.devnull, 'w')
        self.proc = subprocess.Popen([
                os.path.join(self.wpt_root, 'wpt'),
                'serve',
                '--config',
                configuration_file
            ],
            cwd=self.wpt_root)

        for retry in range(5):
            # Exponential backoff.
            time.sleep(2 ** retry)
            if self.proc.poll() != None:
                break
            try:
                urllib2.urlopen(self.base_url, timeout=1)
                return
            except urllib2.URLError:
                pass

        raise Exception('Could not start wptserve.')

    def stop(self):
        self.proc.terminate()
        self.proc.wait()
        self.devnull.close()

    def url(self, abs_path):
        return self.https_base_url + '/' + os.path.relpath(abs_path, self.wpt_root)
