from os import path, listdir
from hashlib import sha256, md5
from base64 import urlsafe_b64encode
import re

JS_DIR = path.normpath(path.join(__file__, "..", ".."))


def js_files():
    '''
    Yield each file in the javascript directory
    '''
    for f in listdir(JS_DIR):
        if path.isfile(f) and f.endswith(".js"):
            yield f


def format_digest(digest):
    '''
    URL-safe base64 encode a binary digest and strip any padding.
    '''
    return urlsafe_b64encode(digest).rstrip("=")


def sha256_uri(content):
    '''
    Generate an encoded sha256 URI.
    '''
    return "ni:///sha-256;%s" % format_digest(sha256(content).digest())


def md5_uri(content):
    '''
    Generate an encoded md5 digest URI.
    '''
    return "ni:///md5;%s" % format_digest(md5(content).digest())


def main():
    for file in js_files():
        base = path.splitext(path.basename(file))[0]
        var_name = re.sub(r"[^a-z]", "_", base)
        content = "%s=true;" % var_name
        with open(file, "w") as f:
            f.write(content)


if __name__ == "__main__":
    main()
