import os
import sys

# unless I want to app all the code for CORS in every file I have to do this to import the code
sys.path.append(os.path.dirname(__file__))

from cors_utils import cors

# Function to return a mp4 video and
# to apply CORS response header according
# to the GET parameters
#
def main(request, response):
    cors(request, response)
    # Set content type, this file only returns mp4 videos
    response.headers.set("Content-type", "video/mp4")

    video = ""

    with open("sop/resources/movie.mp4", "rb") as f:
        video = f.readlines()

    return video
