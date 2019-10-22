#!/bin/bash
set -ex

SCRIPT_DIR=$(cd $(dirname "$0") && pwd -P)
WPT_ROOT=$SCRIPT_DIR/../..
cd $WPT_ROOT

add_wpt_hosts() {
    ./wpt make-hosts-file | sudo tee -a /etc/hosts
}

test_infrastructure() {
    local ARGS="";
    if [ $PRODUCT == "firefox" ]; then
        ARGS="--install-browser"
    else
        ARGS=$1
    fi
    ./wpt run --no-pause-after-test --log-tbpl - --log-tbpl-level debug --yes --manifest ~/meta/MANIFEST.json --metadata infrastructure/metadata/ --install-fonts --binary-arg=--enable-logging --binary-arg=--log-level=0 --binary-arg=--log-file=/tmp/chrome_log.txt $ARGS $PRODUCT infrastructure/assumptions/ahem.html; echo "Dumping chrome log"; cat /tmp/chrome_log.txt
}

main() {
#    PRODUCTS=( "firefox" "chrome" )
    PRODUCTS=( "chrome" )
    ./wpt manifest --rebuild -p ~/meta/MANIFEST.json
    for PRODUCT in "${PRODUCTS[@]}"; do
        if [[ "$PRODUCT" == "chrome" ]]; then
            add_wpt_hosts
            test_infrastructure "--binary=/tmp/chrome_patch_4/chrome --channel dev"
        else
            test_infrastructure
        fi
    done
}

main
