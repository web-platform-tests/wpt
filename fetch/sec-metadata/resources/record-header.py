import os
import uuid
import hashlib

resourcePath = os.getcwd() + "/fetch/sec-metadata/resources/"

def main(request, response):

  ## Get the query parameter (key) from URL ##
  ## Tests will record POST requests (CSP Report) and GET (rest) ##
  if request.GET:
    key = request.GET['file']
  elif request.POST:
    key = request.POST['file']

  ## Convert the key from String to UUID valid String ##
  testId = hashlib.md5(key).hexdigest()

  ## Handle the header retrieval request ##
  if 'retrieve' in request.GET:
    response.writer.write_status(200)
    response.writer.end_headers()
    header_value = request.server.stash.take(testId)
    if header_value != None:
      response.writer.write(header_value)

    response.close_connection = True

  ## Record incoming Sec-Metadata header value
  else:
    ## Return empty string as a default value ##
    header = request.headers.get("Sec-Metadata", "")
    request.server.stash.put(testId, header)

    ## Prevent the browser from caching returned responses ##
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")

    ## Add a valid ServiceWorker Content-Type ##
    if key.startswith("serviceworker"):
      response.headers.set("Content-Type", "application/javascript")

    ## Return a valid .vtt content for the <track> tag ##
    if key.startswith("track"):
      return "WEBVTT"

    ## Return a valid SharedWorker ##
    if key.startswith("sharedworker"):
      file = open(resourcePath + "sharedWorker.js", "r")
      shared_worker = file.read()
      file.close()
      return shared_worker

    ## Return a valid font content and Content-Type ##
    if key.startswith("font"):
      file = open("fonts/Ahem.ttf", "r")
      font = file.read()
      file.close()
      return font

    ## Return a valid audio content and Content-Type ##
    if key.startswith("audio"):
      response.headers.set("Content-Type", "audio/mpeg")
      file = open("media/sound_5.mp3", "r")
      audio = file.read()
      file.close()
      return audio

    ## Return a valid video content and Content-Type ##
    if key.startswith("video"):
      response.headers.set("Content-Type", "video/mp4")
      file = open("media/A4.mp4", "r")
      video = file.read()
      file.close()
      return video

    ## Return a valid style content and Content-Type ##
    if key.startswith("style") or key.startswith("embed") or key.startswith("object"):
      response.headers.set("Content-Type", "text/css")
      file = open("tools/runner/runner.css", "r")
      style = file.read()
      file.close()
      return style

    ## Return a valid image content and Content-Type for redirect requests ##
    if key.startswith("redirect"):
      response.headers.set("Content-Type", "image/jpeg")
      file = open("media/1x1-green.png", "r")
      image = file.read()
      file.close()
      return image
