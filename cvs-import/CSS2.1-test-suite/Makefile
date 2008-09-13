OFFICIAL =
# Call `make OFFICIAL=true` or `make official` to build for w3.org's official copy
DEVEL =
# Call `make DEVEL=true` or `make devel` to build including unreviewed tests in the SVN repository

# Please keep any changes in sync with other CSS test suite Makefiles as appropriate, thanks.

all: pull build clobber

update: pull build clean

build: stage process generate

clobber: clean
	rm -rf incoming

pull:
ifdef DEVEL
	#
	# grab incoming (unreviewed) tests from svn
	#
	svn co http://test.csswg.org/svn/CSS2.1-test-suite/incoming/ incoming
endif

stage:
	#
	# empty staging area
	#
	rm -rf tests/
	mkdir tests
	mkdir tests/support
	#
	# take raw and cooked tests and place them in staging area, along with support files
	#
	find raw-tests -name FILENAMES | xargs -n 1 perl make-proper-tests.pl
ifdef DEVEL
	find incoming -name '*.xht' | xargs -n 1 --replace cp -Lv {} tests
	find incoming/* -type d -not -name .svn -not -name support  | xargs -n 1 perl -e 'if (-d "$$ARGV[0]/support") { print `cp -Lrvu "$$ARGV[0]/support" tests` }'
endif
	find cooked-tests -name '*.xht' | xargs -n 1 --replace cp -Lv {} tests
	find cooked-tests/* -maxdepth 0 -type d -not -name CVS | xargs -n 1 perl -e 'if (-d "$$ARGV[0]/support") { print `cp -Lrvu "$$ARGV[0]/support" tests` }'
	cp -Lv src/*.xht tests
	cp -Lrvu src/support tests
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
	cp data/testinfo.data dist/testinfo.data
	cp data/LICENSE-BSD dist/LICENSE-BSD
ifdef OFFICIAL
	cp data/LICENSE-W3CD dist/LICENSE-W3CTS
	tpage --relative --define path=data/ --define official=true data/index.xht > dist/index.xht
	tpage --relative --define path=data/ --define official=true data/index.html > dist/index.html
else ifdef DEVEL
	tpage --relative --define path=data/ --define devel=true data/index.xht > dist/index.xht
	tpage --relative --define path=data/ --define devel=true data/index.html > dist/index.html
else
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
ifdef DEVEL
	@echo "Built including unreviewed tests"
endif

clean:
	#
	# empty staging area and remove generated data files
	#
	rm -rf tests/
	rm data/contributors.data
	rm data/testinfo.data

official:
	# For lazy typists
	make OFFICIAL=true
devel:
	# For lazy typists
	make DEVEL=true
