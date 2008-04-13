OFFICIAL =
# Set to true to build for w3.org's official copy

all: stage process generate clean

stage:
	#
	# empty staging area
	#
	rm -rf tests/
	mkdir tests
	#
	# take raw and cooked tests and place them in staging area, along with support files
	#
	find raw-tests -name FILENAMES | xargs -n 1 perl make-proper-tests.pl
	find cooked-tests -name '*.xht' | xargs -n 1 --replace cp -Lv {} tests
	find cooked-tests/* -maxdepth 0 -type d -not -name CVS | xargs -n 1 perl -e 'if (-d "$$ARGV[0]/support") { print `cp -Lrvu "$$ARGV[0]/support" tests` }'
	#
	# nuke unused support files and CVS directories
	#
	rm -rf tests/support/.unused
	find tests -type d -name CVS | xargs rm -rf

process:
	#
	# preprocess tests as necessary
	#
	egrep -l '&\w+;' tests/*.xht | xargs perl -pi -e 'use HTML::Entities::Numbered;' -e '$$_ = name2decimal_xml($$_)'
	#
	# now catalog them
	#
	perl catalog.pl tests/*.xht

generate:
	#
	# empty distribution area
	#
	rm -rf dist/
	mkdir dist
	mkdir dist/html4
	mkdir dist/xhtml1
	mkdir dist/xhtml1print
	#
	# documentation and htaccess
	#
	cp data/indices.css dist/indices.css
	cp data/htaccess dist/.htaccess
ifdef OFFICIAL
	cp data/LICENSE-W3CD dist/LICENSE-W3CD
	tpage --relative --define path=data/ --define official=true data/index.xht > dist/index.xht
	tpage --relative --define path=data/ --define official=true data/index.html > dist/index.html
else
	cp data/LICENSE-BSD dist/LICENSE-BSD
	tpage --relative --define path=data/ data/index.xht > dist/index.xht
	tpage --relative --define path=data/ data/index.html > dist/index.html
endif
	#
	# generate the tests in all supported formats, along with support files
	#
	perl generate.pl tests/*.xht
	perl -pi -e 's/\.xht/\.htm/g' dist/html4/by-section.htm
	cp -Lrv tests/support dist/html4/support
	cp -Lrv tests/support dist/xhtml1/support
	cp -Lrv tests/support dist/xhtml1print/support
        # PNG->JPEG conversion requires ImageMagick's 'convert' tool
	find dist/xhtml1print/support -iname '*.png' | xargs -iFILENAME convert FILENAME -background white -flatten -quality 90 -interlace none FILENAME.jpg
	find dist/xhtml1print/support -iname '*.png.jpg' | xargs rename s/png.jpg/jpg/
	find dist/xhtml1print/support -iname '*.png' | xargs rm -rf
	find dist/xhtml1print -iname '*.xht' -o -iname '*.css' | xargs perl -pi -e 's/\.png/\.jpg/g'
	#
	# report number of tests now included (XHTML1.1 variants only)
	#
	ls dist/xhtml1/*.xht | wc -l
ifdef OFFICIAL
	@echo "Built as official copy"
endif


clean:
	#
	# empty staging area again
	#
	rm -rf tests/

official:
	# For lazy typists
	make OFFICIAL=true
