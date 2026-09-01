FROM ubuntu:26.04

# No interactive frontend during docker build
ENV DEBIAN_FRONTEND=noninteractive \
    DEBCONF_NONINTERACTIVE_SEEN=true

# General requirements not in the base image
RUN apt-get -qqy update \
  && apt-get -qqy install \
    bridge-utils \
    bzip2 \
    ca-certificates \
    curl \
    dbus-x11 \
    earlyoom \
    fonts-noto \
    fluxbox \
    gdebi \
    git \
    glib-networking-services \
    gstreamer1.0-plugins-bad \
    gstreamer1.0-gl \
    libatspi2.0-dev \
    libcairo2-dev \
    libgirepository1.0-dev \
    libosmesa6-dev \
    libproxy1v5 \
    libvirt-daemon-system \
    libvirt-clients \
    libunwind8 \
    libxcb-shape0-dev \
    locales \
    openjdk-17-jre-headless \
    pulseaudio \
    python-is-python3 \
    python3 \
    python3-dev \
    python3-pip \
    python3-venv \
    software-properties-common \
    qemu-system \
    tzdata \
    sudo \
    unzip \
    wget \
    xvfb

# Now clean up anything that's no longer needed
RUN apt-get -y autoremove

# Add Chrome debian repository
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo tee /etc/apt/keyrings/google.asc >/dev/null && \
    echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/google.asc] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list && \
    apt-get -qqy update

# Install Chrome and Firefox and their dependencies and then remove the main
# packages leaving just the dependencies
RUN apt-get -qqy install \
    firefox \
    google-chrome-canary && \
    apt-get -qqy remove firefox google-chrome-canary

# Install uv which we can use to manage python version
RUN curl -LsSf https://astral.sh/uv/install.sh | env UV_INSTALL_DIR="/usr/bin" sh

ENV TZ="UTC"
RUN echo "${TZ}" > /etc/timezone \
  && dpkg-reconfigure --frontend noninteractive tzdata

# Set the locale
RUN locale-gen en_US.UTF-8
ENV LANG="en_US.UTF-8"
ENV LANGUAGE="en_US:en"
ENV LC_ALL="en_US.UTF-8"

# Setup on-demand pulseaudio with a "Dummy Output" audio sink.
# This simply creates a file containing autospawn=yes at
# /run/pulseaudio-enable-autospawn, linked from /etc/pulse/client.conf.d/
RUN /etc/init.d/pulseaudio-enable-autospawn start

RUN useradd test \
         --shell /bin/bash  \
         --create-home \
  && usermod -a -G sudo test \
  && usermod -a -G kvm test \
  && usermod -a -G libvirt test \
  && usermod -a -G libvirt-qemu test \
  && echo 'ALL ALL = (ALL) NOPASSWD: ALL' >> /etc/sudoers \
  && echo 'test:secret' | chpasswd

ENV SCREEN_WIDTH=1280
ENV SCREEN_HEIGHT=1024
ENV SCREEN_DEPTH=24
ENV DISPLAY=":99.0"

USER test

WORKDIR /home/test

# Remove information on how to use sudo on login
RUN sudo echo ""

RUN mkdir -p /home/test/artifacts
RUN mkdir -p /home/test/bin

ENV PATH="/home/test/bin:/home/test/.local/bin:${PATH}"

WORKDIR /home/test/

COPY .bashrc /home/test/.bashrc

COPY start.sh /home/test/start.sh
COPY retry.py /home/test/bin/retry
