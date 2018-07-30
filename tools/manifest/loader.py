import json
import os

from . import log
from . import manifest
from . import update
from .download import download_from_github


class ManifestLoader(object):
    def __init__(self, logger, test_paths, force_manifest_update=False, manifest_download=False,
                 types=None, meta_filters=None):
        self.test_paths = test_paths
        self.force_manifest_update = force_manifest_update
        self.manifest_download = manifest_download
        self.types = types
        self.meta_filters = meta_filters or []
        self.logger = logger

    def load(self):
        rv = {}
        for url_base, paths in self.test_paths.iteritems():
            manifest_file = self.load_manifest(url_base=url_base,
                                               **paths)
            path_data = {"url_base": url_base}
            path_data.update(paths)
            rv[manifest_file] = path_data
        return rv

    def create_manifest(self, manifest_path, tests_path, url_base="/"):
        self.update_manifest(manifest_path, tests_path, url_base,
                             recreate=True, download=self.manifest_download)

    def update_manifest(self, manifest_path, tests_path, url_base="/",
                        recreate=False, download=False):
        self.logger.info("Updating test manifest %s" % manifest_path)

        json_data = None
        if download:
            # TODO: make this not github-specific
            download_from_github(manifest_path, tests_path)

        if not recreate:
            try:
                with open(manifest_path) as f:
                    json_data = json.load(f)
            except IOError:
                self.logger.info("Unable to find test manifest")
            except ValueError:
                self.logger.info("Unable to parse test manifest")

        if not json_data:
            self.logger.info("Creating test manifest")
            manifest_file = manifest.Manifest(url_base)
        else:
            try:
                manifest_file = manifest.Manifest.from_json(tests_path, json_data)
            except manifest.ManifestVersionMismatch:
                manifest_file = manifest.Manifest(url_base)

        update.update(tests_path, manifest_file, True)

        manifest.write(manifest_file, manifest_path)

    def load_manifest(self, tests_path, manifest_path, url_base="/", **kwargs):
        if (not os.path.exists(manifest_path) or
            self.force_manifest_update):
            self.update_manifest(manifest_path, tests_path, url_base,
                                 download=self.manifest_download)
        manifest_file = manifest.load(tests_path, manifest_path,
                                      types=self.types,
                                      meta_filters=self.meta_filters)
        if manifest_file.url_base != url_base:
            self.logger.info("Updating url_base in manifest from %s to %s" %
                             (manifest_file.url_base, url_base))
            manifest_file.url_base = url_base
            manifest.write(manifest_file, manifest_path)

        return manifest_file
