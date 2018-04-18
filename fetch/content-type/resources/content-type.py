def main(request, response):
    values = request.GET.get_list("value")
    output =  "HTTP/1.1 200 OK\r\n"
    output += "X-Content-Type-Options: nosniff\r\n"
    if "single_header" in request.GET:
        output += "Content-Type: " + ",".join(values) + "\r\n"
    output += "Content-Length: 5\r\n"
    output += "\r\n"
    output += "whoa\n"
    response.writer.write(output)
    response.write()
