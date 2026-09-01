#!/bin/bash
set -ex

SCRIPT_DIR=$(cd $(dirname "$0") && pwd -P)
WPT_ROOT=$SCRIPT_DIR/../..
cd $WPT_ROOT

main() {
    cd $WPT_ROOT
    ./wpt install firefox browser --destination $HOME
    ./wpt install firefox webdriver --destination $HOME/firefox
    export PATH=$HOME/firefox:$PATH

    cd $WPT_ROOT/resources/test
    uv tool run tox -- --binary=$HOME/browsers/nightly/firefox/firefox
}

main
