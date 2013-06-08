#!/bin/bash

cd "$(dirname "$0")"

rsync -avz --delete --filter="- README" --filter="H test-template-001.xht" --filter="P sync-tests.sh" ~/builds/clean-mozilla-central/layout/reftests/w3c-css/submitted/ ./
