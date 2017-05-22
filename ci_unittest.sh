#!/bin/bash
set -e

ROOT=$PWD
geckodriver_url=https://github.com/mozilla/geckodriver/releases/download/v0.16.1/geckodriver-v0.16.1-linux64.tar.gz
firefox_url='https://download.mozilla.org/?product=firefox-53.0&lang=en-US&os=linux64'

pip install -U tox codecov
cd tools
tox

if [ $TOXENV == "py27" ] || [ $TOXENV == "pypy" ]; then
  cd wptrunner
  tox

  mkdir $HOME/geckodriver
  cd $HOME/geckodriver
  curl --location $geckodriver_url | tar -xvz
  cd $HOME
  curl --location $firefox_url | tar -xvj

  export PATH=$HOME/firefox:$PATH:$HOME/geckodriver

  cd $ROOT/resources/test
  tox
fi

cd $ROOT

coverage combine tools tools/wptrunner
codecov
