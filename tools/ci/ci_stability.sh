#!/bin/bash
set -ex

SCRIPT_DIR=$(dirname $(readlink -f "$0"))
WPT_ROOT=$(readlink -f $SCRIPT_DIR/../..)
cd $WPT_ROOT

source tools/ci/lib.sh

test_stability() {
    local binary_arg=$1
    ./wpt check-stability $PRODUCT $binary_arg --output-bytes $((1024 * 1024 * 3)) --metadata ~/meta/ --install-fonts
}

main() {
    hosts_fixup
    local binary_arg=""
    if [ $(echo $PRODUCT | grep '^chrome:') ]; then
       local channel=$(echo $PRODUCT | grep --only-matching '\w\+$')
       binary_arg="--binary=$(install_chrome $channel)"
    fi
    test_stability $binary_arg
}

main
