SCRIPT_DIR = ../CSS2.1-test-suite
STAGING_DIR = tests
OUTPUT_DIR = dist

all:
	#
	# empty staging area
	#
	rm -rf $(STAGING_DIR)/
	mkdir $(STAGING_DIR)
	#
	# take the tests and place them in staging area, along with support files
	#
	find src -name '*.xht' | xargs -n 1 --replace cp -Lv {} $(STAGING_DIR)
	find src/* -maxdepth 0 -type d -not -name CVS | xargs -n 1 perl -e 'if (-d "$$ARGV[0]/support") { print `cp -Lrvu "$$ARGV[0]/support" $(STAGING_DIR)` }'
	#
	# nuke unused support files and CVS directories
	#
	rm -rf $(STAGING_DIR)/support/.unused
	find $(STAGING_DIR) -type d -name CVS | xargs rm -rf
	#
	# empty distribution area
	#
	rm -rf $(OUTPUT_DIR)/
	mkdir $(OUTPUT_DIR)
	mkdir $(OUTPUT_DIR)/html4
	mkdir $(OUTPUT_DIR)/xhtml1
	mkdir $(OUTPUT_DIR)/xhtml1print
	#
	# indexes and htaccess
	#
	perl $(SCRIPT_DIR)/catalog.pl $(STAGING_DIR)/*.xht
	cp data/indices.css $(OUTPUT_DIR)/indices.css
	cp data/index.xht $(OUTPUT_DIR)/index.xht
	cp data/index.html $(OUTPUT_DIR)/index.html
	cp data/htaccess $(OUTPUT_DIR)/.htaccess
	#
	# generate the tests in all supported formats, along with support files
	#
	perl $(SCRIPT_DIR)/generate.pl $(STAGING_DIR)/*.xht
	perl -pi -e 's/\.xht/\.htm/g' $(OUTPUT_DIR)/html4/by-section.htm
	cp -Lrv $(STAGING_DIR)/support $(OUTPUT_DIR)/html4/support
	cp -Lrv $(STAGING_DIR)/support $(OUTPUT_DIR)/xhtml1/support
	cp -Lrv $(STAGING_DIR)/support $(OUTPUT_DIR)/xhtml1print/support
        # PNG->JPEG conversion requires ImageMagick's 'convert' tool
	find $(OUTPUT_DIR)/xhtml1print/support -iname '*.png' | xargs -iFILENAME convert FILENAME -background white -flatten -quality 90 -interlace none FILENAME.jpg
	find $(OUTPUT_DIR)/xhtml1print/support -iname '*.png.jpg' | xargs rename s/png.jpg/jpg/
	find $(OUTPUT_DIR)/xhtml1print/support -iname '*.png' | xargs rm -rf
	find $(OUTPUT_DIR)/xhtml1print -iname '*.xht' -o -iname '*.css' | xargs perl -pi -e 's/\.png/\.jpg/g'
	#
	# empty staging area again
	#
	rm -rf $(STAGING_DIR)/
	#
	# report number of tests now included (XHTML1.1 variants only)
	#
	ls $(OUTPUT_DIR)/xhtml1/*.xht | wc -l
