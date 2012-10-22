#!/bin/bash

while (( "$#" )); do
    er=""

    if [[ -z "$(grep 'rel=.*help' $1)" ]]; then
        er=$er" help"
    fi

    if [[ -z "$(grep 'rel=.*author' $1)" ]]; then
        er=$er" author"
    fi

    if [[ -z "$(grep 'rel=.*assert' $1)" ]]; then
       er=$er" assert"
    fi
    if [[ "$er" ]]; then
        er=$er" <- is missing\n"
    fi

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

#vim: expandtab sw=4 sts=4 sws=4 ts=4
