import uuid
from multiprocessing import Process
from multiprocessing.managers import SyncManager, DictProxy
import os
import json


WPT_STASH_CONFIG = "WPT_STASH_CONFIG"

def load_env_config():
    return json.loads(os.environ[WPT_STASH_CONFIG])

def store_env_config(config):
    os.environ[WPT_STASH_CONFIG] = json.dumps(config)

def start_server(address=None, authkey=None):
    shared_data = {}
    class DictManager(SyncManager):
        pass

    DictManager.register("get_dict",
                         callable=lambda:shared_data,
                         proxytype=DictProxy)
    manager = DictManager(address, authkey)
    server = manager.get_server()
    server_process = Process(target=server.serve_forever)
    server_process.start()

    return (server_process, manager._address, manager._authkey)


#TODO: Consider expiring values after some fixed time for long-running
#servers

# TODO(kristijanburnik): Provide shared Stash support for WebSockets.

class Stash(object):
    """Key-value store for persisting data across HTTP/S requests.

    This data store is specifically designed for persisting data across
    HTTP and HTTPS requests. The synchronization model is usually done by using
    the SyncManager from the multiprocessing module.

    Stash can be used interchangeably between HTTP and HTTPS requests as both
    processes are accessing the same resource (e.g. a Manager.dict).
    The WS and WSS servers are currently not supported.

    The store has several unusual properties. Keys are of the form (path,
    uuid), where path is, by default, the path in the HTTP request and
    uuid is a unique id. In addition, the store is write-once, read-once,
    i.e. the value associated with a particular key cannot be changed once
    written and the read operation (called "take") is destructive. Taken together,
    these properties make it difficult for data to accidentally leak
    between different resources or different requests for the same
    resource.
    """

    _proxy = None

    def __init__(self, default_path, address=None, authkey=None):
        self.default_path = default_path
        self.data = self._get_proxy(address, authkey)

    def _get_proxy(self, address=None, authkey=None):
        if address is None and authkey is None:
            Stash._proxy = {}

        if Stash._proxy is None:
            class DictManager(SyncManager):
                pass

            DictManager.register("get_dict")
            manager = DictManager(address, authkey)
            manager.connect()
            Stash._proxy = manager.get_dict()

        return Stash._proxy

    def _wrap_key(self, key, path):
        if path is None:
            path = self.default_path
        # This key format is required to support using the path. Since the data
        # passed into the stash can be a DictProxy which wouldn't detect changes
        # when writing to a subdict.
        return (str(path), str(uuid.UUID(key)))

    def put(self, key, value, path=None):
        """Place a value in the shared stash.

        :param key: A UUID to use as the data's key.
        :param value: The data to store. This can be any python object.
        :param path: The path that has access to read the data (by default
                     the current request path)"""
        if value is None:
            raise ValueError("SharedStash value may not be set to None")
        internal_key = self._wrap_key(key, path)
        if internal_key in self.data:
            raise StashError("Tried to overwrite existing shared stash value "
                             "for key %s (old value was %s, new value is %s)" %
                             (internal_key, self[str(internal_key)], value))
        else:
            self.data[internal_key] = value

    def take(self, key, path=None):
        """Remove a value from the shared stash and return it.

        :param key: A UUID to use as the data's key.
        :param path: The path that has access to read the data (by default
                     the current request path)"""
        internal_key = self._wrap_key(key, path)
        value = self.data.get(internal_key, None)
        if not value is None:
            try:
                self.data.pop(internal_key)
            except KeyError:
                # Silently continue when pop error occurs.
                pass

        return value

class StashError(Exception):
    pass
