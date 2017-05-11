#!/bin/bash
set -e

ROOT=$PWD
geckodriver_url=https://github.com/mozilla/geckodriver/releases/download/v0.16.1/geckodriver-v0.16.1-linux64.tar.gz

pip install -U tox codecov
cd tools
tox

if [ $TOXENV == "py27" ] || [ $TOXENV == "pypy" ]; then
  cd wptrunner
  tox

  cd $ROOT/resources/test
  curl --location $geckodriver_url | tar -xvz
  PATH=$PATH:. tox
fi

cd $ROOT

coverage combine tools tools/wptrunner
codecov
