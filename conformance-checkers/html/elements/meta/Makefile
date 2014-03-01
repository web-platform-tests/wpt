META_EXTENSIONS=http://help.whatwg.org/meta-extensions/
CURL=curl
CURLFLAGS=
PYTHON=python
PYTHONFLAGS=
.PHONY: .FORCE

all: meta-extensions registered-names-isvalid.html

meta-extensions: .FORCE
	$(CURL) $(CURLFLAGS) $(META_EXTENSIONS) > $@

registered-names-isvalid.html: .FORCE
	$(PYTHON) $(PYTHONFLAGS) registered-names-generate.py
