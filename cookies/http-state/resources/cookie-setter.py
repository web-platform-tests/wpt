def main(request, response):
  if "file" in request.GET:
    test_file = "%s-test" % request.GET['file'];
    response_data = open(os.path.join(request.doc_root, "cookies", "http-state", "resources", test_file)).read()

    response.writer.write_status(200)
    response.writer.write(response_data)
    if not self._response.explicit_flush:
      self.flush()
    response.writer.end_headers()
    response.writer.write()
