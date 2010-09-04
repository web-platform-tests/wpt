ANOLIS = anolis
PRINCE = prince

all: Overview.html web-dom-core.pdf xrefs.json

web-dom-core: Overview.src.html cross-spec-refs references
	$(ANOLIS) --output-encoding=ascii --omit-optional-tags --enable=xspecxref \
	--enable=refs --enable=lof $< $@

web-dom-core.pdf: Overview.html
	$(PRINCE) -i html $< -o $@

xrefs.json: Overview.src.html
	$(ANOLIS) --dump-xrefs $< /tmp/spec
