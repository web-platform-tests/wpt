function FindProxyForURL(url, host) {
    if (dnsDomainIs(host, '.wpt.test')) {
        return "PROXY {{ipaddress}}:{{ports[http][0]}}"
    }

    return "DIRECT";
}
