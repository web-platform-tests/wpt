#!/bin/bash

PREFIX="$1"
VIDEO=true

if [ "$VIDEO" = "true" ]; then
  # capture 30 seconds of video every 30 minutes for at most 2 hours
  seq 4 | while read counter; do
    NOW=`date -u "+%Y-%m-%d_%H-%M-%S"`
    screencapture -V 30 "$PREFIX$NOW.mov"
    sleep 1770
  done
else
  # capture screenshots every 10 seconds for at most 2 hours
  seq 720 | while read counter; do
    NOW=`date -u "+%Y-%m-%d_%H-%M-%S"`
    screencapture -t jpg "$PREFIX$NOW.jpg"
    sleep 10
  done
fi
