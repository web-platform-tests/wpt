# wpt.fyi contents search index population

This utility serves to populate the wpt.fyi "contains:foo" search atom, which
uses an appengine search index across the contents of the files present in WPT.

## Usage

Ensure you've set the default GCloud credentials variable, e.g.

    export GOOGLE_APPLICATION_CREDENTIALS=~/Downloads/wptdashboard-1234512345.json

(From tools/wpt.fyi/search-index)

    go run populate_index.go -remote_api_host staging.wpt.fyi
