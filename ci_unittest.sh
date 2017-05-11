#!/bin/bash
set -e

ROOT=$PWD
geckodriver_url=https://github.com/mozilla/geckodriver/releases/download/v0.16.1/geckodriver-v0.16.1-linux64.tar.gz

pip install -U tox codecov

which firefox
firefox --version
file `which firefox`

cd $ROOT/resources/test
curl --location $geckodriver_url | tar -xvz
PATH=$PATH:. tox
