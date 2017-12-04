WebRTC Tools
============

This directory contains a simple Node.js project to aid the development of
WebRTC tests.

## Lint

```bash
npm run lint
```

Does basic linting of the JavaScript code. Mainly for catching usage of
undefined variables.

## Coverage

Several npm [scripts](./scripts) are available for coverage reporting as follow:

  - `coverage-overview` - Get the overall coverage break down by status.
  - `coverage-by-section` - Show coverage stats break down by section.
  - `show-todo` - Extract all TODO items and format as YAML at console.
