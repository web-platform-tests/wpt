FROM ubuntu:20.04

# No interactive frontend during docker build
ENV DEBIAN_FRONTEND=noninteractive \
    DEBCONF_NONINTERACTIVE_SEEN=true \
    TZ="UTC" \
    SCREEN_WIDTH=1280 \
    SCREEN_HEIGHT=1024 \
    SCREEN_DEPTH=24 \
    DISPLAY=:99.0

# General requirements not in the base image
RUN apt-get -qqy update \
  && apt-get -qqy install \
    bridge-utils \
    bzip2 \
    ca-certificates \
    curl \
    dbus-x11 \
    earlyoom \
    fluxbox \
    gdebi \
    git \
    gstreamer1.0-plugins-bad \
    gstreamer1.0-gl \
    libosmesa6-dev \
    libvirt-daemon-system \
    libvirt-clients \
    libunwind8 \
    libxcb-shape0-dev \
    locales \
    openjdk-8-jre-headless \
    pulseaudio \
    python3 \
    python3-dev \
    python3-pip \
    software-properties-common \
    qemu-kvm \
    tzdata \
    sudo \
    unzip \
    wget \
    xvfb \
# python3.6 is not available by default in new versions of Ubuntu.
  && apt-add-repository -y ppa:deadsnakes/ppa \
# Ensure a `python` binary exists
  && apt-get -qqy update \
  && apt-get -qqy install \
    python-is-python3 \
# Installing just the deps of firefox and chrome is moderately tricky, so
# just install the default version of firefox, and some extra deps we happen
# to know that chrome requires
  && apt-get -qqy install \
     firefox \
     libnss3-tools \
     fonts-liberation \
     indicator-application \
     libappindicator1 \
     libappindicator3-1 \
     libdbusmenu-gtk3-4 \
     libindicator3-7 \
     libindicator7 \
  && apt-get -y autoremove \
  && pip install --upgrade pip \
  && pip install virtualenv \
  && echo "${TZ}" > /etc/timezone \
  && dpkg-reconfigure --frontend noninteractive tzdata \
  && locale-gen en_US.UTF-8

# Set the locale
ENV LANG=en_US.UTF-8 \
  LANGUAGE=en_US:en \
  LC_ALL=en_US.UTF-8

RUN useradd test \
         --shell /bin/bash  \
         --create-home \
  && usermod -a -G sudo test \
  && usermod -a -G libvirt test \
  && usermod -a -G libvirt-qemu test \
  && echo 'ALL ALL = (ALL) NOPASSWD: ALL' >> /etc/sudoers \
  && echo 'test:secret' | chpasswd

USER test

WORKDIR /home/test

# Remove information on how to use sudo on login
RUN sudo echo "" \
  && mkdir -p /home/test/artifacts \
  && mkdir -p /home/test/bin

ENV PATH="/home/test/.local/bin:${PATH}"

COPY .bashrc start.sh /home/test/
COPY retry.py /home/test/.local/bin/retry
