FROM ubuntu:20.04

# No interactive frontend during docker build
ENV DEBIAN_FRONTEND=noninteractive \
    DEBCONF_NONINTERACTIVE_SEEN=true

# General requirements not in the base image
RUN apt-get -qqy update \
  && apt-get -qqy install git npm python3.9-venv

WORKDIR /app/

COPY package.json requirements.txt .

RUN npm install .
ENV PATH=/app/node_modules/.bin:$PATH

# Inspired by https://pythonspeed.com/articles/activate-virtualenv-dockerfile/
ENV VIRTUAL_ENV=/app/venv
RUN python3.9 -m venv $VIRTUAL_ENV
ENV PATH=$VIRTUAL_ENV/bin:$PATH
RUN pip install -r requirements.txt
