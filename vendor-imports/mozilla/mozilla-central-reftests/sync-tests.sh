#!/bin/bash

cd "$(dirname "$0")"

rsync -avz --delete --filter=". ./sync-tests-filter" ~/builds/clean-mozilla-central/layout/reftests/w3c-css/submitted/ ./
sed -i -e 's/^\(\(fails\|needs-focus\|random\|skip\|asserts\|slow\|require-or\|silentfail\|pref\|test-pref\|ref-pref\|fuzzy\)[^ ]* *\?\)\+//;/^default-preferences /d;s/ \?# \?bug.*//' $(find . -name reftest.list)
sed -i -e 's/-moz-column/column/g' $(find . -name '*.xht')
hg addremove .
