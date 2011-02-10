ANOLIS = anolis

all: execcommand.html xrefs.json

execcommand.html: source.html data Makefile
	$(ANOLIS) --output-encoding=ascii --omit-optional-tags --enable=xspecxref \
	--enable=refs --use-strict $< $@

xrefs.json: source.html Makefile
	$(ANOLIS) --dump-xrefs $< /tmp/spec
