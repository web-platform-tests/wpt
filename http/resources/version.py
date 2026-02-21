def main(request, response):
    output = request.GET.first("input")
    output += "\n" + "header-parsing: is sad" + "\n"
    response.writer.write(output)
    response.close_connection = True
