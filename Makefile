ANOLIS = anolis

all: Overview.html data/xrefs/dom/domcore.json

Overview.html: Overview.src.html data Makefile
	$(ANOLIS) --output-encoding=ascii --omit-optional-tags --quote-attr-values \
	--w3c-compat --enable=xspecxref --enable=refs \
	--filter=".publish" $< $@

data/xrefs/dom/domcore.json: Overview.src.html Makefile
	$(ANOLIS) --dump-xrefs=$@ $< /tmp/spec

publish: Overview.src.html data Makefile
	$(ANOLIS) --output-encoding=ascii --omit-optional-tags --quote-attr-values \
	--w3c-compat --enable=xspecxref --enable=refs \
	--filter=".dontpublish" --pubdate="$(PUBDATE)" --w3c-status=WD \
	$< Overview.html
