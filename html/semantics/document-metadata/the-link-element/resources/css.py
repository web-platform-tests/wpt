def main(request, response):
  response.add_required_headers = False
  if "attempt_content_type" in request.GET:
    response.writer.write_header("Content-Type", "oops")
  if "nosniff" in request.GET:
  	response.writer.write_header("x-content-type-options", "nosniff")
  response.writer.write_content("body { background:red }")
