import os, json

def main(request, response):
    script_directory = os.path.dirname(os.path.abspath(__file__))
    template_directory = os.path.abspath(os.path.join(script_directory,
                                                      "..",
                                                      "template"))
    template_basename = "document.html.template"
    template_filename = os.path.join(template_directory, template_basename);

    with open(template_filename) as f:
        template = f.read()

    headers_as_json = json.dumps(request.headers, indent = 2)
    exported_headers = "var SERVER_REQUEST_HEADERS = " + headers_as_json + ";"
    rendered_html = template % {"headers": headers_as_json}

    return response.headers, rendered_html
