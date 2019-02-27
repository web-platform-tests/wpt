#!/bin/bash

set -ex

REMOTE=${1:-https://github.com/web-platform-tests/wpt}
REF=${2:-master}
REVISION=${3:-FETCH_HEAD}
BROWSER=${4:-all}
CHANNEL=${5:-nightly}

cd ~

mkdir web-platform-tests
cd web-platform-tests

git init
git remote add origin ${REMOTE}

# Initially we just fetch 50 commits in order to save several minutes of fetching
retry git fetch --quiet --depth=50 --tags origin ${REF}

if [[ ! `git rev-parse --verify -q ${REVISION}` ]];
then
    # But if for some reason the commit under test isn't in that range, we give in and
    # fetch everything
    retry git fetch -q --unshallow ${REMOTE}
    git rev-parse --verify ${REVISION}
fi
git checkout -b build ${REVISION}

source tools/ci/start.sh
