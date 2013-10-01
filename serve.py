 # -*- coding: utf-8 -*-
import sys
import os
import logging
import json
import socket
import signal
import threading
from collections import defaultdict
import urllib2
import uuid

logger = logging.getLogger(__name__)
logging.basicConfig()

repo_root = os.path.abspath(os.path.split(__file__)[0])

sys.path.insert(1, os.path.join(repo_root, "tools"))
from wptserve import server as wptserve, handlers
sys.path.insert(1, os.path.join(repo_root, "tools", "pywebsocket", "src"))
from mod_pywebsocket import standalone as pywebsocket

routes = [("*", "/tools.*", handlers.ErrorHandler(404)),
          ("*", "/serve\.py", handlers.ErrorHandler(404)),
          ("*", ".*\.py", handlers.python_handler),
          ("GET", ".*\.asis", handlers.as_is_handler),
          ("GET", "/.*", handlers.file_handler),
          ]

router = wptserve.Router(repo_root, routes)

subdomains = [u"www",
              u"www1",
              u"www2",
              u"天気の良い日",
              u"élève"]

def open_socket(port):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    if port != 0:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind(('127.0.0.1', port))
    sock.listen(5)
    return sock

def get_port():
    free_socket = open_socket(0)
    port = free_socket.getsockname()[1]
    #Keep this socket open here and close it just before we start
    #the corresponding server
    return port, free_socket

class ServerWrapper(object):
    def __init__(self, daemon):
        self.thread = None
        self.daemon = daemon

    def start(self):
        self.thread = threading.Thread(target=self.daemon.serve_forever)
        self.thread.setDaemon(True)
        self.thread.start()

    def stop(self):
        self.daemon.shutdown()

def probe_subdomains(config):
    host = config["host"]
    port, sock = get_port()
    sock.close()
    daemon = start_http_server(config, port)
    wrapper = ServerWrapper(daemon)
    wrapper.start()

    rv = {}

    for subdomain in subdomains:
#        print "Probing for support of subdomain %s" % subdomain
        #This assumes that the tld is ascii-only or already in punycode
        punycode = subdomain.encode("idna")
        domain = "%s.%s" % (punycode, host)
        try:
            urllib2.urlopen("http://%s:%d/" % (domain, port))
        except Exception as e:
            if config["external_domain"]:
                external = "%s.%s" % (punycode, config["external_domain"])
                print "Using external server %s for subdomain %s" % (external, subdomain)
                rv[subdomain] = external
            else:
                print "Failed probing domain %s and no external fallback configured. You may need to edit /etc/hosts or similar." % domain
                sys.exit(1)
        else:
            rv[subdomain] = "%s.%s" % (punycode, host)

    wrapper.stop()

    return rv

def start_servers(config, ports):
    servers = defaultdict(list)

    host = config["host"]

    for scheme, ports in ports.iteritems():
        assert len(ports) == {"http":2}.get(scheme, 1)

        for port, socket in ports:
            init = {"http":start_http_server,
                    "https":start_https_server,
                    "ws":start_ws_server,
                    "wss":start_wss_server}[scheme]

            socket.close()
            daemon = init(config, port)

            if daemon:
                wrapper = ServerWrapper(daemon)
                wrapper.start()
                print "Started server at %s://%s:%s" % (scheme, config["host"], port)
                servers[scheme].append((port, wrapper))

    return servers

def start_http_server(config, port):
    return wptserve.WebTestServer(router,
                                  (config["host"], port),
                                  wptserve.WebTestRequestHandler,
                                  config=config,
                                  use_ssl=False,
                                  certificate=None)

def start_https_server(config, port):
    return

def start_ws_server(config, port):
    opts, args  = pywebsocket._parse_args_and_config(["-H", config["host"],
                                                      "-p", str(port),
                                                      "-d", repo_root,
                                                      "-w", os.path.join(repo_root, "websockets", "handlers")])

    opts.cgi_directories = []
    opts.is_executable_method = None
    return pywebsocket.WebSocketServer(opts)

def start_wss_server(config, port):
    return

def get_ports(config):
    rv = defaultdict(list)
    for scheme, ports in config["ports"].iteritems():
        for i, port in enumerate(ports):
            if port == "auto":
                port, sock = get_port()
            else:
                port, sock = port, open_socket(port)
            rv[scheme].append((port, sock))
    return rv

def normalise_config(config, domains, ports):
    ports_ = {}
    for scheme, ports_used in ports.iteritems():
        ports_[scheme] = [item[0] for item in ports_used]

    domains_ = domains.copy()
    domains_[""] = config["host"]

    return {"host":config["host"],
            "domains":domains_,
            "ports": ports_}

def main():
    with open("config.json") as f:
        config = json.load(f)

    ports = get_ports(config)
    domains = probe_subdomains(config)

    config_ = normalise_config(config, domains, ports)

    servers = start_servers(config_, ports)

    print "Everything is illuminated"
    while any(item.isAlive() for item in iter_threads(servers)):
        for item in iter_threads(servers):
            item.join(1)

def iter_threads(servers):
    for servers in servers.values():
        for port, server in servers:
            yield server.thread

if __name__ == "__main__":
    main()
