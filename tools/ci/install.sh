#!/bin/bash
set -ex

if [[ $RUN_JOB -eq 1 ]]; then
    pip install -U setuptools
    pip install -U requests
    pip install -U virtualenv
fi
