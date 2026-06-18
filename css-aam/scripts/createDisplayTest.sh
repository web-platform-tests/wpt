#!/bin/bash

# This excludes "none" and "block" on purpose.
knownvalues=("contents" "flow-root" "inline" "inline-block" "run-in" "list-item" "inline list-item" "flex" "inline-flex" "grid" "inline-grid" "ruby" "block ruby" "table" "inline-table")

if [ $# -eq 0 ]
then
    echo "$0: Missing arguments"
    exit 1
fi

if [ $1 == "-h" ]
then
    echo "Usage:"
    echo "./createDisplayTest.sh [-h] [-a] value(s)"
    echo "./createDisplayTest.sh -h -- show help text"
    echo "./createDisplayTest.sh -a -- create test files for all known display values (except \"none\" and \"block\")."
    echo "./createDisplayTest.sh \"block\" -- create test file for \"block\""
    echo "./createDisplayTest.sh \"block\" \"inline-block\" \"block flow-root\" -- create test files for \"block\" \"inline-block\" and \"block flow-root\""
    echo
    echo "Known values:"
    echo
    for i in "${knownvalues[@]}"
    do
        echo "- \"${i}\""
    done

    exit 0
fi

basefile="../display/display-block.html"
values="${@}"

if [[ $1 == "-a" || $1 == "--all" ]]
then
    values=("${knownvalues[@]}")
fi

for i in "${values[@]}"
do
    # Escape the argument. Spaces become two dashes.
    # This is to prevent conflict with things like "inline-flex" and "inline flex"; both valid values.
    # Ex: "inline flex" > "inline--flex"
    escapedValue=${i// /--}
    # The new `displayValue`
    displayValue="displayValue = \"${i}\""
    # The new file location and name
    newfile="../display/display-${escapedValue}.html"
    # Run sed on the basefile and replace the instances of the base value.
    # Then save to the new file.
    sed -E s/"display: block"/"display: ${i}"/g $basefile | sed -E s/'displayValue = "block"'/"${displayValue}"/g > $newfile
done
