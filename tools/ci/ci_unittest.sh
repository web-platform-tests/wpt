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
    if [ $TOXENV == "py27" ] || [ $TOXENV == "pypy" ]; then
        cd wptrunner
        tox

        cd $WPT_ROOT
        pip install --requirement tools/wpt/requirements.txt
        ./wpt install firefox browser --destination $HOME
        ./wpt install firefox webdriver --destination $HOME/firefox
        export PATH=$HOME/firefox:$PATH

        cd $WPT_ROOT/resources/test
        tox
    fi
else
    echo "Skipping wptrunner unittest"
fi

cd $WPT_ROOT
