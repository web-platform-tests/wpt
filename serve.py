 # -*- coding: utf-8 -*-
import sys
import os
import logging
import json
import socket
import signal
import threading
from multiprocessing import Process, Event
from collections import defaultdict
import urllib2
import uuid
import argparse

repo_root = os.path.abspath(os.path.split(__file__)[0])

sys.path.insert(1, os.path.join(repo_root, "tools", "wptserve"))
from wptserve import server as wptserve, handlers
from wptserve.router import any_method
sys.path.insert(1, os.path.join(repo_root, "tools", "pywebsocket", "src"))
from mod_pywebsocket import standalone as pywebsocket

routes = [(any_method, "/tools/*", handlers.ErrorHandler(404)),
          (any_method, "/serve.py", handlers.ErrorHandler(404)),
          (any_method, "*.py", handlers.python_script_handler),
          ("GET", "*.asis", handlers.as_is_handler),
          ("GET", "*", handlers.file_handler),
          ]

rewrites = [("GET", "/resources/WebIDLParser.js", "/resources/webidl2/lib/webidl2.js")]

subdomains = [u"www",
              u"www1",
              u"www2",
              u"天気の良い日",
              u"élève"]

logger = None

def default_logger(level):
    logger = logging.getLogger("web-platform-tests")
    logging.basicConfig(level=getattr(logging, level.upper()))
    return logger

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

class ServerProc(object):
    def __init__(self, daemon):
        self.daemon = daemon
        self.stop = Event()

    def start(self):
        try:
            self.daemon.start(block=False)
            self.stop.wait()
            self.daemon.stop()
        except KeyboardInterrupt:
            pass

class ServerWrapper(object):
    def __init__(self, daemon):
        self.proc = None
        self.daemon = ServerProc(daemon)

    def start(self):
        self.proc = Process(target=self.daemon.start)
        self.proc.daemon = True
        self.proc.start()

    def wait(self):
        self.daemon.stop.set()
        self.proc.join()

    def kill(self):
        self.daemon.stop.set()
        self.proc.terminate()
        self.proc.join()

def probe_subdomains(config):
    host = config["host"]
    port, sock = get_port()
    sock.close()
    daemon = start_http_server(config, port)
    wrapper = ServerWrapper(daemon)
    wrapper.start()

    rv = {}

    for subdomain in subdomains:
        #This assumes that the tld is ascii-only or already in punycode
        punycode = subdomain.encode("idna")
        domain = "%s.%s" % (punycode, host)
        try:
            urllib2.urlopen("http://%s:%d/" % (domain, port))
        except Exception as e:
            if config["external_domain"]:
                external = "%s.%s" % (punycode, config["external_domain"])
                logger.warning("Using external server %s for subdomain %s" % (external, subdomain))
                rv[subdomain] = external
            else:
                logger.critical("Failed probing domain %s and no external fallback configured. You may need to edit /etc/hosts or similar." % domain)
                sys.exit(1)
        else:
            rv[subdomain] = "%s.%s" % (punycode, host)

    wrapper.wait()

    return rv

def start_servers(config, ports):
    servers = defaultdict(list)

    host = config["host"]

    for scheme, ports in ports.iteritems():
        assert len(ports) == {"http":2}.get(scheme, 1)

        for port, sock in ports:
            init_func = {"http":start_http_server,
                         "https":start_https_server,
                         "ws":start_ws_server,
                         "wss":start_wss_server}[scheme]

            sock.shutdown(socket.SHUT_RDWR)
            sock.close()
            daemon = init_func(config, port)

            if daemon:
                import subprocess
                wrapper = ServerWrapper(daemon)
                wrapper.start()
                logger.info("Started server at %s://%s:%s" % (scheme, config["host"], port))
                servers[scheme].append((port, wrapper))

    return servers

def start_http_server(config, port):
    return wptserve.WebTestHttpd(host=config["host"],
                                 port=port,
                                 doc_root=repo_root,
                                 rewrites=rewrites,
                                 config=config,
                                 use_ssl=False,
                                 certificate=None)

def start_https_server(config, port):
    return

class WebSocketDaemon(object):
    def __init__(self, host, port, doc_root, handlers_root, log_level):
        self.host = host
        opts, args  = pywebsocket._parse_args_and_config(["-H", host,
                                                          "-p", port,
                                                          "-d", doc_root,
                                                          "-w", handlers_root,
                                                          "--log-level", log_level])
        opts.cgi_directories = []
        opts.is_executable_method = None
        self.server = pywebsocket.WebSocketServer(opts)
        ports = [item[0].getsockname()[1] for item in self.server._sockets]
        assert all(item == ports[0] for item in ports)
        self.port = ports[0]
        self.started = False
        self.server_thread = None

    def start(self, block=False):
        logger.info("Starting websockets server on %s:%s" % (self.host, self.port))
        self.started = True
        if block:
            self.server.serve_forever()
        else:
            self.server_thread = threading.Thread(target=self.server.serve_forever)
            self.server_thread.setDaemon(True)  # don't hang on exit
            self.server_thread.start()

    def stop(self):
        """
        Stops the server.

        If the server is not running, this method has no effect.
        """
        if self.started:
            try:
                self.server.shutdown()
                self.server.server_close()
                self.server_thread.join()
                self.server_thread = None
                logger.info("Stopped websockets server on %s:%s" % (self.host, self.port))
            except AttributeError:
                pass
            self.started = False
        self.server = None

def start_ws_server(config, port):
    return WebSocketDaemon(config["host"],
                           str(port),
                           repo_root,
                           os.path.join(repo_root, "websockets", "handlers"),
                           "debug")

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

def start(config):
    ports = get_ports(config)
    domains = probe_subdomains(config)

    config_ = normalise_config(config, domains, ports)

    servers = start_servers(config_, ports)

    return config_, servers


def iter_procs(servers):
    for servers in servers.values():
        for port, server in servers:
            yield server.proc

def main():
    global logger
    with open("config.json") as f:
        config = json.load(f)

    logger = default_logger(config["log_level"])

    config_, servers = start(config)

    try:
        while any(item.is_alive() for item in iter_procs(servers)):
            for item in iter_procs(servers):
                item.join(1)
    except KeyboardInterrupt:
        logger.info("Shutting down")

if __name__ == "__main__":
    main()
