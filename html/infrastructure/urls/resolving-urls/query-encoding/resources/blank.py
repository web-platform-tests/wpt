def main(request, response):
    return ([("Content-Type", "text/html; charset=" + request.GET['encoding'])], "")
