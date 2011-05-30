ANOLIS = anolis

#all: editcommands.html xrefs.json
all: editcommands.html

intermediate.html: source.html preprocess Makefile
	./preprocess

editcommands.html: intermediate.html data Makefile
	$(ANOLIS) --output-encoding=ascii --omit-optional-tags --enable=xspecxref \
	--w3c-compat-xref-a-placement --use-strict $< $@

# Hangs and it's useless for me anyway, kill it
#xrefs.json: intermediate.html Makefile
#	$(ANOLIS) --dump-xrefs $< /tmp/spec
