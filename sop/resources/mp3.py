import os
import sys

# unless I want to app all the code for CORS in every file I have to do this to import the code
sys.path.append(os.path.dirname(__file__))

from cors_utils import cors

# Function to return a mp3 file and
# to apply CORS response header according
# to the GET parameters
#
def main(request, response):
    cors(request, response)
    # Set content type, this file only returns mp3 files
    response.headers.set("Content-type", "audio/mp3")

    audio = ""

    with open("sop/resources/audio.mp3", "rb") as f:
        audio = f.readlines()

    return audio
