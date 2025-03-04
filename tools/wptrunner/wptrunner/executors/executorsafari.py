# mypy: allow-untyped-defs

from .executorwebdriver import (
    WebDriverProtocol,
    WebDriverTestharnessExecutor
)

class SafariDriverProtocol(WebDriverProtocol):
    implements = []
    for base_part in WebDriverProtocol.implements:
        if base_part.name not in {part.name for part in implements}:
            implements.append(base_part)

    def load_extension(self, payload):
        # The endpoint does not work for me in Safari. Mocking it for now.
        return {"extension": "1"}
        # return self.webdriver.send_session_command("POST", "webextension", payload["extensionData"])
    
    def unload_extension(self, payload):
        # The endpoint does not work for me in Safari. Mocking it for now.
        return {}
        # return self.webdriver.send_session_command("DELETE", "webextension/%s" % payload["extension"])

class SafariDriverTestharnessExecutor(WebDriverTestharnessExecutor):

    def __init__(self, *args, **kwargs):
        self.protocol_cls = SafariDriverProtocol
        super().__init__(*args, **kwargs)
