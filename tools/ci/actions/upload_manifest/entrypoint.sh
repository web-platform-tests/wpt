#!/bin/bash

WPT_MANIFEST_FILE="MANIFEST-$GITHUB_SHA.json"
./wpt manifest -p "$WPT_MANIFEST_FILE"
ls -l "$WPT_MANIFEST_FILE"
