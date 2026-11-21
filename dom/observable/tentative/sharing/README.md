# Observable sharing proposal tests

These tests describe [WICG/observable#221](https://github.com/WICG/observable/issues/221)
and its [draft specification](https://github.com/WICG/observable/pull/222).
They are a draft for discussion, not evidence of consensus or browser support.

The existing tests in the parent directory target the current Observable API.
This directory separately exercises the proposal's per-subscription Observable,
explicit SharedObservable, sharing configuration, replay, and lifecycle ordering.
The tests use platform globals directly and do not install a polyfill.

Each `.any.js` file runs in Window and DedicatedWorker contexts. The
`introspection.any.js` file covers the proposed inspection APIs, whose inclusion
remains an open question. The tests do not settle the prototype hierarchy.
Optional `scan` and `takeLast` operators are outside this test set.

The draft specification declares `maxReplayValues` as `any` and applies
`ToNumber` followed by custom validation. These tests therefore expect
`RangeError` for fractional, nonfinite, negative, or unsafe capacities; they do
not apply an integer Web IDL conversion. Negative zero normalizes to zero, and
the maximum safe integer is accepted without allocating a buffer of that size.

A keep-alive wrapper retains its upstream observation when its last consumer
cancels. The upstream source still has that observer, so its own last-observer
policy does not run. This does not prevent the source from completing or
erroring, or let the wrapper reopen a permanently closed source.

Before this can be ready to merge, the proposal and normative IDL need agreement,
the conflicting existing tests need reconciliation, and native implementations
need validation. IDL bindings, cross-realm conversion/branding, and document
liveness need additional coverage once their normative definitions settle.
