#!/bin/bash
# First arg is directory path to list, second arg is path to output file
echo '<!DOCTYPE html><html><title>CSS Tests by Filename</title><pre>' > $2
find $1 -type f ! -ipath '*svn*' ! -ipath '*build-test*' ! -ipath '*selectors3*' ! -ipath '*/support/*' ! -ipath '*boland*' >> $2
perl -pi -e "s#^$1/?((?:[^/<][^/]+/)*)([^/]+?)(\.[a-z]+)?\$#\$2\t<a href=\"\$1\$2\$3\">\$1\$2\$3</a>#" $2
echo '</pre>' >> $2
