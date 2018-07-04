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

  ## Check if file exists ##
  if not os.path.isfile(path + filename):
    response.writer.write_status(404)
    response.writer.end_headers()
    response.close_connection = True
    return

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

def is_safe_path(basedir, path, follow_symlinks=True):
  if follow_symlinks:
    return os.path.realpath(path).startswith(basedir)

  return os.path.abspath(path).startswith(basedir)
