#!/bin/bash

WPT_MANIFEST_FILE="MANIFEST-$GITHUB_SHA.json"
./wpt manifest -p "$WPT_MANIFEST_FILE"
gzip "$WPT_MANIFEST_FILE"
python tools/ci/upload_manifest.py "$WPT_MANIFEST_FILE.gz"
