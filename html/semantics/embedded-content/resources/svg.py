import os
import sys

# unless I want to app all the code for CORS in every file I have to do this to import the code
sys.path.append(os.path.dirname(__file__))

from cors_utils import cors

# Function to return a svg image and
# apply CORS response header according
# to the GET parameters
#
def main(request, response):
    cors(request, response)
    # Set content type, this file only returns svg pictures
    response.headers.set("Content-type", "image/svg+xml")

    content = """
<svg id="svgroot" xmlns="http://www.w3.org/2000/svg" height="111" width="111">
    <rect width="111" height="111" style="fill:rgb(255,0,0);" />
</svg>
    """

    return content