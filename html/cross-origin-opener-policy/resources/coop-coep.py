def main(request, response):
    coop = request.GET.first("coop")
    coep = request.GET.first("coep")
    if coop != "":
        response.headers.set("Cross-Origin-Opener-Policy", coop)
    if coep != "":
        response.headers.set("Cross-Origin-Embedder-Policy", coep)

    # This uses an <iframe> as BroadcastChannel is same-origin bound.
    response.content = """
<!doctype html>
<meta charset=utf-8>
<script src="/common/get-host-info.sub.js"></script>
<iframe></iframe>
<script>
  const iframe = document.querySelector("iframe");
  iframe.onload = () => {
    const payload = { name: self.name, opener: !!self.opener };
    iframe.contentWindow.postMessage(payload, "*");
  };
  const channelName = new URL(location).searchParams.get("channel");
  iframe.src = `${get_host_info().HTTP_ORIGIN}/html/cross-origin-opener-policy/resources/postback.html?channel=${channelName}`;
</script>
"""
