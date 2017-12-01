== MIME types ==

`resources/mime-types.json` contains MIME type tests. The tests are encoded as a JSON array. String values in the array serve as documentation. All other values are objects with the following fields:

* `input`: The string to be parsed.
* `output`: Null if parsing resulted in failure and the MIME type record serialized as string otherwise.
* `navigable`: True if the MIME type can be used for a document to be loaded in a browsing context (i.e., does not result in a download) and omitted otherwise.
* `encoding`: The encoding that can be extracted from the MIME type or null if no encoding can be extracted, and omitted otherwise.

Note: the object description implies that there tests without `navigable` or `encoding` set.

These tests are used by resources in this directory to test various aspects of MIME types.
