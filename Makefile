ANOLIS = anolis
PRINCE = prince

all: web-dom-core web-dom-core.pdf xrefs.json

web-dom-core: web-dom-core.src cross-spec-refs references
	$(ANOLIS) --output-encoding=ascii --omit-optional-tags --enable=xspecxref \
	--enable=refs --enable=lof $< $@

web-dom-core.pdf: web-dom-core
	$(PRINCE) -i html $< -o $@

xrefs.json: web-dom-core.src
	$(ANOLIS) --dump-xrefs $< /tmp/spec
