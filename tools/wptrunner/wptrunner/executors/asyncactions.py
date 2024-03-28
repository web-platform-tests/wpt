# mypy: allow-untyped-defs


class BidiSessionSubscribeAction:
    name = "bidi.session.subscribe"

    def __init__(self, logger, protocol):
        self.logger = logger
        self.protocol = protocol

    async def __call__(self, payload):
        self.logger.debug("Subscribing to event: %s" % payload["events"])
        return await self.protocol.bidi_events.subscribe(payload["events"])


class BidiSessionUnsubscribeAction:
    name = "bidi.session.unsubscribe"

    def __init__(self, logger, protocol):
        self.logger = logger
        self.protocol = protocol

    async def __call__(self, payload):
        self.logger.debug("Unsubscribing from events: %s" % payload["events"])
        return await self.protocol.bidi_events.unsubscribe(payload["events"])


async_actions = [BidiSessionSubscribeAction,
                 BidiSessionUnsubscribeAction]
