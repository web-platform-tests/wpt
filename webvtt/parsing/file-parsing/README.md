Tests for http://w3c.github.io/webvtt/#file-parsing

Tests that expect an 'error' event (due to invalid signature) are:

    ./signature-invalid.html
    ./support/*.vtt

Other tests are generated from source files with a custom format. The source files are:

    ./support/*.test

The format is as follows:

* The first line is the title of the test.
* Subsequent lines until a blank line contain HTML metadata.
* Subsequent lines until a "===" line contains JS assertions.
* Finally the WebVTT file. Special characters can be escaped, e.g. \x00, \r.

To generate the tests:

    $ cd tools
    $ python3 build.py

There is also a python implementation of the WebVTT file parser algorithm and a script to
create a test coverage report of this implementation, under tools/.

    $ pip3 install coverage
    $ python3 spec_report.py
