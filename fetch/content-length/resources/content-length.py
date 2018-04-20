def main(request, response):
    response.add_required_headers = False
    output =  "HTTP/1.1 200 OK\r\n"
    output += "Content-Type: text/plain;charset=UTF-8\r\n"
    output += request.GET.first("length") + "\r\n"
    output += "\r\n"
    output += "Fact: this is really forty-two bytes long."
    response.writer.write(output)
    response.write()
