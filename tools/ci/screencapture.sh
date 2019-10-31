#!/bin/bash

# capture 30 seconds of video every 10 minutes, at most 10 times

PREFIX="$1"

get_filename () {
  EXT="$1"
  NOW=`date -u "+%Y-%m-%d_%H-%M-%S"`
  echo "${PREFIX}_${NOW}.${EXT}"
}

capture () {
  DURATION="$1"
  if command -v screencapture > /dev/null; then
    # macOS
    FILENAME=`get_filename mov`
    screencapture -V "$DURATION" "$FILENAME"
  elif command -v ffmpeg > /dev/null; then
    # Linux
    FILENAME=`get_filename mp4`
    ffmpeg -y -video_size "${SCREEN_WIDTH}x${SCREEN_HEIGHT}" -framerate 30 \
      -f x11grab -i "$DISPLAY" -t "$DURATION" "$FILENAME"
  else
    echo "No screen capture method found"
    exit 1
  fi
}

seq 10 | while read _; do
  capture 30
  sleep 570
done
