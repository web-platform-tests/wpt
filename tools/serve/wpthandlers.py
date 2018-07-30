import cgi
import itertools
import os
from six.moves.urllib.parse import quote, urljoin, urlsplit

from wptserve import handlers
from manifest import loader


class FileHandler(handlers.FileHandler):
    def __init__(self, config, base_path=None, url_base="/"):
        self.base_path = base_path
        self.url_base = url_base
        self.directory_handler = ManifestDirectoryHandler(config,
                                                          self.base_path,
                                                          self.url_base)


class ManifestDirectoryHandler(handlers.DirectoryHandler):
    """Directory listing that gets the relevant data from the
    wpt MANIFEST.json file(s)"""

    # This is a class attribute so we can share the data between instances
    # That's needed because each url_base has a seperate instance of this
    # class.
    by_dir = {}

    def __init__(self, config, base_path=None, url_base="/"):
        self.process_manifest(config, url_base)
        self.base_path = base_path
        self.url_base = url_base

    def process_manifest(self, config, url_base):
        config.logger.info("Loading manifest data")
        if url_base not in config.test_paths:
            return

        test_paths = {url_base: config.test_paths[url_base]}
        manifests = loader.ManifestLoader(config.logger,
                                          test_paths,
                                          force_manifest_update=config.manifest_update,
                                          manifest_download=config.manifest_update).load()
        for manifest in manifests:
            for item_type, path, tests in manifest:
                for test in tests:
                    if hasattr(test, "url"):
                        url_parts = urlsplit(test.url)
                    else:
                        url_parts = urlsplit("/" + test.path.replace(os.path.sep, "/"))
                    url_path = url_parts.path
                    is_last = True
                    while url_path:
                        test_dir, name = url_path.rsplit("/", 1)

                        if test_dir not in self.by_dir:
                            self.by_dir[test_dir] = (set(), [])

                        if not is_last:
                            if name not in self.by_dir[test_dir][0]:
                                self.by_dir[test_dir][0].add(name)
                            else:
                                break
                        else:
                            if url_parts.query:
                                name += ("?" + url_parts.query)
                            if url_parts.fragment:
                                name += ("#" + url_parts.fragment)
                            self.by_dir[test_dir][1].append(name)
                        is_last = False
                        url_path = test_dir

    def __repr__(self):
        return "<%s base_path:%s url_base:%s>" % (self.__class__.__name__, self.base_path, self.url_base)

    def __call__(self, request, response):
        url_path = request.url_parts.path

        if not url_path.endswith("/"):
            response.status = 301
            response.headers = [("Location", "%s/" % request.url)]
            return

        dir_path = url_path[:-1]

        response.headers = [("Content-Type", "text/html")]
        response.content = """<!doctype html>
<meta name="viewport" content="width=device-width">
<title>Directory listing for %(path)s</title>
<h1>Directory listing for %(path)s</h1>
<ul>
%(items)s
</ul>
""" % {"path": cgi.escape(url_path),
       "items": "\n".join(self.list_items(dir_path))}  # flake8: noqa

    def list_items(self, dir_path):
        dirs, tests = self.by_dir[dir_path]

        if dir_path:
            link = urljoin(dir_path, "..")
            yield ("""<li class="dir"><a href="%(link)s">%(name)s</a></li>""" %
                   {"link": link, "name": ".."})
        for item, is_dir in itertools.chain(((item, True) for item in sorted(dirs)),
                                            ((item, False) for item in sorted(tests))):
            link = cgi.escape(quote(item))
            if is_dir:
                link += "/"
                class_ = "dir"
            else:
                class_ = "file"
            yield ("""<li class="%(class)s"><a href="%(link)s">%(name)s</a></li>""" %
                   {"link": link, "name": cgi.escape(item), "class": class_})
