---
layout: page
title: FAQ
---

* TOC
{:toc}

## What browser does best on web-platform-tests?

This is a question we've strongly avoided answering: we don't want to
publish any comparison tables as doing so has previously led to
testsuites being used for marketing, which has then led to lower
quality testsuites.

For example, we've previously had:

 * Vendors release only tests that they pass (with obvious omissions),
 * Vendors release thousands of near-identical tests (increasing their
   pass percentage and making it closer to other vendors who passed
   the existing tests), and
 * Vendors delay releasing tests until they have shipped a product
   that passes them (leading to duplication of effort and other
   vendors fail to correctly handle some edge-cases that the delayed
   testsuite covered).

## Why can't web-platform-tests be used for [caniuse.com][]?

web-platform-tests provides a large number of tests for each standard,
and most web developers would consider an implementation good enough
to rely on in sites they develop before the implementation passes
every test. This means simply waiting for a 100% pass-rate doesn't
work as a data source.

At the same time, it is useful to note when an implementation has
significant shortcomings (i.e., issues web developers are likely to
run into), and this means you need some level of analysis of the
failures to decide which are likely to be hit and which are very
obscure edge-cases. This is complicated by some specs having a fairly
small number of tests for the common case, and a disproportionate
amount of the testsuite taken up by tests for edge-case behavior.

As such, you cannot come up with a purely algorithmic solution to
determine what features you want to consider supported, which
partially supported, and which unsupported.


[caniuse.com]: https://caniuse.com
