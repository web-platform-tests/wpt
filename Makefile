ANOLIS = anolis

all: Overview.html xrefs.json

Overview.html: Overview.src.html data Makefile
	$(ANOLIS) --output-encoding=ascii --omit-optional-tags --quote-attr-values \
	--w3c-compat --enable=xspecxref --enable=refs $< $@

xrefs.json: Overview.src.html Makefile
	$(ANOLIS) --dump-xrefs $< /tmp/spec

publish: Overview.src.html data Makefile
	$(ANOLIS) --output-encoding=ascii --omit-optional-tags --quote-attr-values \
	--w3c-compat --enable=xspecxref --enable=refs \
	--pubdate="$(PUBDATE)" --w3c-status=WD \
	$< Overview.html
