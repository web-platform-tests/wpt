ANOLIS = anolis

all: Overview.html xrefs.json

Overview.html: Overview.src.html cross-spec-refs references Makefile
	$(ANOLIS) --output-encoding=ascii --omit-optional-tags --w3c-compat \
	--enable=xspecxref --enable=refs $< $@

xrefs.json: Overview.src.html Makefile
	$(ANOLIS) --dump-xrefs $< /tmp/spec
