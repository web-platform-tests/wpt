def main(request, response):
    coop = request.GET.first(b"coop")
    coep = request.GET.first(b"coep")
    sandbox = request.GET.first(b"sandbox")
    if coop != "":
        response.headers.set(b"Cross-Origin-Opener-Policy", coop)
    if coep != "":
        response.headers.set(b"Cross-Origin-Embedder-Policy", coep)
    response.headers.set(b"Content-Security-Policy", b"sandbox " + sandbox + b";")

    # Open a popup to coop-coep.py with the same parameters (except sandbox)
    response.content = b"""
<!doctype html>
<meta charset=utf-8>
<script>
  const params = new URL(location).searchParams;
  params.delete("sandbox");
  window.open(`/html/cross-origin-opener-policy/resources/coop-coep.py?${params}`);
</script>
"""
