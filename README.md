
Description
===========

This is the HTML Working Group's test suite for HTML, Canvas, and Microdata
(and version — 5.0, 5.1, LS, etc.). It is maintained by the HTML Test Suite
Task Force, which for all that it has "Task Force" in its name is really a
bunch of cool froods.

Finding Things
==============

Tests are under `html` (for the HTML specification), `canvas` (for the
Canvas specification), and `microdata` (Surprise test! Which specification
are these tests for?).

Inside the specification directories, the tree represents the sections of the
respective documents, using the section IDs for directory names, with a maximum
of three levels deep. So if you're looking for tests for "The History interface",
they will be under `html/browsers/history/the-history-interface/`.

Various resources that tests depend on are in `common`, `images`, and `fonts`.

In order to function properly, tests need to be run from a web server that has
testharness.js in `/resources/`.

Branches
========

In the vast majority of cases the **only** branch that you should need to care
about is `master`. If you are contributing, that is where you are expected to
make your changes, that's the reference against which to make pull requests.

There is another branch called `CR`. This is a strict subset of `master` that
is limited to features that are found in the Candidate Recommendation version
of the relevant specifications.

If you see other branches in the repository, you can generally safely ignore 
them. Please note that branches prefixed with `temp/` are temporary branches
and **will** get deleted at some point. So don't base any work off them unless
you want to see your work destroyed.

Contributing
============

Save the Web, Write Some Tests!

Let's get the legalese out of the way:

All contributors **must** agree to the following W3C test licences:

* http://www.w3.org/Consortium/Legal/2008/04-testsuite-license.html
* http://www.w3.org/Consortium/Legal/2008/03-bsd-license.html

We can accept tests contributed under compatible conditions, just contact
us to ask about it.

*Legalese over*.

Absolutely everyone is welcome (and even encouraged) to contribute to test 
development, so long as you fulfil the contribution requirements detailed
above. No test is too small or too simple, especially if it corresponds to
something for which you've noted an interoperability bug in a browser.

The way to contribute is just as usual: fork this repository (and make sure
you're still relatively in sync with it if you forked a while ago), make 
your changes, and send in a pull request based on those. Please make your
pull requests either to `master`, or to a `feature/*` branch (not to `CR`).

We can sometimes take a little while to go through pull requests because
we have to go through all the tests and ensure that they match the specification
correctly. But we look at all of them, and take everything that we can.

If you wish to contribute actively, you're very welcome to join the
public-html-testsuite@w3.org mailing list (low traffic) by 
[signing up to our mailing list](mailto:public-html-testsuite-request@w3.org?subject=subscribe).
