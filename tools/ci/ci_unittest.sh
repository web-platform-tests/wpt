#!/bin/bash
set -e

SCRIPT_DIR=$(dirname $(readlink -f "$0"))
WPT_ROOT=$(readlink -f $SCRIPT_DIR/../..)
cd $WPT_ROOT

pip install -U tox codecov
cd tools
tox

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

cd $WPT_ROOT

coverage combine tools tools/wptrunner
codecov
