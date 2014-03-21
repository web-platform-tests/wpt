META_EXTENSIONS=http://help.whatwg.org/meta-extensions/
CURL=curl
CURLFLAGS=
PYTHON=python
PYTHONFLAGS=
.PHONY: .FORCE

all: meta-extensions names-registered-isvalid.html

meta-extensions: .FORCE
	$(CURL) $(CURLFLAGS) $(META_EXTENSIONS) > $@

names-registered-isvalid.html: .FORCE
	$(PYTHON) $(PYTHONFLAGS) names-generate.py
