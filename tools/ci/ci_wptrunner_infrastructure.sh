#!/bin/bash
set -ex

SCRIPT_DIR=$(dirname $(readlink -f "$0"))
WPT_ROOT=$(readlink -f $SCRIPT_DIR/../..)
cd $WPT_ROOT

source tools/ci/lib.sh

test_infrastructure() {
    ./wpt run --manifest ~/meta/MANIFEST.json --metadata infrastructure/metadata/ --install-fonts $PRODUCT infrastructure/
}

main() {
    # hosts_fixup
    PRODUCTS=( "firefox" "chrome" )
    for PRODUCT in "${PRODUCTS[@]}"; do
        if [ $(echo $PRODUCT | grep '^chrome:') ]; then
            install_chrome $(echo $PRODUCT | grep --only-matching '\w\+$')
        fi
        test_infrastructure
    done
}

main
