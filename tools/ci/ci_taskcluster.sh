#!/bin/bash

./wpt manifest-download

# The first script argument that is not prefixed with a dash (`-`) is assumed
# to be the name of the browser under test. This restricts the syntax available
# to consumers: value-accepting options must be specified using the equals sign
# (`=`).
for argument in $@; do
  if [ ${argument:0:1} = '-' ]; then
    continue
  fi

  browser_name=$argument

  break
done

browser_specific_args=''

if [ $browser_name = 'firefox' ]; then
  browser_specific_args='--install-browser --reftest-internal'
fi

./wpt run \
  --log-tbpl=../artifacts/log_tbpl.log \
  --log-tbpl-level=info \
  --log-wptreport=../artifacts/wpt_report.json \
  --log-mach=- \
  -y \
  --no-pause \
  --no-restart-on-unexpected \
  --install-fonts \
  --no-fail-on-unexpected \
  $browser_specific_args \
  $@

run_status=$?

if [ -f ../artifacts/wpt_report.json ]; then
  gzip ../artifacts/wpt_report.json
fi

exit $run_status
