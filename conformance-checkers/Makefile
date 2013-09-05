HTML2MARKDOWN=html2text
PERL=perl
PERLFLAGS=
FMT=fmt
FMTFLAGS=-80
EXPAND=expand
EXPANDFLAGS=
GIT=git
GITFLAGS=

all: README.md

README.md: index.html
	$(HTML2MARKDOWN) $(HTML2MARKDOWNFLAGS) $< \
	    | $(PERL) $(PERLFLAGS) -pe 'undef $$/; s/(\s+\n)+/\n\n/g' \
	    | $(PERL) $(PERLFLAGS) -pe 'undef $$/; s/(\n\n\n)+/\n/g' \
	    | $(FMT) $(FMTFLAGS) \
	    | $(PERL) $(PERLFLAGS) -pe 'undef $$/; s/ +(\[[0-9]+\]:)\n +/\n   $$1 /g' \
	    | $(EXPAND) $(EXPANDFLAGS) > $@

push:
	cd .. \
	&& $(GIT) subtree push -P conformance-checkers/ -b conformance-checkers origin conformance-checkers \
	&& cd -

its-push:
	cd ..\
	&& $(GIT) subtree push -P conformance-checkers/html-its/ -b its-inputdata origin its-inputdata
