Annotation-model: Tests for the Web Annotation Data Model
=========================================================

The [Web Annotation Data Model](https://www.w3.org/TR/annotation-model)
specification presents a JSON-oriented collection of terms and structure that 
permit the sharing of annotations about other content.

The purpose of these tests is to help validate that each of the structural requirements expressed
in the Data Model specification are properly supported by implementations.

The general approach for this testing is to enable both manual and automated testing. However, since
the specification has no actual user interface requirements, there is no general automation mechanism
that can be presented for clients.  Instead, the automation mechanism is one where client
implementors could take advantage of the plumbing we provide here to push their data into the tests
and collect the results of the testing.  This assumes knowledge of the requirements of each test /
collection of tests so that the input data is relevant.  Each test or test collection contains
information sufficient for the task.

Test Cases
----------

Each test is expressed as a simple requirement in a test file.  For each section of the document, the
simple requirement is represented as a minimal JSON Schema expression in a file
with the suffix .json. It has a shape like:

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
