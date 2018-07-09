import os
import uuid
import hashlib

resourcePath = os.getcwd() + "/fetch/sec-metadata/resources/"

def main(request, response):

  ## Get the query parameter (filename) from URL ##
  filename =request.url_parts.query.split("=")[1]
  ## Convert the key from String to UUID valid String ##
  testId = hashlib.md5(filename).hexdigest()

  ## Handle the header retrieval request ##
  if request.method == "PUT":
    response.writer.write_status(200)
    response.writer.end_headers()
    header_value = request.server.stash.take(testId)
    if header_value != None:
      response.writer.write(header_value)

    response.close_connection = True

  ## Record incoming Sec-Metadata header value
  else:
    ## Return "NO SEC_METADATA HEADER" (or empty TBD) as a default value ##
    header = request.headers.get("Sec-Metadata", "NO SEC-METADATA HEADER")
    request.server.stash.put(testId, header)

    ## Prevent the browser from caching returned responses and allow CORS ##
    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")

    ## Add a valid ServiceWorker Content-Type ##
    if filename.startswith("serviceworker"):
      response.headers.set("Content-Type", "application/javascript")

    ## Return a valid .vtt content for the <track> tag ##
    if filename.startswith("track"):
      return "WEBVTT"

    ## Return a valid SharedWorker ##
    if filename.startswith("sharedworker"):
      file = open(resourcePath + "sharedWorker.js", "r")
      shared_worker = file.read()
      file.close()
      return shared_worker

    ## Return a valid font ##
    if filename.startswith("font"):
      file = open("fonts/Ahem.ttf", "r")
      font = file.read()
      file.close()
      return font

    ## Return a valid audio ##
    if filename.startswith("audio"):
      response.headers.set("Content-Type", "audio/mpeg")
      file = open("media/sound_5.mp3", "r")
      audio = file.read()
      file.close()
      return audio

    ## Return a valid style Content-Type ##
    if filename.startswith("style"):
      response.headers.set("Content-Type", "text/css")

