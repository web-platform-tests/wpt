# WebVTT Tests

## Categorization

Dependencies:
* Python 3

The categorization tool uses the json report from the wpt-runner to categorize
test results. Results can be obtained by either using the web interface, or by
using `--log-wptreport results.json` with `../wptrun`.

Once you have the test json report, you can then run the categorization tool to
get a better overview of the test results:

```bash
$ python3 tools/categorize_results.py results.json
```
