import re
import os
import json
from wptserve.utils import isomorphic_decode

def main(request, response):
    path = os.path.join(request.doc_root, u"media", "sine440.mp3")
    total_size = os.path.getsize(path)
    range_header = request.headers.get(b'Range')
    range_header_match = range_header and re.search(r'^bytes=(\d*)-(\d*)$', isomorphic_decode(range_header))
    start, end = range_header_match.groups()
    start = int(start or 0)
    end = int(end or total_size)
    content_range = request.GET.first(b'response', 'bytes %d-%d / %d' % (start, end - 1, total_size))
    headers = []
    headers.append((b"Content-Range", content_range))
    headers.append((b"Accept-Ranges", b"bytes"))
    headers.append((b"Content-Type", b"audio/mp3"))
    headers.append((b"Content-Length", str(end - start)))
    headers.append((b"Cache-Control", b"no-cache"))
    video_file = open(path, "rb")
    video_file.seek(start)
    content = video_file.read(end)
    return 206, headers, content
