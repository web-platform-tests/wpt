# mypy: allow-untyped-defs
import sys

from typing import Dict, List, Literal, Optional, Union


# TODO: check if type annotation is supported by all the required versions of Python.
# noinspection PyCompatibility
class WindowProxyProperties(Dict):
    context: str


# TODO: check if type annotation is supported by all the required versions of Python.
# noinspection PyCompatibility
class WindowProxyRemoteValue(Dict):
    """
    WebDriver BiDi browsing context descriptor.
    """
    type: Literal["window"]
    value: WindowProxyProperties


class BidiSessionSubscribeAction:
    name = "bidi.session.subscribe"

    # TODO: check if type annotation is supported by all the required versions of Python.
    # noinspection PyCompatibility
    class Payload(Dict):
        """
        Payload for the "bidi.session.subscribe" action.
        events: List of event names to subscribe to.
        contexts: Optional list of browsing contexts to subscribe to. Each context can be either a BiDi serialized value,
        or a string. The latter is considered as a browsing context id.
        """
        events: List[str]
        contexts: Optional[List[Union[str, WindowProxyRemoteValue]]]

    def __init__(self, logger, protocol):
        self.logger = logger
        self.protocol = protocol

    async def __call__(self, payload: Payload):
        events = payload["events"]
        contexts = None
        if payload["contexts"] is not None:
            contexts = []
            for c in payload["contexts"]:
                if isinstance(c, str):
                    contexts.append(c)
                elif isinstance(c, dict) and "type" in c and c["type"] == "window":
                    contexts.append(c["value"]["context"])
                else:
                    raise ValueError("Unexpected context type: %s" % c)
        return await self.protocol.bidi_events.subscribe(events, contexts)


async_actions = [BidiSessionSubscribeAction]
