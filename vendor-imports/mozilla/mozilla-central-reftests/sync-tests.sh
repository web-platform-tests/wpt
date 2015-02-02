#!/bin/bash

cd "$(dirname "$0")"

rsync -avz --delete --filter=". ./sync-tests-filter" ~/builds/clean-mozilla-central/layout/reftests/w3c-css/submitted/ ./
sed -i -e 's/^\(\(fails\|needs-focus\|random\|skip\|asserts\|slow\|require-or\|silentfail\|pref\|test-pref\|ref-pref\|fuzzy\)[^ ]* *\?\)\+//;/^default-preferences /d;s/ \?# \?[bB]ug.*//' $(find . -name reftest.list)
sed -i -e 's/-moz-column/column/g;s/-moz-crisp-edges/pixelated/g' $(find . -regex ".*\.\(xht\|xhtml\|html\|css\)")
hg addremove .
