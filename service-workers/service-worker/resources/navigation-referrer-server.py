from html import escape


def main(request, response):
    response.headers.set(b"Content-Type", b"text/html")
    for how in (b"click", b"script-click", b"assign"):
        url = request.GET.first(how, None)
        if url is not None:
            return helper(how, url)
    return b"""
    <script>
      self.addEventListener('load', evt => {
        const result = {
          referer: '%s',
          documentReferrer: document.referrer,
        };
        const channel = new URLSearchParams(location.search).get('channel');
        if (channel) {
          new BroadcastChannel(channel).postMessage(result);
          self.close();
        } else {
          (self.opener || self.parent).postMessage(result, '*');
        }
      });
    </script>""" % request.headers.get(b"referer", b"not set")


def helper(how, url):
    """Returns a page that navigates its own browsing context to `url`.

    click: posts 'ready'; the test then clicks the link with test_driver.
    script-click: clicks the link from script. A cross-site test cannot
        reach the link to click it.
    assign: assigns location.href.
    """
    return b"""<!DOCTYPE html>
    <a id="link" href="%s">navigate self</a>
    <script>
      self.addEventListener('load', () => {
        const how = '%s';
        const test_window = self.opener || self.parent;
        if (how === 'assign') {
          location.href = link.href;
        } else if (how === 'click') {
          test_window.postMessage('ready', '*');
        } else {
          link.click();
        }
      });
    </script>""" % (escape(url.decode()).encode(), how)
