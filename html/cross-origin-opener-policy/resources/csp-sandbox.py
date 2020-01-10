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
<script>
  const params = new URL(location).searchParams;
  params.delete("sandbox");
  window.open(`/html/cross-origin-opener-policy/resources/coop-coep.py?${params}`);
</script>
"""
