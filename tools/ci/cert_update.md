# WPT Certificates Update Required

@web-platform-tests/wpt-core-team

The wpt certificates are nearing their expiration date and must be regenerated.

There should be an open PR from github-actions with the title
[Regenerate WPT Certificates](https://github.com/web-platform-tests/wpt/pulls?q=is%3Apr+is%3Aopen+%22Regenerate+WPT+certificates%22+)
to be merged. Please ensure this is merged ASAP to avoid problems from certificates expiring.

If this PR is missing you can run `wpt regen-certs` locally to create new certificates.
