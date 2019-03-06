FROM python:2.7

LABEL "com.github.actions.name"="Publish manifest as GitHub release"
LABEL "com.github.actions.icon"="upload"
LABEL "com.github.actions.color"="blue"

RUN pip install PyGithub

ADD entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
