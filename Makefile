ANOLIS = anolis

#all: editing.html xrefs.json
all: editing.html

intermediate.html: source.html preprocess Makefile
	./preprocess

editing.html: intermediate.html data Makefile
	$(ANOLIS) --output-encoding=ascii --omit-optional-tags --enable=xspecxref \
	--w3c-compat-xref-a-placement --use-strict $< $@
	sed -i 's!<span class=secno>[^<]*</span>!!g' $@
	rm intermediate.html

# Hangs and it's useless for me anyway, kill it
#xrefs.json: intermediate.html Makefile
#	$(ANOLIS) --dump-xrefs $< /tmp/spec
