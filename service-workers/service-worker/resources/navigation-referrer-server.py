from html import escape


def main(request, response):
    response.headers.set(b"Content-Type", b"text/html")
    for how in (b"click", b"bless-click", b"assign"):
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
    bless-click: clicks the link from script after test_driver.bless. A
        cross-site test cannot reach the link to click it.
    assign: assigns location.href.
    """
    return b"""<!DOCTYPE html>
    <script src="/resources/testdriver.js"></script>
    <script src="/resources/testdriver-vendor.js"></script>
    <a id="link" href="%s">navigate self</a>
    <script>
      self.addEventListener('load', async () => {
        const how = '%s';
        const test_window = self.opener || self.parent;
        if (how === 'assign') {
          location.href = link.href;
        } else if (how === 'click') {
          test_window.postMessage('ready', '*');
        } else {
          test_driver.set_test_context(test_window);
          await test_driver.bless('navigate self');
          link.click();
        }
      });
    </script>""" % (escape(url.decode()).encode(), how)
