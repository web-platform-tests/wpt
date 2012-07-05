ANOLIS = anolis

all: Overview.html

Overview.html: Overview.src.html data Makefile
	$(ANOLIS) --omit-optional-tags --quote-attr-values \
	--enable=xspecxref --enable=refs \
	--w3c-shortname="quirks-mode" --filter=".publish" $< $@

publish: Overview.src.html data Makefile
	$(ANOLIS) --output-encoding=ascii --omit-optional-tags --quote-attr-values \
	--w3c-compat-substitutions --enable=xspecxref --enable=refs --w3c-shortname="quirks-mode" \
	--filter=".dontpublish" --pubdate="$(PUBDATE)" --w3c-status=WD \
	$< TR.html