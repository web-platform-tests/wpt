import json

def main(request, response):
    response.add_required_headers = False
    response.writer.write_status(200)
    # Allow cross-origin access for XHR.
    response.writer.write_header("access-control-allow-origin", "*")
    response.writer.write_header("content-type", "application/json")
    response.writer.write_header("cache-control", "no-cache; must-revalidate")
    response.writer.end_headers()

    headers_as_json = json.dumps(request.headers)
    response.writer.write(headers_as_json)
