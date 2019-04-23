# WebAssembly core tests

These tests live upstream at:

    https://github.com/WebAssembly/spec/tree/master/test/core.

They were copied at the following revision:

    43898ad2b3203eb5c1cfb28ddb0cb585f74b6b48

They are converted from the `*.wast` files using the [reference interpreter][1].
Run the `tools/build.py` script to regenererate the tests.

[1]: https://github.com/WebAssembly/spec/tree/master/interpreter

## Directory structure

- wast: The WebAssembly test files copied from the WebAssembly/spec repo
- tools: Contains the script for converting the wast files to JavaScript tests
- js: The generated JavaScript tests
- spec: The WebAssembly spec repo, cloned by `build.py` to build the reference
  interpreter
