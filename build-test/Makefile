# CSS Test Suite Common Makefile
# ==============================
#
# Authors: Elika J Etemad
#          Tom Harms
#          Ian Hickson
# 
# ==============================
# QUICK START
# ==============================
# run make VERSION={VERSION_NAME}
# e.g. 
# 	make VERSION=css2_1
# 	make VERSION=css3-color
# 
# ==============================
# BASIC PROCESS
# ==============================
# 1.  Test source files are copied from src directories (and possibly others 
# 	depending on make options and version. e.g. calling devel copies
# 	some unreviewed tests from the css svn repository to be included)
# 
# 2.  The relevant CSS spec is accessed via HTTP (or a saved copy of the 
# 	spec data is used if DATASOURCE=file is passed to the makefile)
# 
# 3.  Tests are converted to xhtml, html and xhtml1print formats using
# 	modules in lib/common/format
# 
# 4.  the specManager (lib/common/specManager.pm and 
# 	lib/{VERSION_NAME}/{VERSION_NAME}_specManager.pm) creates appropriate 
# 	HTML output files to index the tests and organize according
# 	to chapter wherer appropriate.  
# 
# 5.  Output is saved in dist/{VERSION_NAME}


# version should be css2_1 or css3_MODULE (e.g. css3_color or css3_page) 
VERSION =
DEVVERSION = $(VERSION)
SPECROOT = http://www.w3.org/TR/$(VERSION)
TESTEXTENSION = xht
DATASOURCE = web
COMMONVERSION = css3_common
ASSERTIONS = true
FLATTEN = 
# special case - css2_1 version name does not match version used
# on csswg.org for submitted subdir
ifeq ($(VERSION),css2_1)
COMMONVERSION = $(VERSION)
DEVVERSION = css2.1
SPECROOT = http://www.w3.org/TR/CSS21
TESTEXTENSION = xht
endif

ifeq ($(VERSION),css3-color)
TESTEXTENSION = xhtml
endif

ifeq ($(VERSION),css3-namespace)
TESTEXTENSION = xml
endif 

DEVELPATH = http://test.csswg.org/svn/submitted/$(DEVVERSION)
# Call `make OFFICIAL=true` or `make official` to build for w3.org's official copy
OFFICIAL =
SETTRUE=foo
ifdef OFFICIAL
SETTRUE=devel
else
ifdef DEVEL
SETTRUE=devel
endif
endif
# Call `make DEVEL=true` or `make devel` to build including unreviewed tests in the SVN repository
DEVEL =





# Please keep any changes in sync with other CSS test suite Makefiles as appropriate, thanks.

all: pull build clobber

ifndef VERSION
	#Missing version.  use make VERSION=version
	#  e.g. make VERSION=css2_1
	#  options include css2_1,css3-color, css3-namespace, etc.
	false
endif

update: pull build clean

build: stage process generate


clobber: clean
	rm -rf devel/$(VERSION)
pull:

ifdef DEVEL
	#
	# grab devel (unreviewed) tests from svn
	#
	rm -rf devel/$(VERSION)
	mkdir devel/$(VERSION)
	svn co $(DEVELPATH) devel/$(VERSION)
endif


stage:
	#
	# empty staging area
	#
	rm -rf tests/$(VERSION)

ifdef FLATTEN
	mkdir tests/$(VERSION)
	mkdir tests/$(VERSION)/support
	find $(VERSION)/src -name '*.$(TESTEXTENSION)' | xargs -n 1 --replace cp -L {} tests/$(VERSION)
else 
	cp -R $(VERSION)/src tests/$(VERSION)
endif

	cp -R $(COMMONVERSION)/src/support tests/$(VERSION)/support

ifeq ($(VERSION),css2_1)
	find css1 -name FILENAMES | xargs -n 1 perl tools/$(VERSION)/make-proper-tests.pl
endif

