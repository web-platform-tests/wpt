import os


def main(request, response):
  path = os.getcwd() + "/fetch/sec-metadata/resources/tmp/"

  ## Get the query parameter (filename) from URL ##
  filename =request.url_parts.query.split("=")[1]

  ## Check for path traversal ##
  if not is_safe_path(path, path + filename):
    response.writer.write_status(403)
    response.writer.end_headers()
    response.close_connection = True
    return

  ## Write the header value to a temporary file ##
  file = open(path + filename, "w")

  ## Return "NO SEC_METADATA HEADER" (or empty TBD) as a default value ##
  header = request.headers.get("Sec-Metadata", "NO SEC-METADATA HEADER")
  file.write(header)
  file.close()

  ## Prevent the browser from caching returned responses ##
  response.headers.set("Access-Control-Allow-Origin", "*")
  response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
  response.headers.set("Pragma", "no-cache")
  response.headers.set("Expires", "0")

  ## Add Content-Type to the serviceworker response
  if filename.startswith("serviceworker"):
    response.headers.set("Content-Type", "application/javascript")

  ## Add Content-Type to the serviceworker response
  # if filename.startswith("manifest"):
  #   response.headers.set("Content-Type", "text/cache-manifest")
    # return ""

def is_safe_path(basedir, path, follow_symlinks=True):
  if follow_symlinks:
    return os.path.realpath(path).startswith(basedir)

  return os.path.abspath(path).startswith(basedir)
