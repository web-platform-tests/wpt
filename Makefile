ANOLIS = anolis

web-dom-core: web-dom-core.src
	$(ANOLIS) --output-encoding=ascii --omit-optional-tags --enable=xspecxref $< $@
