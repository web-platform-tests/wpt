import gzip as gzip_module
from six.moves import cStringIO as StringIO
import os

def main(request, response):
    dir_path = os.path.dirname(os.path.realpath(__file__))
    file_path = os.path.join(dir_path, u'resource_timing_test0.xml')
    f = open(file_path, u'r')
    output = f.read()

    out = StringIO()
    with gzip_module.GzipFile(fileobj=out, mode="w") as f:
      f.write(output)
    output = out.getvalue()

    headers = [(b"Content-type", b"text/plain"),
               (b"Content-Encoding", b"gzip"),
               (b"Content-Length", len(output))]

    return headers, output
