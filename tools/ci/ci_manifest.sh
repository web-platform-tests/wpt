set -ex

WPT_ROOT=$(cd $(dirname "$0")/../.. && pwd -P)
cd $WPT_ROOT

mkdir -p ~/meta

python tools/ci/tag_master.py
./wpt manifest -p ~/meta/MANIFEST.json
cp ~/meta/MANIFEST.json $WPT_MANIFEST_FILE
# Force overwrite of any existing file
gzip -f $WPT_MANIFEST_FILE
