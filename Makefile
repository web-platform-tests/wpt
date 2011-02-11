ANOLIS = anolis

all: editcommands.html xrefs.json

editcommands.html: source.html data Makefile
	$(ANOLIS) --output-encoding=ascii --omit-optional-tags --enable=xspecxref \
	--enable=refs --use-strict $< $@

xrefs.json: source.html Makefile
	$(ANOLIS) --dump-xrefs $< /tmp/spec
