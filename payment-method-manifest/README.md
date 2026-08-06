# Payment Method Manifest Web Platform Tests

This directory contains Web Platform Tests (WPTs) for the [W3C Payment Method Manifest specification](https://w3c.github.io/payment-method-manifest/).

## Test Coverage
- **Link Header Handling (`link-header-*.window.js`)**: Initial HEAD request to PMI, RFC 8288 Link header extraction, parameters, and rel attribute matching.
- **Redirect Restrictions (`redirects-*.window.js`)**: Same-site cross-origin vs cross-site redirect rules, max 3 redirect hops (URL list size 4), and manifest GET redirect errors.
- **Parsing & Schema Rules (`parsing-*.window.js`)**: PMM JSON parsing, `default_applications` scheme restrictions, and `supported_origins` trailing slash / path / auth exclusions.
- **Fetch Parameters & HTTP Status (`fetch-options-*.window.js`, `http-status-*.window.js`)**: `HEAD`/`GET` methods, CORS mode, credentials `omit`, referrer headers, and HTTP status codes.
