This directory contains the common infrastructure for the following tests.
- referrer-policy/
- mixed-content/
- upgrade-insecure-requests/

Subdirectories:
- `subresource`:
    Serves subresources, with support for redirects, stash, etc.
    The subresource paths are managed by `subresourceMap` and
    fetched in `requestVia*()` functions in `resources/common.js`.
- `scope`:
    Serves nested contexts, such as iframe documents or workers.
    Used from `invokeFrom*()` functions in `resources/common.js`.

# spec.src.json format

## Source Contexts

In `"source_context_schema"`,
we can specify what kind of source contexts should be tested.

`sourceContextList` field is either a string or
a list of `SourceContext` objects with some extensions.
For example,

`"sourceContextList": "top%/classic-worker*/req"`

or

    "sourceContextList": [
      {"sourceContextType": "top", "policyDeliveries": ["anotherPolicy"]},
      {"sourceContextType": "classic-worker", "policyDeliveries": ["policy"]},
      {"sourceContextType": "req"}
    ]

indicates

- A request is sent from an classic worker global scope.
- The classic worker global scope gets delivered an associated policy (*)
  (e.g. referrer policy delivered by HTTP headers).
- The classic worker global scope is created from the top-level Document.
- The top-level Document gets delivered another policy (%) which is
  different from the policy of the worker global scope (*).

In general, we can specify slash (`/`)-delimited list of scopes, with
an optional letter indicating the policy delivery:

- `*` or `policy` indicates that
  the policy to be tested is delivered to that scope.
- `+` or `nonNullPolicy` indicates that
  the policy to be tested is delivered to that scope, if it is not null.
- `%` or `anotherPolicy` indicates that
  a policy different from the policy to be tested is delivered to that scope.

For the list of valid scope names, see the keys of
`sourceContextMap` in `resources/common.js`.
