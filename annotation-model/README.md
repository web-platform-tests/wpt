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

Manual Tests
------------




Automating Test Execution
-------------------------


Command Line Tools
------------------
