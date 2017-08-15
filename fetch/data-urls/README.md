== Forgiving-base64 decode ==

`resources/base64.json` contains [forgiving-base64 decode](https://infra.spec.whatwg.org/#forgiving-base64-decode) tests. The tests are encoded as a list. Each item in the list is a list of two items. The first item describes the input, the second item describes the output as a list of integers representing bytes or null if the input cannot be decoded.

These tests are used for `data:` URLs in this directory (see `base64.any.js`) and `window.atob()` in `../../html/webappapis/atob/base64.html`.
