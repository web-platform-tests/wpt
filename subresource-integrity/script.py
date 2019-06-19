# This file is responsible for serving a meaningless script, potentially
# with CORS, depending on the requestor's query params.
def main(request, response):
    response_headers = [("Content-Type", "text/javascript")]

    if "anonymous" in request.GET:
      response_headers.append(("Access-Control-Allow-Origin", "*")) 
    elif "with_credentials" in request.GET:
      response_headers.extend([
        ("Access-Control-Allow-Origin", request.headers.get("Origin", None)),
        ("Access-Control-Allow-Credentials", "true")
      ])

    # Note: Changing the response text below will the hash digest of the
    # body, and will require updating a bunch of the SRI tests to honor the
    # new digest.
    return (200, response_headers, "// nothing important.")
