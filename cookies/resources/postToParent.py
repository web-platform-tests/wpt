import json
import helpers

def main(request, response):
    headers = helpers.setNoCacheAndCORSHeaders(request, response)
    cookies = helpers.readCookies(request)
    headers.append(("Content-Type", "text/html; charset=utf-8"))

    tmpl = """
<!DOCTYPE html>
<script src="/common/get-host-info.sub.js"></script>
<body>
<script>
  var data = %s;

  if (window.parent != window)
    window.parent.postMessage(data, "*");

  if (window.opener)
    window.opener.postMessage(data, "*");

  window.addEventListener("message", e => {
    console.log(e);
    if (e.data == "reload")
      window.location.reload();
    if (e.data == "ready")
      e.source.postMessage(data, "*");
  });

  let iframe = document.createElement("iframe");
  iframe.src = get_host_info().HTTP_ORIGIN + "/cookies/resources/broadcaster.html";
  document.body.appendChild(iframe);
</script>
"""
    return headers, tmpl % json.dumps(cookies)
