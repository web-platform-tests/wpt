#!/bin/sh
set -e

pip install -U tox codecov
cd tools
tox
coverage combine
codecov
