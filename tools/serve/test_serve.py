from six import text_type

from . import serve

def test_make_hosts_file():
    c = serve.Config(
        browser_host=u"foo.bar",
        alternate_hosts={u"alt": u"foo2.bar"}
    )
    c.subdomains = {u"a", u"b", u"\u00E9"}
    c.not_subdomains = {u"x", u"y"}
    hosts = serve.make_hosts_file(c, "192.168.42.42")
    assert isinstance(hosts, text_type), type(hosts)
    lines = hosts.split(u"\n")
    assert set(lines) == {u"",
                          u"0.0.0.0\tx.foo.bar",
                          u"0.0.0.0\tx.foo2.bar",
                          u"0.0.0.0\ty.foo.bar",
                          u"0.0.0.0\ty.foo2.bar",
                          u"192.168.42.42\tfoo.bar",
                          u"192.168.42.42\tfoo2.bar",
                          u"192.168.42.42\ta.foo.bar",
                          u"192.168.42.42\ta.foo2.bar",
                          u"192.168.42.42\tb.foo.bar",
                          u"192.168.42.42\tb.foo2.bar",
                          u"192.168.42.42\txn--9ca.foo.bar",
                          u"192.168.42.42\txn--9ca.foo2.bar"}
    assert lines[-1] == u""
