import unittest

import websockets
import websockets.client
import websockets.exceptions
import websockets.legacy.auth
import websockets.legacy.client
import websockets.legacy.protocol
import websockets.legacy.server
import websockets.server
import websockets.typing
import websockets.uri


combined_exports = (
    websockets.legacy.auth.__all__
    + websockets.legacy.client.__all__
    + websockets.legacy.protocol.__all__
    + websockets.legacy.server.__all__
    + websockets.client.__all__
    + websockets.exceptions.__all__
    + websockets.server.__all__
    + websockets.typing.__all__
    + websockets.uri.__all__
)


class TestExportsAllSubmodules(unittest.TestCase):
    def test_top_level_module_reexports_all_submodule_exports(self):
        self.assertEqual(set(combined_exports), set(websockets.__all__))

    def test_submodule_exports_are_globally_unique(self):
        self.assertEqual(len(set(combined_exports)), len(combined_exports))
