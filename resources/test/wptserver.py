import logging
import multiprocessing
import os
import sys


class WPTServer(object):
    def __init__(self, wpt_root):
        logger = logging.getLogger()
        self.wpt_root = wpt_root

        # Ensure we can import serve
        sys.path.insert(0, os.path.join(wpt_root, "tools"))
        from serve import serve

        self.config_ctx = serve.build_config(logger)
        config = self.config_ctx.__enter__()

        self.host = config["browser_host"]
        self.http_port = config["ports"]["http"][0]
        self.https_port = config["ports"]["https"][0]

        self.base_url = 'http://%s:%s' % (self.host, self.http_port)
        self.https_base_url = 'https://%s:%s' % (self.host, self.https_port)

        routes = serve.get_route_builder(logger, config.aliases, config).get_routes()

        self.servers = serve.start(logger,
                                   config,
                                   routes,
                                   mp_context=multiprocessing.get_context("spawn"),
                                   log_handlers=None)
        serve.ensure_started(config, self.servers)

    def stop(self):
        for servers in self.servers.values():
            for _, server in servers:
                server.stop()
        self.servers = None
        self.config_ctx.__exit__()

    def url(self, abs_path):
        return self.https_base_url + '/' + os.path.relpath(abs_path, self.wpt_root)
