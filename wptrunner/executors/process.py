from .base import TestExecutor


class ProcessTestExecutor(TestExecutor):
    def __init__(self, *args, **kwargs):
        TestExecutor.__init__(self, *args, **kwargs)
        self.binary = self.browser.binary

    def setup(self, runner):
        self.runner = runner
        self.runner.send_message("init_succeeded")
        return True

    def is_alive(self):
        return True

    def run_test(self, test):
        raise NotImplementedError
