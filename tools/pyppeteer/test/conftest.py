import json
import os
import shutil
import subprocess
import tempfile

import pytest
import six

cli_arguments = [
    # https://cs.chromium.org/chromium/src/chrome/test/chromedriver/chrome_launcher.cc?l=70-75&rcl=50b9fd38ae9ca373dc8889637eb94a50eea7dc94
    '--disable-popup-blocking',
    '--enable-automation',
    '--ignore-certificate-errors',
    '--metrics-recording-only',

    # https://cs.chromium.org/chromium/src/chrome/test/chromedriver/chrome_launcher.cc?l=77-92&rcl=50b9fd38ae9ca373dc8889637eb94a50eea7dc94
    '--disable-hang-monitor',
    '--disable-prompt-on-repost',
    '--disable-sync',
    '--no-first-run',
    '--disable-background-networking',
    '--disable-web-resources',
    '--disable-client-side-phishing-detection',
    '--disable-default-apps',
    '--enable-logging',
    '--log-level=0',
    '--password-store=basic',
    '--use-mock-keychain',
    '--test-type=webdriver',
    '--force-fieldtrials=SiteIsolationExtensions/Control',
]

binary = 'google-chrome'

@pytest.fixture
def chrome():
    profile_dir = tempfile.mkdtemp()
    identifier = 'cdp-executor-%s' % six.moves.urllib.parse.quote(profile_dir)
    browser_process = subprocess.Popen(
        [
            binary,
            '--user-data-dir=%s' % profile_dir,
            '--remote-debugging-port=0',
            'data:text/html,%s' % identifier
        ] + cli_arguments,
        stderr=open(os.devnull, 'w')
    )
    port = None

    # > How do I access the browser target?
    # >
    # > The endpoint is exposed as `webSocketDebuggerUrl` in
    # > `/json/version`. Note the `browser` in the URL, rather than `page`.
    # > If Chrome was launched with `--remote-debugging-port=0` and chose
    # > an open port, the browser endpoint is written to both stderr and
    # > the `DevToolsActivePort` file in browser profile folder.
    #
    # https://chromedevtools.github.io/devtools-protocol/

    try:
        while port is None and browser_process.returncode is None:
            try:
                with open('%s/DevToolsActivePort' % profile_dir) as handle:
                    contents = handle.read().strip()
                    port = contents.split('\n')[0]
            except IOError:
                pass

        targets_url = 'http://localhost:%s/json' % port
        candidates = json.loads(
            six.moves.urllib.request.urlopen(targets_url).read()
        )

        for candidate in candidates:
            if identifier in candidate['url']:
                target = candidate
                break
        else:
            raise Exception('Could not locate browser process')

        yield {
            'port': port,
            'targetId': target['id'],
            'webSocketDebuggerUrl': target['webSocketDebuggerUrl']
        }
    finally:
        browser_process.kill()
        shutil.rmtree(profile_dir)

if __name__ == '__main__':
    with chrome() as url:
        print(url)
