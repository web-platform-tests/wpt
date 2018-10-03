#!/bin/bash
set -ex

if [[ $RUN_JOB -eq 1 ]]; then
    $SCRIPT
fi
