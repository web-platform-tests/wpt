def main(request, response):
    return (
        [("Content-Type", "text/plain")],
        request.body
    )
