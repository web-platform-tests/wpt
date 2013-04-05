
# Updating the coverage data

In order to update the data on the tests that we have, run:

    node test-data.js

That will produce `test-data.json`.

test-data.js does not need to be run for CSS specs.

To update the mapping between test data and spec sections (this depends on
the previous data being correct), run:

    For HTML5 & Canvas:
    node tests-per-section.js

That will produce `tests-per-section.json`.

    For CSS:
    node test-per-section.js [shortname]

    where [shortname] is the shepherd API name for the spec. The full list of
    shortnames can be seen in the raw JSON data here:
    http://test.csswg.org/shepherd/api/coverage

That will produce `[shortname]-tests-per-section.json`.

    To collect all the CSS test data in one json file:
    node test-per-section.js css-all

That will produce `css-all-tests-per-section.json`.


Finally, in order to update the full mapping data (which depends on the previous
step), run:

    node analyse-specs.js

    For CSS:
    node analyse-specs.js [shortname]

    where [shortname] is the same as above

That will produce `spec-data-*.json`. Those files are used by the coverage page.

