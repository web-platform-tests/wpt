#!/bin/bash

if [ $1 == "-h" ]
then
    echo "Usage:"
    echo "./createDisplayTest.sh [-h] value(s)"
    echo "./createDisplayTest.sh -h -- show help text"
    echo "./createDisplayTest.sh \"block\" -- create test file for \"block\""
    echo "./createDisplayTest.sh \"block\" \"inline-block\" \"block flow-root\" -- create test files for \"block\" \"inline-block\" and \"block flow-root\""
    
    exit 0
fi

if [ $# -eq 0 ]
then
    echo "$0: Missing arguments"
    exit 1
fi

basefile="../display/display-block.html"

for i in "${@}"
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
