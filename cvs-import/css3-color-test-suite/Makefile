STAGING_DIR = tests
# assumed by generate.pl
OUTPUT_DIR = dist
PERL = perl

all:
	#
	# empty staging area
	#
	rm -rf $(STAGING_DIR)/
	mkdir $(STAGING_DIR)
	#
	# take the tests and place them in staging area
	#
	find src -name '*.xhtml' | sed 's/\.xhtml$$/.xht/;s/^src\///' |  xargs -n 1 --replace cp -Lv src/{}ml $(STAGING_DIR)/{}
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
	rm -rf $(STAGING_DIR)/
	#
	# report number of tests now included (XHTML1.1 variants only)
	#
	ls $(OUTPUT_DIR)/xhtml1/*.xht | wc -l
