function make_absolute_url(options) {
    var loc = window.location;
    var protocol = get(options, "protocol", loc.protocol);
    if (protocol[protocol.length - 1] != ":") {
        protocol += ":";
    }

    var hostname = get(options, "hostname", loc.hostname);

    var subdomain = get(options, "subdomain");
    if (subdomain) {
        hostname = subdomain + "." + hostname;
    }

    var port = get(options, "port", loc.port)
    var path = get(options, "path", loc.pathname);
    var query = get(options, "query", loc.search);
    var hash = get(options, "hash", loc.hash)

    var url = protocol + "//" + hostname;
    if (port) {
        url += ":" + port;
    }

    if (path[0] != "/") {
        url += "/";
    }
    url += path;
    if (query) {
        if (query[0] != "?") {
            url += "?";
        }
        url += query;
    }
    if (hash) {
        if (hash[0] != "#") {
            url += "#";
        }
        url += hash;
    }
    return url;
}

function get(obj, name, default_val) {
    if (obj.hasOwnProperty(name)) {
        return obj[name];
    }
    return default_val;
}
