#!/bin/bash
set -e

SCRIPT_DIR=$(cd $(dirname "$0") && pwd -P)
WPT_ROOT=$SCRIPT_DIR/../..
cd $WPT_ROOT

main() {
    git fetch --quiet --unshallow https://github.com/web-platform-tests/wpt.git +refs/heads/*:refs/remotes/origin/*

    # wpt commands integration tests
    cd tools/wpt
    uv tool run  tox
    cd $WPT_ROOT

    # WMAS test runner integration tests
    cd tools/wave
    uv tool run tox
    cd $WPT_ROOT
}

main
