all:
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
	#
	# empty distribution area
	#
	rm -rf dist/
	mkdir dist
	mkdir dist/html4
	mkdir dist/xhtml1
	mkdir dist/xhtml1print
	#
	# index the tests
	#
	perl catalog.pl tests/*.xht
	cp data/indices.css dist/indices.css
	#
	# generate the tests in all supported formats, along with support files
	#
	perl generate.pl tests/*.xht
	perl -pi -e 's/\.xht/\.htm/g' dist/html4/by-section.htm
	cp -Lrv tests/support dist/html4/support
	cp -Lrv tests/support dist/xhtml1/support
	cp -Lrv tests/support dist/xhtml1print/support
	find dist/xhtml1print/support -iname '*.png' | xargs -I FILENAME convert FILENAME -background white -flatten -quality 90 FILENAME.jpg
	find dist/xhtml1print/support -iname '*.png.jpg' | xargs rename s/png.jpg/jpg/
	find dist/xhtml1print/support -iname '*.png' | xargs rm -rf
	find dist/xhtml1print -iname '*.xht' -o -iname '*.css' | xargs perl -pi -e 's/\.png/\.jpg/g'
	cp README.dist dist/README
	#
	# empty staging area again
	#
	rm -rf tests/
	#
	# report number of tests now included (XHTML1.1 variants only)
	#
	ls dist/xhtml1/*.xht | wc -l
