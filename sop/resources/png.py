import os
import sys

# unless I want to app all the code for CORS in every file I have to do this to import the code
sys.path.append(os.path.dirname(__file__))

from cors_utils import cors

# Function to return a png image and
# to apply CORS response header according
# to the GET parameters
#
def main(request, response):
    cors(request, response)
    # Set content type, this file only returns png pictures
    response.headers.set("Content-type", "image/png")

    image = ""

    with open("sop/resources/red.png", "rb") as f:
        image = f.readlines()

    return image
