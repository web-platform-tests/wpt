Description
===========

This is the test suites from a number of W3C Working Groups, including the HTML
Working Group, the Web Apps Working Group, the Device APIs Working Group, and 
the Web Apps Security Working Group.

Running the Tests
=================

The tests are designed to be run from your local computer. The test environment
requires Python 2.7+ (but not Python 3.x).

To get the tests running, you need to set up the test domains in your /etc/hosts
(or platform-equivalent) file. The following entries are required:

```
127.0.0.1	web-platform.test
127.0.0.1	www.web-platform.test
127.0.0.1	www1.web-platform.test
127.0.0.1	www2.web-platform.test
127.0.0.1	xn--n8j6ds53lwwkrqhv28a.web-platform.test
127.0.0.1	xn--lve-6lad.web-platform.test
```

Because web-platform-tests uses git submodules, you must ensure that
these are up to date. In the root of your checkout, run:

```
git submodule init
git submodule update --recursive
```

The test environment can then be started using

```
python serve.py
```

This will start HTTP servers on two ports and a websockets server on
one port. By default one web server starts on port 8000 and the other
ports are randomly-chosen free ports. Tests must be loaded from the
*first* HTTP server in the output. To change the ports, edit the
`config.json` file, for example, replacing the part that reads:

```
"http": [8000, "auto"]
```

to some port of your choice e.g.

```
"http":[1234, "auto"]
```

Publication
===========

The master branch is automatically synced to: http://w3c-test.org/web-platform-tests/master/.
Likewise the CR branch (that matches the test suites used for the Candidate
Recommendations of HTML5, Canvas 2D and Microdata) to: http://w3c-test.org/web-platform-tests/CR/.

Pull requests that have been checked are automatically mirrored to
https://w3c-test.org/web-platform-tests/submissions/

Finding Things
==============
Each top-level directory represents a W3C specification: the name matches the
shortname used after the canonical address of the said specification under
http://www.w3.org/TR/ .

For some of the specifications, the tree under the top-level directory
represents the sections of the respective documents, using the section IDs for
directory names, with a maximum of three levels deep.

So if you're looking for tests in HTML for "The History interface",
they will be under `html/browsers/history/the-history-interface/`.

Various resources that tests depend on are in `common`, `images`, and `fonts`.

In order to function properly, tests need to be run from a web server that has
[testharness.js](https://github.com/w3c/testharness.js) in `/resources/`.

If you're looking at a section of the specification and can't figure out where
the directory is for it in the tree, just run:
    node tools/scripts/id2path.js your-id

Branches
========

In the vast majority of cases the **only** branch that you should need to care
about is `master`.

There is another branch called `CR`. This is a strict subset of `master` that
is limited to features that are found in the Candidate Recommendation version
of the relevant specifications.

If you see other branches in the repository, you can generally safely ignore 
them. Please note that branches prefixed with `temp/` are temporary branches
and **can** get deleted at some point. So don't base any work off them unless
you want to see your work destroyed.

Contributing
============

Save the Web, Write Some Tests!

Absolutely everyone is welcome (and even encouraged) to contribute to test
development, so long as you fulfill the contribution requirements detailed
in the [Contributing Guidelines][contributing]. No test is too small or too
simple, especially if it corresponds to something for which you've noted an
interoperability bug in a browser.

The way to contribute is just as usual:

* fork this repository (and make sure you're still relatively in sync with it 
  if you forked a while ago);
* create a branch for your changes, `git checkout -b submission/your-name`;
* make your changes;
* push that to your repo;
* and send in a pull request based on the above.

Please make your pull requests either to `master` or to a feature branch
(but not to `CR`).

We can sometimes take a little while to go through pull requests because
we have to go through all the tests and ensure that they match the specification
correctly. But we look at all of them, and take everything that we can.

If you wish to contribute actively, you're very welcome to join the
public-html-testsuite@w3.org mailing list (low traffic) by 
[signing up to our mailing list](mailto:public-html-testsuite-request@w3.org?subject=subscribe).

[contributing]: https://github.com/w3c/web-platform-tests/blob/master/CONTRIBUTING.md
