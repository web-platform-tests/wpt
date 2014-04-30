# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this file,
# You can obtain one at http://mozilla.org/MPL/2.0/.

import sys
import os
import shutil
from setuptools import setup, find_packages

PACKAGE_NAME = 'wptrunner'
PACKAGE_VERSION = '0.2.5'

# dependencies
with open('requirements.txt') as f:
    deps = f.read().splitlines()

profile_dest = None
dest_exists = False
try:
    # Hack to include the default profiles in the distribution
    if "sdist" in sys.argv:
        profile_src = os.path.abspath(os.path.join("..", "profiles"))
        profile_dest = os.path.abspath(os.path.join("wptrunner", "prefs"))
        dest_exists = os.path.exists(profile_dest)
        shutil.copytree(profile_src, profile_dest)

    setup(name=PACKAGE_NAME,
          version=PACKAGE_VERSION,
          description="Harness for running the W3C web-platform-tests against various Mozilla products",
          author='Mozilla Automation and Testing Team',
          author_email='tools@lists.mozilla.org',
          license='MPL 1.1/GPL 2.0/LGPL 2.1',
          packages=find_packages(exclude=["tests", "metadata", "prefs"]),
          entry_points = {
              'console_scripts': [
                  'wptrunner = wptrunner.wptrunner:main',
                  'wptupdate = wptrunner.update:main',
              ]
          },
          zip_safe=False,
          platforms =['Any'],
          classifiers=['Development Status :: 4 - Beta',
                       'Environment :: Console',
                       'Intended Audience :: Developers',
                       'License :: OSI Approved :: Mozilla Public License 2.0 (MPL 2.0)',
                       'Operating System :: OS Independent',
                      ],
          package_data={"wptrunner": ["testharness.js",
                                      "reftest.js",
                                      "testharnessreport.js",
                                      "gecko_runner.html",
                                      "config.json",
                                      "server-locations.txt",
                                      "device_setup/*",
                                      "prefs/*"]},
          include_package_data=True,
          data_files=[("config", ["config.ini"])],
          install_requires=deps
         )
finally:
    if profile_dest is not None and not dest_exists and os.path.exists(profile_dest):
        shutil.rmtree(profile_dest)
