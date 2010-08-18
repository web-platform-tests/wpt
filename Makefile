ANOLIS = anolis
PRINCE = prince

web-dom-core: web-dom-core.src cross-spec-refs references
	$(ANOLIS) --output-encoding=ascii --omit-optional-tags --enable=xspecxref \
	--enable=refs --enable=lof $< $@

web-dom-core.pdf: web-dom-core
	$(PRINCE) -i html $< -o $@
