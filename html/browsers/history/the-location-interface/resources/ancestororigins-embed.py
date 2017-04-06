def main(request, response):
    body = ""

    if "iframe" in request.GET:
        frame = request.GET.first("iframe").split("|")
        frameReferrer = frame[0]
        frameURL = frame[1]
        if frameReferrer != "":
            frameReferrer = " referrerpolicy=" + frameReferrer

        body = ("<iframe src=\"%s\"%s></iframe>" % (frameURL, frameReferrer)) + "\n"

    if "id" in request.GET:
        body = body + """<script>
const ao = self.location.ancestorOrigins
let output = []
for(let i = 0; i < ao.length; i++) {
  output.push(ao[i])
}
top.postMessage({ id: %s, output }, "*")
</script>
""" % request.GET.first("id")

    if body == "":
        return "Please specify either or both the 'iframe' and 'id' GET parameters."
    return body
