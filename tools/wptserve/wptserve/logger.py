class NoOpLogger(object):
    def critical(self, msg: str) -> None:
        pass

    def error(self, msg: str) -> None:
        pass

    def info(self, msg: str) -> None:
        pass

    def warning(self, msg: str) -> None:
        pass

    def debug(self, msg: str) -> None:
        pass

logger: object = NoOpLogger()
_set_logger = False

def set_logger(new_logger: object) -> None:
    global _set_logger
    if _set_logger:
        raise Exception("Logger must be set at most once")
    global logger
    logger = new_logger
    _set_logger = True

def get_logger() -> object:
    return logger
