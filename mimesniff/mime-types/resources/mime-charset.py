from wptserve.utils import isomorphic_decode

def main(request, response):
    content = u"<meta charset=utf-8>\n<script>document.write(document.characterSet)</script>"

    # This uses the following rather than
    #   response.headers.set("Content-Type", request.GET.first("type"));
    #   response.content = content
    # to work around https://github.com/web-platform-tests/wpt/issues/8372.

    response.add_required_headers = False
    output = u"HTTP/1.1 200 OK\r\n"
    output += u"Content-Length: " + str(len(content)) + u"\r\n"
    output += u"Content-Type: " + isomorphic_decode(request.GET.first(b"type")) + u"\r\n"
    output += u"\r\n"
    output += content
    response.writer.write(output)
    response.close_connection = True
