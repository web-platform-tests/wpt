#!/bin/bash
set -ex

SCRIPT_DIR=$(cd $(dirname "$0") && pwd -P)
WPT_ROOT=$SCRIPT_DIR/../..
cd $WPT_ROOT

./tools/ci/taskcluster-run.py chrome dev -- --channel=dev --no-fail-on-unexpected --instrument-to-file=../artifacts/instruments_chrome.log --include=infrastructure/
./tools/ci/taskcluster-run.py firefox nightly -- --channel=nightly --no-fail-on-unexpected --instrument-to-file=../artifacts/instruments_firefox.log --include=infrastructure/

