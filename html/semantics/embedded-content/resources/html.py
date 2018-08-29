import os
import sys

# unless I want to app all the code for CORS in every file I have to do this to import the code
sys.path.append(os.path.dirname(__file__))

from cors_utils import cors

# Function to return a simple HTML document and
# to apply CORS response header according
# to the GET parameters
#
def main(request, response):
    cors(request, response)
    response.headers.set("Content-type", "text/html")

    html = """
<html>
    <head><title>ED: HTML</title></head>
    <body>
    <h1 id="h1">ED: HTML</h1>
    </body>
</html>
"""
    return html

