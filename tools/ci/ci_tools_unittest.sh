#!/bin/bash
set -ex

SCRIPT_DIR=$(dirname $(readlink -f "$0"))
WPT_ROOT=$(readlink -f $SCRIPT_DIR/../..)
cd $WPT_ROOT

if [[ $(./wpt test-jobs --includes tools_unittest; echo $?) -eq 0 ]]; then
    pip install -U tox codecov
    cd tools
    tox
    cd $WPT_ROOT
else
    echo "Skipping tools unittest"
fi

if [[ $(./wpt test-jobs --includes wptrunner_unittest; echo $?) -eq 0 ]]; then
    cd tools/wptrunner
    tox
else
    echo "Skipping wptrunner unittest"
fi

