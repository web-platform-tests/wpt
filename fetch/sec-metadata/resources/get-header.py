import os
import time

def main(request, response):
  path = "fetch/sec-metadata/resources/tmp/"

  ## Get the query parameter (filename) from URL ##
  filename =request.url_parts.query.split("=")[1]

  if not os.path.isfile(path + filename):
    response.writer.write_status(404)
    response.writer.end_headers()
    response.close_connection = True
  else:
    ## Read and remove the file from tmp/ directory ##
    file = open(path + filename, "r")
    header = file.read()
    file.close()
    os.remove(path+filename)
    ## Write the file contents to the response object ##
    response.writer.write_status(200)
    response.writer.end_headers()
    response.writer.write(str(header))
    response.close_connection = True
