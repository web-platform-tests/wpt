#!/bin/bash

# This script generates coverage statistics for the C-based cbor2
# implementation. It assumes you have the "lcov" package installed, and that
# you are in a Python virtual-env into which the cbor2 package can be installed
# with --editable. To support the C implementation, the Python interpreter for
# the virtual-env must be version 3.3 or later.
#
# NOTE: the script "touches" all *.c files to ensure all are rebuilt with the
# -coverage option. This may mess with editors notion of whether those files
# have changed if they are open at the time the script is run.

touch source/*.c
CFLAGS="-coverage" pip install -v -e .[test]
find build/temp.*/source -name "*.gcda" -delete
py.test -v
mkdir -p coverage/
lcov --capture -d build/temp.*/source/ --output-file coverage/coverage.info
genhtml coverage/coverage.info --out coverage/
python $(dirname $0)/coverage_server.py
