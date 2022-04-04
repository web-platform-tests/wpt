import email.utils
import unittest


DATE = email.utils.formatdate(usegmt=True)


class GeneratorTestCase(unittest.TestCase):
    def assertGeneratorRunning(self, gen):
        """
        Check that a generator-based coroutine hasn't completed yet.

        """
        next(gen)

    def assertGeneratorReturns(self, gen):
        """
        Check that a generator-based coroutine completes and return its value.

        """
        with self.assertRaises(StopIteration) as raised:
            next(gen)
        return raised.exception.value
