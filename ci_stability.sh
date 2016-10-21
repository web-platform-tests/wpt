set -e

export BUILD_HOME=$HOME/build
export WPT_HOME=$BUILD_HOME/w3c/web-platform-tests

hosts_fixup() {
    echo "== /etc/hosts =="
    cat /etc/hosts
    echo "----------------"
    sudo sed -i 's/^::1\s*localhost/::1/' /etc/hosts
    sudo sh -c 'echo "
127.0.0.1 web-platform.test
127.0.0.1 www.web-platform.test
127.0.0.1 www1.web-platform.test
127.0.0.1 www2.web-platform.test
127.0.0.1 xn--n8j6ds53lwwkrqhv28a.web-platform.test
127.0.0.1 xn--lve-6lad.web-platform.test
" >> /etc/hosts'
    echo "== /etc/hosts =="
    cat /etc/hosts
    echo "----------------"
}

fetch_master() {
    cd $WPT_HOME
    git fetch https://github.com/w3c/web-platform-tests.git master:master
}

build_manifest() {
    cd $WPT_HOME
    python manifest
}

install_wptrunner() {
    cd $BUILD_HOME
    if [ ! -d w3c/wptrunner ]; then
        git clone --depth 1 https://github.com/w3c/wptrunner.git w3c/wptrunner
        cd  w3c/wptrunner
    else
        cd  w3c/wptrunner
        git fetch https://github.com/w3c/wptrunner.git
    fi
    git reset --hard origin/master
    git submodule update --init --recursive
    pip install .
}

install_firefox() {
    cd $BUILD_HOME
    pip install -r w3c/wptrunner/requirements_firefox.txt
    wget https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central/firefox-52.0a1.en-US.linux-x86_64.tar.bz2
    tar -xf firefox-52.0a1.en-US.linux-x86_64.tar.bz2

    if [ ! -d profiles ]; then
        mkdir profiles
    fi
    cd  profiles
    wget https://hg.mozilla.org/mozilla-central/raw-file/tip/testing/profiles/prefs_general.js
}

install_geckodriver() {
    cd $BUILD_HOME
    local release_url
    local tmpfile
    local release_data
    # Stupid hacky way of getting the release URL from the GitHub API
    tmpfile=$(mktemp)
    echo 'import json, sys
data = json.load(sys.stdin)
print (item["browser_download_url"] for item in data["assets"]
       if "linux64" in item["browser_download_url"]).next()' > "$tmpfile"
    release_data=$(curl -s https://api.github.com/repos/mozilla/geckodriver/releases/latest?access_token=$GH_TOKEN)
    echo $RELEASE_DATA
    release_url=$(echo $release_data | python $tmpfile)
    rm "$tmpfile"
    wget "$release_url"
    tar xf geckodriver*.tar.gz
}

install_chrome() {
    cd $BUILD_HOME
    local latest
    pip install -r w3c/wptrunner/requirements_chrome.txt
    latest=$(curl https://www.googleapis.com/download/storage/v1/b/chromium-browser-snapshots/o/Linux_x64%2FLAST_CHANGE?alt=media)
    curl "https://www.googleapis.com/download/storage/v1/b/chromium-browser-snapshots/o/Linux_x64%2F$latest%2Fchrome-linux.zip?alt=media" > chrome-linux64.zip
    unzip -q chrome-linux64.zip
}

install_chromedriver() {
    cd $BUILD_HOME
    local latest
    latest=$(curl http://chromedriver.storage.googleapis.com/LATEST_RELEASE)
    wget "http://chromedriver.storage.googleapis.com/$latest/chromedriver_linux64.zip"
    unzip -q chromedriver_linux64.zip
}

test_stability() {
    cd $WPT_HOME
    python check_stability.py --root $BUILD_HOME --comment-pr ${TRAVIS_PULL_REQUEST} --gh-token ${GH_TOKEN} $PRODUCT
}

main() {
    fetch_master
    build_manifest
    install_wptrunner
    case "$PRODUCT" in
    firefox)
        install_firefox
        install_geckodriver
        ;;
    chrome)
        hosts_fixup
        install_chrome
        install_chromedriver
        ;;
    *)
        echo "Unrecognised product $PRODUCT"
        exit 1
    esac
    test_stability
}

main
