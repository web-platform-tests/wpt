# mypy: allow-untyped-defs


class BidiSessionSubscribeAction:
    name = "bidi.session.subscribe"

    def __init__(self, logger, protocol):
        self.logger = logger
        self.protocol = protocol

    async def __call__(self, payload):
        events = payload["events"]
        contexts = [c["window-fcc6-11e5-b4f8-330a88ab9d7f"] if isinstance(c, dict) else c for c in payload["contexts"]]
        return await self.protocol.bidi_events.subscribe(events, contexts)


async_actions = [BidiSessionSubscribeAction]
