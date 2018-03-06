import os
import sys

# unless I want to app all the code for CORS in every file I have to do this to import the code
sys.path.append(os.path.dirname(__file__))

from cors_utils import cors

# Function to return a webvtt file and
# to apply CORS response header according
# to the GET parameters
#
def main(request, response):
    cors(request, response)
    # Set content type, this file only returns webvtt files
    response.headers.set("Content-type", "text/vtt")

    vtt = """WEBVTT FILE

1
00:00:00.500 --> 00:00:05.000
Teststring for WebVTT"""


    return vtt


