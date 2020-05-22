def main(request, response):
    response.add_required_headers = False
    output =  u"HTTP/1.1 221 ALL YOUR BASE BELONG TO H1\r\n"
    output += u"Access-Control-Allow-Origin: *\r\n"
    output += u"BB-8: hey\r\n"
    output += u"Content-Language: mkay\r\n"
    output += request.GET.first(b"expose").decode("iso-8859-1") + u"\r\n"
    output += u"\r\n"
    response.writer.write(output)
    response.close_connection = True
