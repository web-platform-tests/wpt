Annotation-model: Tests for the Web Annotation Data Model
=========================================================

The [Web Annotation Data Model](https://www.w3.org/TR/annotation-model)
specification presents a JSON-oriented collection of terms and structure
that permit the sharing of annotations about other content.

The purpose of these tests is to help validate that each of the structural
requirements expressed in the Data Model specification are properly
supported by implementations.

The general approach for this testing is to enable both manual and
automated testing. However, since the specification has no actual user
interface requirements, there is no general automation mechanism that can
be presented for clients.  Instead, the automation mechanism is one where
client implementors could take advantage of the plumbing we provide here
to push their data into the tests and collect the results of the testing.
This assumes knowledge of the requirements of each test / collection of
tests so that the input data is relevant.  Each test or test collection
contains information sufficient for the task.

Test Cases
----------

Each test is expressed as a simple requirement in a test file.  For each
section of the document, the simple requirement is represented as a
structure that describes the nature of the test, and then includes or
references minimal JSON Schema that test the assertions.  Each test case has
a suffix of ".test" and a shape like:

<pre>
{
  "@context": "https://www.w3.org/ns/JSONtest-v1.jsonld",
  "name": "Verify annotation conforms to the model",
  "description": "Supply an example annotation that conforms to the basic structure.",
  "ref": "https://www.w3.org/TR/annotation-model/#model",
  "assertions": [
    "common/has_context.json",
    "common/has_id.json",
    {
      "$schema": "http://json-schema.org/draft-04/schema#",
      "title": "Verify annotation has target",
      "type": "object",
      "properties": {
        "target": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "array",
              "anyOf": [
                {
                  "type": "string"
                }
              ]
            }
          ],
          "not": {"type": "object"}
        }
      },
      "required": ["target"]
    }
  ]
}
</pre>

External references are used when the "assertion" is a common one that needs to be
checked on many different test cases (e.g., that there is an @context in the supplied
annotation).  An external file has a .json suffix and a structure like:

<pre>
{
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Verify annotation has @context",
  "type": "object",
  "properties": {
    "@context": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "array",
          "anyOf": [
            {
              "type": "string"
            }
          ]
        }
      ],
      "not": {"type": "object"}
    }
  },
  "required": ["@context"]
}
</pre>


Manual Tests
------------




Automating Test Execution
-------------------------


Command Line Tools
------------------
