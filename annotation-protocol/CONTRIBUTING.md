Annotation-Protcol: Guidelines for Contributing Tests
=====================================================

This document describes the method people should use for authoring tests and
integrating them into the repository.  Anyone is welcome to submit new tests to
this collection.  If you do, please create the tests following the guidelines
below.  Then submit them as a pull request so they can be evaluated

Structure
---------

Tests are organized by client or server, and then by major section of the Annotation 
Protocol specification.  The folders associated with these are:

* client
  * creation
  * slug
  * update
  * delete
* server
  * retrieval
  * discovery
  * creation
  * update
  * delete

Within these folders, special files ending with the suffix ".test" provide the source
for the test as a set of declarative assertions about the required shape of the conforming
JSON object.  These files are transformed using a test generation tool into ".html" files
that are then accessed by the Web Platform Test framework.

There are a few other folders that provide supporting materials for the tests:

* common - assertionObjects, conditionObjects, and other supporting materials
* definitions - JSON Schema definitions that can be referenced
* scripts - JavaScript that are included by tests
* tools - supporting scripts and files

Client Test Cases
-----------------

@@@TODO@@@ describe the structure of client test cases.

Server Test Cases
-----------------

@@@TODO@@@ describe the structure of server test cases.


Command Line Tools
------------------

### Building the Test Files ###

### Testing the Tests ###

### Driving Tests with Input Files ###

