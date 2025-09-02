third_party
===========

Within this directory are various bits of vendored Python code.

This mostly exists so Mozilla don't need to deal with updating their
CI-accessible partial PyPI mirror.

Unless strictly necessary, dependencies of WPT tooling should be
registered as with any normal Python code, via requirements.txt files
and/or via installation metadata.

See https://github.com/web-platform-tests/rfcs/issues/82 for
background.


How do I use this?
------------------

Within our Python code, `third_party` should appear within the module
search path. You should not have to think about this.

To update what is vendored, see `requirements_vendor.txt`. Note that
dependencies are not automatically vendored and must be explicitly
listed. Everything must be pure Python, with no build step, and with
no extension modules.

There is some configuration in `pyproject.toml`, too.

Note there are patches in `third_party_patches`, but these should be
used sparingly.

The vendoring itself is done by the
[vendoring](https://pypi.org/project/vendoring/) tool, which once
installed can be invoked from `tools` with `vendoring sync`. This will
delete the entirety of `third_party` and re-vendor everything based on
the config.

Proposed additions should go via the
[WPT RFC process](https://github.com/web-platform-tests/rfcs).
