set -ex

mkdir -p ~/meta
./wpt manifest -p ~/meta/MANIFEST.json
./wpt lint --all
