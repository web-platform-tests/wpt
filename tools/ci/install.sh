#!/bin/bash
set -ex

WPT_ROOT=$(cd $(dirname "$0")/../.. && pwd -P)
cd $WPT_ROOT

if [[ $RUN_JOB -eq 1 ]]; then
    pip install -U setuptools
    pip install -U requests
fi
