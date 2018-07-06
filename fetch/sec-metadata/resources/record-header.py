import os

tmpPath = os.getcwd() + "/fetch/sec-metadata/resources/tmp/"
resourcePath = os.getcwd() + "/fetch/sec-metadata/resources/"

def main(request, response):

  ## Get the query parameter (filename) from URL ##
  filename =request.url_parts.query.split("=")[1]

  ## Check for path traversal ##
  if not is_safe_path(tmpPath, tmpPath + filename):
    response.writer.write_status(403)
    response.writer.end_headers()
    response.close_connection = True
    return

  ## Write the header value to a temporary file ##
  file = open(tmpPath + filename, "w")

  ## Return "NO SEC_METADATA HEADER" (or empty TBD) as a default value ##
  header = request.headers.get("Sec-Metadata", "NO SEC-METADATA HEADER")
  file.write(header)
  file.close()

  ## Prevent the browser from caching returned responses and allow CORS ##
  response.headers.set("Access-Control-Allow-Origin", "*")
  response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
  response.headers.set("Pragma", "no-cache")
  response.headers.set("Expires", "0")

  ## Add a valid Content-Type to the serviceworker response
  if filename.startswith("serviceworker"):
    response.headers.set("Content-Type", "application/javascript")

  ## Return a valid .vtt content for the <track> tag
  if filename.startswith("track"):
    return "WEBVTT"

  ## Return a valid SharedWorker
  if filename.startswith("sharedworker"):
    file = open(resourcePath + "sharedWorker.js", "r")
    sharedWorker = file.read()
    file.close()
    return sharedWorker

  ## Return a valid font
  if filename.startswith("font"):
    file = open("fonts/Ahem.ttf", "r")
    font = file.read()
    file.close()
    return font

def is_safe_path(basedir, path, follow_symlinks=True):
  if follow_symlinks:
    return os.path.realpath(path).startswith(basedir)

  return os.path.abspath(path).startswith(basedir)