ifdef DEVEL
	find devel/$(VERSION) -name '*.$(TESTEXTENSION)' | xargs -n 1 --replace cp -L {} tests/$(VERSION)
	find devel/$(VERSION)/* -type d -not -name .svn -not -name support  | xargs -n 1 perl -e 'if (-d "$$ARGV[0]/support") { print `cp -Lru "$$ARGV[0]/support" tests/$(VERSION)` }'
endif


	#
	# nuke unused support files and CVS directories
	#
	rm -rf tests/$(VERSION)/support/.unused
	find tests/$(VERSION) -type d -name CVS | xargs rm -rf

process:
	#
	# preprocess tests as necessary
	#

	egrep -l '&\w+;' tests/$(VERSION)/*.$(TESTEXTENSION) | xargs perl -pi -e 'use HTML::Entities::Numbered;' -e '$$_ = name2decimal_xml($$_)'
	#
	# now catalog them
	#
	find tests/$(VERSION) -name '*.$(TESTEXTENSION)' | xargs perl tools/common/catalog.pl $(VERSION) $(DATASOURCE) $(ASSERTIONS)

generate:
	#
	# empty distribution area
	#
	rm -rf dist/$(VERSION)
	mkdir dist/$(VERSION)
	mkdir dist/$(VERSION)/html4
	mkdir dist/$(VERSION)/xhtml1
	mkdir dist/$(VERSION)/xhtml1print
	#
	# documentation and htaccess
	#
	cp common/data/indices.css dist/$(VERSION)/indices.css
	cp common/data/htaccess dist/$(VERSION)/.htaccess
	cp common/data/LICENSE-BSD dist/$(VERSION)/LICENSE-BSD
	cp $(VERSION)/data/testinfo.data dist/$(VERSION)/testinfo.data


	tpage --relative --define path=$(VERSION)/data/ --define $(SETTRUE)=true --define specVersionString=$(VERSION) --define specRoot=$(SPECROOT) --include_path=templates/$(VERSION) --include_path=templates/$(COMMONVERSION)/ index.xht.tmpl > dist/$(VERSION)/index.xht
	tpage --relative --define path=$(VERSION)/data/ --define $(SETTRUE)=true --define specVersionString=$(VERSION) --define specRoot=$(SPECROOT) --include_path=templates/$(VERSION) --include_path=templates/$(COMMONVERSION)/ index.html.tmpl > dist/$(VERSION)/index.html



	#
	# generate the tests in all supported formats, along with support files
	#

	find tests/$(VERSION) -name '*.$(TESTEXTENSION)' | xargs perl tools/common/generate.pl $(VERSION) $(TESTEXTENSION)
	find tests/$(VERSION) -name 'chapter*.htm' | xargs perl tools/common/generate.pl $(VERSION) $(TESTEXTENSION)


	cp -Lr tests/$(VERSION)/support dist/$(VERSION)/html4/support
	cp -Lr tests/$(VERSION)/support dist/$(VERSION)/xhtml1/support
	cp -Lr tests/$(VERSION)/support dist/$(VERSION)/xhtml1print/support
	cp -Lr tests/$(VERSION)/sectionIndex.htm dist/$(VERSION)/html4/index.htm 
	cp -Lr tests/$(VERSION)/sectionIndex.xht dist/$(VERSION)/xhtml1/index.xht
	cp -Lr tests/$(VERSION)/sectionIndex.xht dist/$(VERSION)/xhtml1print/index.xht


        # PNG->JPEG conversion requires ImageMagick's 'convert' tool
	find dist/$(VERSION)/xhtml1print/support -iname '*.png' | xargs -iFILENAME convert FILENAME -background white -flatten -quality 90 -interlace none FILENAME.jpg
	find dist/$(VERSION)/xhtml1print/support -iname '*.png.jpg' | xargs rename s/png.jpg/jpg/
	find dist/$(VERSION)/xhtml1print/support -iname '*.png' | xargs rm -rf
	find dist/$(VERSION)/xhtml1print -iname '*.$(TESTEXTENSION)' -o -iname '*.css' | xargs perl -pi -e 's/\.png/\.jpg/g'
	#
	# report number of tests now included (XHTML1.1 variants only)
	#
	ls dist/$(VERSION)/xhtml1/*.xht | wc -l
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
	rm -rf tests/$(VERSION)
	rm $(VERSION)/data/contributors.data
	#rm $(VERSION)/data/testinfo.data

official:
	# For lazy typists
	make OFFICIAL=true
devel:
	# For lazy typists
	make DEVEL=true