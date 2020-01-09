def main(request, response):
    coop = request.GET.first("coop")
    coep = request.GET.first("coep")
    sandbox = request.GET.first("sandbox")
    if coop != "":
        response.headers.set("Cross-Origin-Opener-Policy", coop)
    if coep != "":
        response.headers.set("Cross-Origin-Embedder-Policy", coep)
    response.headers.set("Content-Security-Policy", "sandbox " + sandbox + ";")

    # Open a popup to coop-coep.py with the same parameters (except sandbox)
    response.content = """
<!doctype html>
<meta charset=utf-8>
<script src="/common/get-host-info.sub.js"></script>
<script>
  const params = new URL(location).searchParams;
  params.delete("sandbox");
  window.open(`${get_host_info().HTTPS_ORIGIN}/html/cross-origin-opener-policy/resources/coop-coep.py?${params}`)
</script>
"""
