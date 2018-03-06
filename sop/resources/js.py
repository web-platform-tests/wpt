import os
import sys

# unless I want to app all the code for CORS in every file I have to do this to import the code
sys.path.append(os.path.dirname(__file__))

from cors_utils import cors

# Function to return a javascript and
# to apply CORS response header according
# to the GET parameters
#
def main(request, response):
    cors(request, response)
    # Set content type, this file only returns javascript code
    response.headers.set("Content-type", "text/javascript")

    script_name = "UNDEFINED"

    if "script_name" in request.GET:
        script_name = request.GET.first("script_name")

    script = """
function {}() {{
    var secret = 42;
    return secret;
}}
""".format(script_name)

    return script