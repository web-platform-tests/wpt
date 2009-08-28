ANOLIS = anolis

web-dom-core: web-dom-core.src
	$(ANOLIS) --parser=lxml.html --output-encoding=ascii --omit-optional-tags --w3c-compat-xref-a-placement $< $@
