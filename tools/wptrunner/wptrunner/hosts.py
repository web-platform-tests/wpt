def make_hosts_file(domains, host):
    rv = []
    for domain in domains.values():
        rv.append("%s\t%s\n" % (host, domain))
    return "".join(rv)

