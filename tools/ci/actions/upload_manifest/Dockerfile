FROM python:2.7-slim

RUN apt-get update
RUN apt-get -y install git

ADD entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
