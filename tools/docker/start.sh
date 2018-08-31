# This script is embedded in the docker image, and so the image must be updated when changes
# to the script are made. To do this, assuming you have docker installed:
# In tools/docker/ :
#   docker build .
#   docker ps # and look for the id of the image you just built
#   docker tag <image> <tag>
#   docker push <tag>
# Update the `image` specified in the project's .taskcluster.yml file


#!/bin/bash
set -ex

REMOTE=${1:-https://github.com/web-platform-tests/wpt}
REF=${2:-master}
REVISION=${3:-FETCH_HEAD}
DEPTH=${4:-50}
BROWSER=${5:-all}

cd ~

mkdir web-platform-tests
cd web-platform-tests
git init
git remote add origin ${REMOTE}

# Initially we fetch a limited number of commits in order to save several
# minutes of fetching
git fetch --quiet --depth=${DEPTH} origin ${REF}

if [[ ! `git rev-parse --verify -q ${REVISION}` ]];
then
    # But if for some reason the commit under test isn't in that range, we give in and
    # fetch everything
    git fetch -q --unshallow ${REMOTE}
    git rev-parse --verify ${REVISION}
fi
git checkout -b build ${REVISION}

sudo sh -c './wpt make-hosts-file >> /etc/hosts'

if [[ $BROWSER == "chrome"* ]] || [[ "$BROWSER" == all ]]
then
    # Install Chrome dev
    deb_archive=google-chrome-unstable_current_amd64.deb
    wget https://dl.google.com/linux/direct/$deb_archive

    sudo apt-get -qqy update && sudo gdebi -n $deb_archive
fi

sudo Xvfb $DISPLAY -screen 0 ${SCREEN_WIDTH}x${SCREEN_HEIGHT}x${SCREEN_DEPTH} &
