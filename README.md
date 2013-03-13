Description
===========

This is the HTML Working Group's test suite for HTML, Canvas, and Microdata
(any version — 5.0, 5.1, LS, etc.). It is maintained by the HTML Test Suite
Task Force, which for all that it has "Task Force" in its name is really a
bunch of cool froods.

Publication
===========

The master branch is synced every ten minutes to: http://w3c-test.org/web-platform-tests/master/.
Likewise the CR branch to: http://w3c-test.org/web-platform-tests/CR/.

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

Let's get the legalese out of the way:

You may wish to read the details below, but the **simplest thing to know** is this:

* if the company you work for is already a member of the HTML WG, then you don't need 
  to worry; you're already covered
* if not, you will need to [fill out this form](http://www.w3.org/2002/09/wbs/1/testgrants2-200409/)

### Grant of License for Contributed Test Cases Published Outside a W3C Recommendation

By contributing to this repository, you, the Contributor, hereby grant
to the W3C, a perpetual, non-exclusive, royalty-free, world-wide right
and license under any Contributor copyrights in this contribution to
copy, publish, use, and modify the contribution and to distribute the
contribution under a BSD License (see [1] below) or one with more
restrictive terms, as well as a right and license of the same scope to
any derivative works prepared by the W3C and based on, or
incorporating all or part of the contribution. The Contributor further
agrees that any derivative works of this contribution prepared by the
W3C shall be solely owned by the W3C.

The Contributor states, to the best of her/his knowledge, that she/he,
or the company she/he represents, has all rights necessary to
contribute the Materials.

W3C will retain attribution of initial authorship to the
Contributor. The W3C makes no a-priori commitment to support or
distribute contributions.

Note: We can accept tests contributed under compatible conditions,
just contact us to ask about it.

[1] http://www.w3.org/Consortium/Legal/2008/03-bsd-license.html

### Disclaimer

THE CONTRIBUTION IS PROVIDED AS IS, AND CONTRIBUTORS MAKE NO
REPRESENTATIONS OR WARRANTIES, EXPRESS OR IMPLIED, INCLUDING, BUT NOT
LIMITED TO, WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
PURPOSE, NON-INFRINGEMENT, OR TITLE; THAT THE CONTENTS OF THE DOCUMENT
ARE SUITABLE FOR ANY PURPOSE. CONTRIBUTORS MAKE NO REPRESENTATIONS,
EXPRESS OR IMPLIED, THAT THE CONTRIBUTION OR THE USE THEREOF INDICATES
CONFORMANCE TO A SPECIFICATION; CONTRIBUTIONS ARE PROVIDED ONLY TO
HELP REACHING INTEROPERABILITY.

*Legalese over*.

Absolutely everyone is welcome (and even encouraged) to contribute to test 
development, so long as you fulfil the contribution requirements detailed
above. No test is too small or too simple, especially if it corresponds to
something for which you've noted an interoperability bug in a browser.

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
