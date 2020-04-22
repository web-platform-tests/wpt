This docker images is used for testing Chrome, Firefox, WebKitGTK and running
other tasks on Taskcluster. When any of the files in this directory change, the
images must be updated as well. Doing this requires you be part of the
'webplatformtests' organization on dockerhub; ping @Hexcles or @stephenmcgruer
if you aren't.

In this directory, run the following, where `<tag>` is of the form
`webplatformtests/wpt:{current-version + 0.1}`:

```sh
# --pull forces Docker to get the newest base image.
docker build --pull -t <tag> .
docker push <tag>
```

