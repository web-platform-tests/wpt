# WebDriver BiDi only tests

## How to run tests

### On Linux

From the WPT root folder run:

```
./wpt run \
--log-raw wpt.log \
--webdriver-binary=path/to/runBiDiServer.sh \
--webdriver-arg="--browser=path/to/browser/exec" \
--binary path/to/browser/exec \
chrome \
webdriver/tests/bidi/bidi_only/connect.py
```