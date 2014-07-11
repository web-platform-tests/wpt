Getting Started
===============

Installing wptrunner
--------------------

The easiest way to install wptrunner is into a virtualenv, using pip::

  virtualenv wptrunner
  cd wptrunner
  source bin/activate
  pip install wptrunner

If you intend to work on the code, the ``-e`` option to pip should be
used in combination with a source checkout i.e. inside a virtual
environment created as above::

  git clone https://github.com/w3c/wptrunner.git
  cd wptrunner
  pip install -e ./

In addition to the dependencies installed by pip, wptrunner requires
a copy of the web-platform-tests. This can be located anywhere on
the filesystem, but the easiest option is to put it in a sibling
directory of the wptrunner checkout called `tests`::

  git clone https://github.com/w3c/web-platform-tests.git tests

It is also necessary to generate the ``MANIFEST.json`` file for the
web-platform-tests. It is recommended to put this file in a separate
directory called ``metadata``::

  mkdir metadata
  cd web-platform-tests
  python tools/scripts/manifest.py ../metadata/MANIFEST.json

This file needs to be regenerated every time that the
web-platform-tests checkout is updated. To aid with the update process
there is a tool called ``wptupdate``, which is described in
:ref:`wptupdate-label`.

Running the Tests
-----------------

A test run is started using the ``wptrunner`` command. This takes two
mandatory arguments; the path to the metadata files (i.e. the
directory containing ``MANIFEST.json``, and the path to the test
files. Therefore, if the checkout follows the structure above, the
most basic invocation of ``wptrunner`` is::

  wptrunner metadata tests

In practice, however, more arguments are typically required. The first
common argument is ``--product`` which specifies the product to test (if
nothing is specified here the default is ``firefox`` which tests
Firefox desktop. ``wptrunner --help`` can be used to see a list of
supported products.

Depending on the product, further arguments may be required. For
example when testing desktop browsers ``--binary`` is commonly needed
to specify the path to the browser executable. So a complete command
line for running tests on firefox desktop might be::

  wptrunner --product=firefox --binary=/usr/bin/firefox metadata tests

It is also possible to run multiple browser instances in parallel to
speed up the testing process. This is achieved through the
``--processes=N`` argument e.g. ``--processes=6`` would attempt to run
6 browser instances in parallel. Note that behaviour in this mode is
necessarily less deterministic than with ``--processes=1`` (the
default) so there may be more noise in the test results.

Further help can be obtained from::

  wptrunner --help

Output
------

wptrunner uses the :py:mod:`mozlog.structured` package for output. This
structures events such as test results or log messages as JSON objects
that can then be fed to other tools for interpretation. More details
about the message format are given in the
:py:mod:`mozlog.structured` documentation.

By default the raw JSON messages are dumped to stdout. This is
convenient for piping into other tools, but not ideal for humans
reading the output. :py:mod:`mozlog` comes with several other
formatters, which are accessible through command line options. The
general format of these options is ``--log-name=dest``, where ``name``
is the name of the format and ``dest`` is a path to a destination
file, or ``-`` for stdout. The raw JSON data is written by the ``raw``
formatter so, the default setup corresponds to ``--log-raw=-``.

A reasonable output format for humans is provided as ``mach``. So in
order to output the full raw log to a file and a human-readable
summary to stdout, one might pass the options::

  --log-raw=output.log --log-mach=-

