#!/bin/bash
set -e

ROOT=$PWD

pip install -U tox codecov
cd tools
tox

if [ $TOXENV == "py27" ] || [ $TOXENV == "pypy" ]; then
  cd wptrunner
  tox

  cd $ROOT
  pip install --requirement tools/wpt/requirements.txt
  ./wpt install firefox browser --destination $HOME
  ./wpt install firefox webdriver --destination $HOME/firefox
  export PATH=$HOME/firefox:$PATH

  cd $ROOT/resources/test
  tox
fi

cd $ROOT

coverage combine tools tools/wptrunner
codecov
