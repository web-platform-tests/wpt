set -ex

WPT_ROOT=$(cd $(dirname "$0")/../.. && pwd -P)
cd $WPT_ROOT

mkdir -p ~/meta
./wpt manifest -p ~/meta/MANIFEST.json
./wpt lint --all
