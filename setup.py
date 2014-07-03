# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this file,
# You can obtain one at http://mozilla.org/MPL/2.0/.

from setuptools import setup, find_packages

PACKAGE_NAME = 'wptrunner'
PACKAGE_VERSION = '0.3.13'

# dependencies
with open('requirements.txt') as f:
    deps = f.read().splitlines()

profile_dest = None
dest_exists = False

setup(name=PACKAGE_NAME,
      version=PACKAGE_VERSION,
      description="Harness for running the W3C web-platform-tests against various products",
      author='Mozilla Automation and Testing Team',
      author_email='tools@lists.mozilla.org',
      license='MPL 1.1/GPL 2.0/LGPL 2.1',
      packages=find_packages(exclude=["tests", "metadata", "prefs"]),
      entry_points={
          'console_scripts': [
              'wptrunner = wptrunner.wptrunner:main',
              'wptupdate = wptrunner.update:main',
          ]
      },
      zip_safe=False,
      platforms=['Any'],
      classifiers=['Development Status :: 4 - Beta',
                   'Environment :: Console',
                   'Intended Audience :: Developers',
                   'License :: OSI Approved :: Mozilla Public License 2.0 (MPL 2.0)',
                   'Operating System :: OS Independent'],
      package_data={"wptrunner": ["executors/testharness_marionette.js",
                                  "executors/testharness_webdriver.js",
                                  "executors/reftest.js",
                                  "executors/reftest-wait.js",
                                  "testharnessreport.js",
                                  "testharness_runner.html",
                                  "config.json",
                                  "browsers/server-locations.txt",
                                  "browsers/b2g_setup/*",
                                  "prefs/*"]},
      include_package_data=True,
      data_files=[("config", ["config.ini"])],
      install_requires=deps
     )
