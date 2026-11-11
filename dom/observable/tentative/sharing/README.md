# Observable sharing proposal tests

These tests describe [WICG/observable#221](https://github.com/WICG/observable/issues/221).
They are a draft for discussion, not evidence of consensus or browser support.

The existing tests in the parent directory target the current Observable API.
This directory separately exercises the proposal's per-subscription Observable,
explicit SharedObservable, sharing configuration, replay, and lifecycle ordering.
The tests use platform globals directly and do not install a polyfill.

Each `.any.js` file runs in Window and DedicatedWorker contexts. The
`introspection.any.js` file covers the proposed inspection APIs, whose inclusion
remains an open question. The tests do not settle the prototype hierarchy.
Optional `scan` and `takeLast` operators are outside this test set.

Before this can be ready to merge, the proposal and normative IDL need agreement,
the conflicting existing tests need reconciliation, and native implementations
need validation. IDL bindings, cross-realm conversion/branding, and document
liveness need additional coverage once their normative definitions settle.
