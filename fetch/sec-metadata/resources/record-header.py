
def main(request, response):
  path = "fetch/sec-metadata/resources/tmp/"

  ## Get the query parameter (filename) from URL ##
  filename =request.url_parts.query.split("=")[1]

  ## Write the header value to a temporary file ##
  file = open(path + filename, "w")

  ## Return "NO SEC_METADATA HEADER" (or empty TBD) as a default value ##
  file.write(request.headers.get("Sec-Metadata", "NO SEC-METADATA HEADER"))
  file.close()
