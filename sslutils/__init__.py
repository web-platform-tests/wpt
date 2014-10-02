import openssl
import pregenerated
from openssl import OpenSSLEnvironment
from pregenerated import PregeneratedSSLEnvironment

class NoSSLEnvironment(object):
    ssl_enabled = False

    def __init__(self, logger):
        pass

    def __enter__(self):
        pass

    def __exit__(self, *args, **kwargs):
        pass

    def host_cert_path(self, host):
        return None

    def ca_cert_path(self):
        return None
