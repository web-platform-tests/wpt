def main(request, response):
    body = ""

    if b"iframe" in request.GET:
        frame = request.GET.first(b"iframe").split(b"|")
        frameReferrer = frame[0].decode("utf-8")
        frameURL = frame[1].decode("utf-8")
        if frameReferrer != "":
            frameReferrer = " referrerpolicy=" + frameReferrer

        body = ("<iframe src=\"%s\"%s></iframe>" % (frameURL, frameReferrer)) + "\n"

    if b"id" in request.GET:
        body = body + """<script>
let output = [...self.location.ancestorOrigins];
top.postMessage({ id: %s, output }, "*");
</script>
""" % request.GET.first(b"id").decode("utf-8")

    if body == "":
        return "Please specify either or both the 'iframe' and 'id' GET parameters."
    return body
