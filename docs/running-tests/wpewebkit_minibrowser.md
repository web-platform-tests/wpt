# WPE WebKit MiniBrowser

To be able to run tests with the [WPE WebKit](https://wpewebkit.org)
MiniBrowser you need the following packages installed:

* Fedora: N/A (build your own or use the nighly bundle)
* Debian or Ubuntu: `wpewebkit-driver` and `libwpewebkit`
* Arch:  `wpewebkit`

The WPE WebKit MiniBrowser is not installed on the default binary path.
The `wpt` script will try to automatically locate it, but if you need
to run it manually you can find it on any of this paths:

* Arch: `/usr/lib/wpe-webkit-${APIVERSION}/MiniBrowser`
* Debian or Ubuntu: `/usr/lib/${TRIPLET}/wpe-webkit-${APIVERSION}/MiniBrowser`
  * Note: `${TRIPLET}` is the output of the command `gcc -dumpmachine`

# Nightly universal bundle

Alternatively you can pass to `wpt` the flags `--install-browser --channel=nightly`
and then `wpt` will automatically download the last bundle and unpack it on the
default `wpt` working directory (usually subdir `_venv3/browsers` in your `wpt` checkout)
Then it will use the unpacked `MiniBrowser` and `WPEWebDriver` binaries to run the tests.

This universal bundles should work on any Linux distribution as they include inside
the tarball all the system libraries and resources needed to run WebKitGTK, from libc
up to the Mesa graphics drivers without requiring the usage of containers.

If you are not using open source graphics drivers (Mesa) and you experience issues
with this bundle then a possible workaround is to try to run the tests in headless
mode, for that pass the flag `--headless` to `wpt`

# Headless mode

The WPE MiniBrowser needs a Wayland display to run, but if you don't have one
or you want to enable headless mode you can pass the flag `--headless` to `wpt`.

Example:
   ```
   ./wpt run [more-options] --headless wpewebkit_minibrowser [tests-to-run]
   ```

# Using a custom WPE WebKit build

If you want to test with a custom WPE WebKit build the easiest way is that you
install this build in a temporary directory and then tell wpt to run it from there.

Steps:

  1. Build WPE WebKit passing the arguments `-DENABLE_MINIBROWSER=ON -DCMAKE_INSTALL_PREFIX=/home/user/testdir_install'
  2. Install it: `ninja install` (or `make install`)
  3. Locate the `MiniBrowser` and `WPEWebDriver` binaries under /home/user/testdir_install`
  4. Run `wpt` passing this two paths like this:
  ```
      ./wpt run --webdriver-binary=/home/user/testdir_install/bin/WPEWebDriver \
                --binary=/home/user/testdir_install/libexec/MiniBrowser \
                [more-options] webkitgtk_minibrowser [tests-to-run]
  ```

Note: It is important that you build WPE WebKit against the libraries of your system.
Do not build WPE WebKit inside Flatpak or other container unless you run `wpt` also
from inside this container.

# Running tests locally

Is a good idea that you increase the verbosity of `wpt` by passing to it the flag `--log-mach=-`
Also, please check the documentation about [Running Tests from the Local System](from-local-system).
