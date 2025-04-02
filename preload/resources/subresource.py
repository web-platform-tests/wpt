import os
import json
from statistics import mode
from wptserve.utils import isomorphic_encode

def main(request, response):
    links = json.loads(request.GET.first(b'links'))
    href = request.GET.first(b'href')
    type = request.GET.first(b'type')
    here = os.path.abspath(os.path.dirname(__file__))
    repo_root = os.path.abspath(os.path.join(here, os.pardir, os.pardir))
    resource_path = os.path.join(repo_root, '.' + href.decode('utf-8'))
    for l in links:
        response.headers.append('Link', l)

    response.headers['Cache-Control'] = 'max-age=1000'
    response.headers['Content-Type'] = type
    response.content = open(resource_path, 'r' if type.startswith(b'text') else 'rb').read()

