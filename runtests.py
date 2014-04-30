#!/usr/bin/env python
import os
import sys

from wptrunner import wptrunner

deps = ['marionette',
        'mozprocess',
        'mozprofile',
        'mozrunner',
        'mozinfo']

here = os.path.dirname(__file__)
mozbase = os.path.realpath(os.path.join(here, '..', 'mozbase'))

for dep in deps:
    module = os.path.join(mozbase, dep)
    if module not in sys.path:
        sys.path.insert(0, module)

if __name__ == "__main__":
    success = wptrunner.main()
    if not success:
        sys.exit(1)
