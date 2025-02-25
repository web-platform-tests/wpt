# mypy: allow-untyped-defs

from .executorwebdriver import (
    WebDriverBidiWebExtensionProtocolPart,
    WebDriverProtocol,
    WebDriverTestharnessExecutor
)

class SafariDriverProtocol(WebDriverProtocol):
    implements = [
        WebDriverBidiWebExtensionProtocolPart,
    ]
    for base_part in WebDriverProtocol.implements:
        if base_part.name not in {part.name for part in implements}:
            implements.append(base_part)


class SafariDriverTestharnessExecutor(WebDriverTestharnessExecutor):

    def __init__(self, *args, **kwargs):
        self.protocol_cls = SafariDriverProtocol
        super().__init__(*args, **kwargs)
