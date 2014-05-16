build:
	rm -rf tests
	mkdir tests
	./make-proper-tests.pl raw-tests/css1tests/FILENAMES
	diff -ur -x .svn ../src/css1/ tests/ || echo "Done"

clobber:
	rm -rf tests

install:
	cp tests/* ../src/css1/

