ANOLIS = anolis

web-dom-core: web-dom-core.src cross-spec-refs references
	$(ANOLIS) --output-encoding=ascii --omit-optional-tags --enable=xspecxref \
	--enable=refs $< $@
