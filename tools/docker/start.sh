#!/bin/bash
set -ex

REPO=${1:-origin}
BRANCH=${2:-master}
REV=${3:-master}
BROWSER=${4:-all}

cd ~/web-platform-tests
git fetch ${REPO} ${BRANCH} -n -q --depth=50
git checkout -b build ${REV}

sudo sh -c './wpt make-hosts-file >> /etc/hosts'

if [[ $BROWSER == "chrome"* ]] || [[ "$BROWSER" == all ]]
then
    # Install Chome dev
    deb_archive=google-chrome-unstable_current_amd64.deb
    wget https://dl.google.com/linux/direct/$deb_archive

    sudo gdebi -n $deb_archive
fi

sudo Xvfb $DISPLAY -screen 0 ${SCREEN_WIDTH}x${SCREEN_HEIGHT}x${SCREEN_DEPTH} &
