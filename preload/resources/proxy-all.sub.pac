function FindProxyForURL(url, host) {
    return "PROXY 127.0.0.1:{{ports[http][0]}}";
}
