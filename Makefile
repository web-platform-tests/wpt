ANOLIS = anolis

all: editcommands.html xrefs.json

intermediate.html: source.html Makefile
	./preprocess

editcommands.html: intermediate.html data Makefile
	$(ANOLIS) --output-encoding=ascii --omit-optional-tags --enable=xspecxref \
	--enable=refs --use-strict $< $@

xrefs.json: intermediate.html Makefile
	$(ANOLIS) --dump-xrefs $< /tmp/spec
