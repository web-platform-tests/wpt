#/bin/bash

{
	echo -n "window.data = "
	curl -# http://www.whatwg.org/specs/web-apps/current-work/entities.json | sed 's/  /	/g' | sed "s/\"/'/g" | perl -pe 'chomp if eof'
	echo ';'
} > data.js

cat data.js