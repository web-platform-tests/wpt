STAGING_DIR = tests
# assumed by generate.pl
OUTPUT_DIR = dist
PERL = perl

all:
	#
	# empty staging area
	#
	rm -rf $(STAGING_DIR)
	mkdir $(STAGING_DIR)
	#
	# take the tests and place them in staging area, and rename them
	# so that match the expected naming format
	#
	find src -name '*.xhtml' | while read SRCFILE;                        \
	do                                                                    \
		DESTFILE=`echo $$SRCFILE | sed 's/\.xhtml$$/.xht/;s/^src\///'`;\
		DESTFILE=`echo $$DESTFILE | sed 's/\./-/g;s/-xht$$/.xht/'`;   \
		DESTFILE=`echo $$DESTFILE | tr A-Z a-z`;                      \
		DESTFILE=`echo -n $$DESTFILE | cut -d- -f1 | sed 's/\([1-9]\)/0\1/g'`-`echo $$DESTFILE | cut -d- -f2-`; \
		cp -Lv $$SRCFILE $(STAGING_DIR)/$$DESTFILE;                   \
	done
	#
	# empty distribution area
	#
	rm -rf $(OUTPUT_DIR)
	mkdir $(OUTPUT_DIR)
	mkdir $(OUTPUT_DIR)/html4
	mkdir $(OUTPUT_DIR)/xhtml1
	#
	# generate the tests in all supported formats
	#
	$(PERL) generate.pl $(STAGING_DIR)/*.xht
	#
	# empty staging area again
	#
	rm -rf $(STAGING_DIR)
	#
	# report number of tests now included (XHTML1.1 variants only)
	#
	ls $(OUTPUT_DIR)/xhtml1/*.xht | wc -l
