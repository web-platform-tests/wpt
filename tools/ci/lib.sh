install_chrome() {
    channel=$1
    deb_archive=google-chrome-${channel}_current_amd64.deb
    wget -q https://dl.google.com/linux/direct/$deb_archive

    # If the environment provides an installation of Google Chrome, the
    # existing binary may take precedence over the one introduced in this
    # script. Remove any previously-existing "alternatives" prior to
    # installation in order to ensure that the new binary is installed as
    # intended.
    if sudo update-alternatives --list google-chrome; then
        sudo update-alternatives --remove-all google-chrome
    fi

    # Installation will fail in cases where the package has unmet dependencies.
    # When this occurs, attempt to use the system package manager to fetch the
    # required packages and retry.
    if ! sudo dpkg --install $deb_archive; then
      sudo apt-get install -qqy --fix-broken
      sudo dpkg --install $deb_archive
    fi
}
