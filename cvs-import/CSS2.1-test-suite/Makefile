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
	find cooked-tests/* -maxdepth 0 -type d -not -name CVS | xargs -n 1 perl -e 'if (-d "$ARGV[0]/support") { print `cp -Lrvu "$ARGV[0]/support" tests` }'
	#
	# nuke unused suport files and CVS directories
	#
	rm -rf tests/support/.unused
	find tests -type d -name CVS | xargs rm -rf
	#
	# empty distribution area
	#
	rm -rf dist/
	mkdir dist
	#
	# generate the tests in all supported formats, along with support files
	#
	perl generate.pl tests/*.xht
	cp -Lrv tests/support dist/support
	#
	# empty staging area again
	#
	rm -rf tests/
	#
	# report number of tests now included (XHTML1.1 variants only)
	#
	ls dist/*.xht | wc -l