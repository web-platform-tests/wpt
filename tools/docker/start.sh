#!/bin/bash
set -ex

cd web-platform-tests
git fetch origin -n -q --depth=50
git checkout -b master origin/master

sudo sh -c './wpt make-hosts-file >> /etc/hosts'

# Install Chome dev
deb_archive=google-chrome-unstable_current_amd64.deb
wget https://dl.google.com/linux/direct/$deb_archive

sudo gdebi -n $deb_archive

sudo Xvfb $DISPLAY -screen 0 ${SCREEN_WIDTH}x${SCREEN_HEIGHT}x${SCREEN_DEPTH} &
