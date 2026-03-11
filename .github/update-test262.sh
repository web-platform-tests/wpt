#!/bin/bash
set -ex

# This script is intended to be run from the root of the WPT repository.
# It expects a checkout of tc39/test262 in a directory named 'test262-spec'
# at the same level as the WPT repository (or as configured below).

SPEC_DIR="${1:-../test262-spec}"
WPT_DIR="."

if [ ! -d "$SPEC_DIR" ]; then
    echo "Error: Test262 spec directory not found at $SPEC_DIR"
    exit 1
fi

LATEST_SHA=$(git -C "$SPEC_DIR" rev-parse HEAD)
echo "Latest remote Test262 SHA: $LATEST_SHA"

# Base destination directory
TEST_DEST="$WPT_DIR/third_party/test262/test"
HARNESS_DEST="$WPT_DIR/third_party/test262/harness"

# Ensure directories exist
mkdir -p "$TEST_DEST"
mkdir -p "$HARNESS_DEST"

# rsync options
# -a: archive mode
# --delete: delete extraneous files from dest dirs
# --exclude: preserve WPT-specific metadata
RSYNC_OPTS=(-a --delete --exclude 'README.wpt' --exclude 'DIR_METADATA' --exclude 'OWNERS' --exclude 'WEB_FEATURES.yml')

# Sync the harness files
rsync "${RSYNC_OPTS[@]}" "$SPEC_DIR/harness/" "$HARNESS_DEST/"

# Sync all tests
rsync "${RSYNC_OPTS[@]}" "$SPEC_DIR/test/" "$TEST_DEST/"

# Write the version info
printf "[test262]\nsource = \"https://github.com/tc39/test262\"\nrev = \"${LATEST_SHA}\"\n" > "$WPT_DIR/third_party/test262/vendored.toml"
