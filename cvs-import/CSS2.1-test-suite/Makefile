all:
	rm -rf tests/*.xht
	rm -rf tests/support
	find raw-tests -name FILENAMES | xargs -n 1 perl make-proper-tests.pl
	find cooked-tests -name '*.xht' | xargs -n 1 --replace cp -Lv {} tests
	find cooked-tests/* -maxdepth 0 -type d -not -name CVS | xargs -n 1 --replace cp -Lrvu {}/support tests
	rm -rf tests/support/.unused
	find tests -type d -name CVS | xargs rm -rf
	rm -rf dist/
	mkdir dist
	perl generate.pl tests/*.xht
	cp -Lrv tests/support dist/support
	ls dist/*.xht | wc -l