def main(request, response):
    response.headers.set(b"Content-Type", b"text/html")
    return b"""
    <script>
      self.addEventListener('load', evt => {
        (self.opener || self.parent).postMessage({
          referer: '%s',
          documentReferrer: document.referrer,
        }, '*');
      });
    </script>""" % request.headers.get(b"referer", b"not set")
