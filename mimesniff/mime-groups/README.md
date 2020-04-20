== MIME type groups ==

`mime-groups.json` contains MIME type group-membership tests. The tests are encoded as a JSON array. String values in the array serve as documentation. All other values are objects with the following fields:

* `input`: The MIME type to test.
* `groups`: An array of zero or more groups to which the MIME type belongs.

In order to pass the tests an implementation must treat each MIME type as belonging to the exact set of groups listed, with no additions or omissions.

Note: As MIME type groups are used only while determining the computed MIME type of a resource and are not exposed in any API, no browser-based test harness is available.
