#!/bin/bash
set -e

SCRIPT_DIR=$(cd $(dirname "$0") && pwd -P)
WPT_ROOT=$SCRIPT_DIR/../..
cd $WPT_ROOT

source tools/ci/lib.sh

main() {
    git fetch --quiet --unshallow https://github.com/web-platform-tests/wpt.git +refs/heads/*:refs/remotes/origin/*
    install_chrome unstable
    pip install --user -U tox codecov
    cd tools/wpt
    tox
}

main
