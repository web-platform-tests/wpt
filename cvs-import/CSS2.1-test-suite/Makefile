all:
	rm -rf tests/*.xht
	find raw-tests -name FILENAMES | xargs -n 1 perl make-proper-tests.pl
	rm -rf tests/support/.unused
	rm -rf dist/
	mkdir dist
	perl generate.pl tests/*.xht
	cp -Lrv tests/support dist/support
