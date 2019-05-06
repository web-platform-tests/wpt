from ..webdriver_server import ChromiumEdgeDriverServer
from .base import WdspecExecutor, WebDriverProtocol


class ChromiumEdgeDriverProtocol(WebDriverProtocol):
    server_cls = ChromiumEdgeDriverServer


class ChromiumEdgeDriverWdspecExecutor(WdspecExecutor):
    protocol_cls = ChromiumEdgeDriverProtocol
