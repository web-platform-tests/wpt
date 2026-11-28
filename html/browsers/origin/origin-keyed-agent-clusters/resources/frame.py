def main(request, response):
    """Send a response that will have a requester-chosen Origin-Agent-Cluster
    header, using the "header" query parameter. The sccript will wait for
    postMessage events to set document.domain and will postMessage the result
    back to the sender.
    """

    if b"header" in request.GET:
      header = request.GET.first(b"header")
      response.headers.set(b"Origin-Agent-Cluster", header)
    response.headers.set(b"Content-Type", b"text/html")

    return u"""
      <!DOCTYPE html>
      <meta charset="utf-8">
      <title>A frame included by a test page</title>
      <script>
      window.onmessage = e => {
        document.domain = e.data.newValue;
        e.source.postMessage({ type: e.data.type, result: document.domain }, "*");
      };
      </script>
    """
