#!/bin/bash

while (( "$#" )); do
	er=""

	if [[ "$(grep 'async_test(' $1)" && -z "$(grep '\(t\|this\|test\).done()' $1)" ]]; then
		er=$er" Missing t.done()?\n"
	fi

	if [[ "$(grep 'XXX' $1)" ]]; then
		er=$er" Important note: $(grep 'XXX' $1)\n"
	fi

	if [[ "$er" ]]; then
		echo -e "\033[2m$1\033[0m":
		echo -e "$er"
	fi

	shift
done
