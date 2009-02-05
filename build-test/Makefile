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
# run make SUITE={SUITE_NAME}
# e.g. 
# 	make SUITE=css2_1
# 	make SUITE=css3-color
#
# make or make all will pull from svn as necessary, build, and clean up
#
# Intermedia make targets include
#    update - pull and build without destroying svn cache
#    build - build without svn update
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
# 	lib/{SUITE_NAME}/{SUITE_NAME}_specManager.pm) creates appropriate
# 	HTML output files to index the tests and organize according
# 	to chapter wherer appropriate.  
# 
# 5.  Output is saved in dist/{SUITE_NAME}

###############################################################################
# Params

# Suite to build (css2_1 or css3-foo)
SUITE =
# Source of TOC data (web or file)
DATASOURCE = web
# Whether to print assertions in the TOC
ASSERTIONS = true
# Whether to flatten the src tree when building dist
FLATTEN =
# Whether to build including unreviewed tests in the SVN repository
DEVEL =
# Whether to build licensing, documentation for w3.org's official copy
OFFICIAL =

###############################################################################
# Defaults

DEVDIR = $(SUITE)
SPECROOT = http://www.w3.org/TR/$(SUITE)
EXT = xht

# special case - css2_1 version name does not match version used
# on csswg.org for submitted subdir
ifeq ($(SUITE),css2_1)
DEVDIR = css2.1
SPECROOT = http://www.w3.org/TR/CSS21
endif

ifeq ($(SUITE),css3-color)
EXT = xhtml
endif

ifeq ($(SUITE),css3-namespace)
EXT = xml
endif 

###############################################################################
# Setup

DEVELPATH = http://test.csswg.org/svn/submitted/$(DEVDIR)

SETTRUE=foo
ifdef OFFICIAL
SETTRUE=devel
else
ifdef DEVEL
SETTRUE=devel
endif
endif

###############################################################################
# Targets

all: pull build clobber
ifndef SUITE
	# Suite param is required
	false
endif

update: pull build clean

build: stage process generate

clobber: clean
	rm -rf devel/$(SUITE)

pull:

ifdef DEVEL
	#
	# grab devel (unreviewed) tests from svn
	#
	rm -rf devel/$(SUITE)
	mkdir devel/$(SUITE)
	svn co $(DEVELPATH) devel/$(SUITE)
endif


stage:
	#
	# empty staging area
	#
	rm -rf tests/$(SUITE)

ifdef FLATTEN
	mkdir tests/$(SUITE)
	mkdir tests/$(SUITE)/support
	find $(SUITE)/src -name '*.$(EXT)' | xargs -n 1 --replace cp -L {} tests/$(SUITE)
else 
	cp -R $(SUITE)/src tests/$(SUITE)
endif

ifeq ($(SUITE),css2_1)
	find css1 -name FILENAMES | xargs -n 1 perl tools/$(SUITE)/make-proper-tests.pl
endif

ifdef DEVEL
	find devel/$(SUITE) -name '*.$(EXT)' | xargs -n 1 --replace cp -L {} tests/$(SUITE)
	find devel/$(SUITE)/* -type d -not -name .svn -not -name support  | xargs -n 1 perl -e 'if (-d "$$ARGV[0]/support") { print `cp -Lru "$$ARGV[0]/support" tests/$(SUITE)` }'
endif


	#
	# nuke unused support files and CVS directories
	#
	rm -rf tests/$(SUITE)/support/.unused
	find tests/$(SUITE) -type d -name CVS | xargs rm -rf

process:
	#
	# preprocess tests as necessary
	#

	egrep -l '&\w+;' tests/$(SUITE)/*.$(EXT) | xargs perl -pi -e 'use HTML::Entities::Numbered;' -e '$$_ = name2decimal_xml($$_)'
	#
	# now catalog them
	#
	find tests/$(SUITE) -name '*.$(EXT)' | xargs perl tools/common/catalog.pl $(SUITE) $(DATASOURCE) $(ASSERTIONS)

generate:
	#
	# empty distribution area
	#
	rm -rf dist/$(SUITE)
	mkdir dist/$(SUITE)
	mkdir dist/$(SUITE)/html4
	mkdir dist/$(SUITE)/xhtml1
	mkdir dist/$(SUITE)/xhtml1print
	#
	# documentation and htaccess
	#
	cp common/data/indices.css dist/$(SUITE)/indices.css
	cp common/data/htaccess dist/$(SUITE)/.htaccess
	cp common/data/LICENSE-BSD dist/$(SUITE)/LICENSE-BSD
	cp $(SUITE)/data/testinfo.data dist/$(SUITE)/testinfo.data


	tpage --relative --define path=$(SUITE)/data/ --define $(SETTRUE)=true --define specVersionString=$(SUITE) --define specRoot=$(SPECROOT) --include_path=templates/$(SUITE) --include_path=templates/common/ index.xht.tmpl > dist/$(SUITE)/index.xht
	tpage --relative --define path=$(SUITE)/data/ --define $(SETTRUE)=true --define specVersionString=$(SUITE) --define specRoot=$(SPECROOT) --include_path=templates/$(SUITE) --include_path=templates/common/ index.html.tmpl > dist/$(SUITE)/index.html



	#
	# generate the tests in all supported formats, along with support files
	#

	find tests/$(SUITE) -name '*.$(EXT)' | xargs perl tools/common/generate.pl $(SUITE) $(EXT)
	find tests/$(SUITE) -name 'chapter*.htm' | xargs perl tools/common/generate.pl $(SUITE) $(EXT)


	cp -Lr tests/$(SUITE)/support dist/$(SUITE)/html4/support
	cp -Lr tests/$(SUITE)/support dist/$(SUITE)/xhtml1/support
	cp -Lr tests/$(SUITE)/support dist/$(SUITE)/xhtml1print/support
	cp -Lr tests/$(SUITE)/sectionIndex.htm dist/$(SUITE)/html4/index.htm
	cp -Lr tests/$(SUITE)/sectionIndex.xht dist/$(SUITE)/xhtml1/index.xht
	cp -Lr tests/$(SUITE)/sectionIndex.xht dist/$(SUITE)/xhtml1print/index.xht


	# PNG->JPEG conversion requires ImageMagick's 'convert' tool
	find dist/$(SUITE)/xhtml1print/support -iname '*.png' | xargs -iFILENAME convert FILENAME -background white -flatten -quality 90 -interlace none FILENAME.jpg
	find dist/$(SUITE)/xhtml1print/support -iname '*.png.jpg' | xargs rename s/png.jpg/jpg/
	find dist/$(SUITE)/xhtml1print/support -iname '*.png' | xargs rm -rf
	find dist/$(SUITE)/xhtml1print -iname '*.$(EXT)' -o -iname '*.css' | xargs perl -pi -e 's/\.png/\.jpg/g'
	#
	# report number of tests now included (XHTML1.1 variants only)
	#
	ls dist/$(SUITE)/xhtml1/*.xht | wc -l
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
	rm -rf tests/$(SUITE)
	rm $(SUITE)/data/contributors.data
	#rm $(SUITE)/data/testinfo.data
