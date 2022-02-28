# Installation and Detection Protocol of Browser Binaries and Webdrivers for Chrome and Chromium

This is a detailed description of the process in which `wpt` detects
and installs the browser components for Chrome and Chromium.
This process can seem convoluted and difficult to understand at first glance,
but the reason for this process is to best ensure these components are
compatible with each other and are the intended items that the user
is trying to test.
## Chrome

### Detection
- **Browser Binary**
: Because `wpt` does not offer installation of Chrome browser binaries,
it will not attempt to detect a Chrome browser binary in the virtual environment
directory. Instead, `wpt` attempts to check commonly-used installation locations on
various operating systems. This detection process is only used if the user has not passed
a binary path as an argument using the `--binary` flag.

- **Webdriver**
: ChromeDriver detection for Chrome will only occur if a valid browser binary
has been found and the version for that binary is discernible. Once the browser
binary version is detected, the virtual environment directory will be checked to see
if a matching ChromeDriver version is already installed. If the versions do not match,
the ChromeDriver file will be removed from the directory and the process for webdriver
installation will begin.

Note: Both Chrome and Chromium’s versions of ChromeDriver are stored in separate
directories in the virtual environment directory i.e
`_venv3/bin/{chrome|chromium}/{chromedriver}`. This safeguards `wpt` from accidentally
using Chromium’s ChromeDriver for a Chrome run and vice versa.
Additionally, we do not need to reinstall ChromeDriver versions
if switching between testing Chrome and Chromium.

### Installation
- **Browser Binary**
: Browser binary installation is not provided through `wpt` and will throw a
NotImplementedError if attempted via the install command. The user will need to
have a browser binary on their system that can be detected or provide a path explicitly
using the `--binary` flag.

- **Webdriver**
: A version of ChromeDriver will only be installed once a Chrome browser binary
has been given or detected. A FileNotFoundError will be raised if the user tries
to download ChromeDriver via the install command and a browser binary is not located.
`wpt` will install a version of ChromeDriver that version-matches the browser binary.
The download source for this ChromeDriver is [described here](http://chromedriver.chromium.org/downloads/version-selection).
If a matching ChromeDriver version cannot be found using this process, it is assumed that
the Chrome browser binary is a dev version which does not have a ChromeDriver version available
through official releases. In this case, a version of ChromeDriver is pulled that is associated with
the latest revision of Chromium, as this is currently the closest version we can match for Chrome Dev.

## Chromium

### Detection
- **Browser Binary**
: Chromium browser binary detection is only executed on the virtual environment directory
`_venv3/browsers/{channel}/`. Chromium’s implementation will not attempt to detect a Chromium
browser binary on the user’s system outside of this directory. This detection process is only
used if the user has not passed a binary path as an argument using the `--binary` flag.

- **Webdriver**
: ChromeDriver detection for Chromium will only occur if a valid browser binary has
been found and the version for that binary is discernible. Once the browser binary version
is detected, the virtual environment directory will be checked to see if a matching ChromeDriver
version is already installed. If the versions do not match, the ChromeDriver file will be removed
from the directory and the process for webdriver installation will begin.

### Installation
- **Browser Binary**
: Chromium’s browser binary will be installed from the [Chromium snapshots API](https://storage.googleapis.com/chromium-browser-snapshots/index.html).
If no version is specified by the user, the last revision associated with the user’s operating system will
be downloaded (this revision is obtained by the LAST_CHANGE designation from the snapshots API).
The install path is `_venv3/browsers/{channel}/{chromium_binary}`.
If a version is specified for installation based on the `--browser-version` flag, a
revision number will be detected based on the given version using the [OmahaProxy API](https://omahaproxy.appspot.com/).
Using this revision number, downloading of a matching revision from the Chromium snapshots API
is attempted. Note: This downloading process has been known to be flaky and not all
revisions are provided on the snapshots API. If this install based on a given version
fails, a RequestException will be thrown specifying that the download was unsuccessful.

**Important Note**: If this download process is successful, the Chromium snapshot url
that the browser binary was downloaded from will be kept during the current `wpt` invocation.
If a Chromium ChromeDriver is also downloaded later to match this browser binary,
the same url is used for that download to ensure both components are downloaded from the same source.

- **Webdriver**
: A version of ChromeDriver will only be installed once a Chromium browser binary has
been given or detected. A FileNotFoundError will be raised if the user tries to download
ChromeDriver via the install command and a browser binary is not located. `wpt` will
install a version of ChromeDriver that version-matches the browser binary. The download
source for this ChromeDriver will be the Chromium snapshots API.  If a Chromium browser
binary and webdriver are installed in the same invocation of `wpt`
(e.g. by passing both `--install-browser` and `--install-webdriver` flags), then the
browser binary and ChromeDriver will be pulled from the same Chromium xsnapshots url
(see Important Note from browser binary installation).
Although very unusual, if a Chromium browser binary is detected and it is not
the tip-of-tree revision, and a browser binary was not downloaded and installed during
this invocation of `wpt`, then `wpt` will attempt to detect the revision number from
the browser binary version using the OmahaProxy API like the process mentioned above.
It will then attempt to download the matching ChromeDriver using this revision number
from the Chromium snapshots API.
