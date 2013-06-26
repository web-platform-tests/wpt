# Updating the coverage data #

Make _really sure_ you have [node][1] and [phantomjs][2] properly installed.

In order to update the data on the tests that we have, run:

    node test-data.js

That will produce `test-data.json`.

To update the mapping between test data and spec sections (this depends on
the previous data being correct), run:

    node tests-per-section.js

That will produce `tests-per-section.json`.

Finally, in order to update the full mapping data (which depends on the previous
step), run:

    node analyse-specs.js

That will produce `spec-data-*.json`. Those files are used by the coverage page.

[1]: http://nodejs.org
[2]: http://phantomjs.org/
