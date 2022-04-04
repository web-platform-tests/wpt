from websockets.streams import StreamReader

from .utils import GeneratorTestCase


class StreamReaderTests(GeneratorTestCase):
    def setUp(self):
        self.reader = StreamReader()

    def test_read_line(self):
        self.reader.feed_data(b"spam\neggs\n")

        gen = self.reader.read_line()
        line = self.assertGeneratorReturns(gen)
        self.assertEqual(line, b"spam\n")

        gen = self.reader.read_line()
        line = self.assertGeneratorReturns(gen)
        self.assertEqual(line, b"eggs\n")

    def test_read_line_need_more_data(self):
        self.reader.feed_data(b"spa")

        gen = self.reader.read_line()
        self.assertGeneratorRunning(gen)
        self.reader.feed_data(b"m\neg")
        line = self.assertGeneratorReturns(gen)
        self.assertEqual(line, b"spam\n")

        gen = self.reader.read_line()
        self.assertGeneratorRunning(gen)
        self.reader.feed_data(b"gs\n")
        line = self.assertGeneratorReturns(gen)
        self.assertEqual(line, b"eggs\n")

    def test_read_line_not_enough_data(self):
        self.reader.feed_data(b"spa")
        self.reader.feed_eof()

        gen = self.reader.read_line()
        with self.assertRaises(EOFError) as raised:
            next(gen)
        self.assertEqual(
            str(raised.exception), "stream ends after 3 bytes, before end of line"
        )

    def test_read_exact(self):
        self.reader.feed_data(b"spameggs")

        gen = self.reader.read_exact(4)
        data = self.assertGeneratorReturns(gen)
        self.assertEqual(data, b"spam")

        gen = self.reader.read_exact(4)
        data = self.assertGeneratorReturns(gen)
        self.assertEqual(data, b"eggs")

    def test_read_exact_need_more_data(self):
        self.reader.feed_data(b"spa")

        gen = self.reader.read_exact(4)
        self.assertGeneratorRunning(gen)
        self.reader.feed_data(b"meg")
        data = self.assertGeneratorReturns(gen)
        self.assertEqual(data, b"spam")

        gen = self.reader.read_exact(4)
        self.assertGeneratorRunning(gen)
        self.reader.feed_data(b"gs")
        data = self.assertGeneratorReturns(gen)
        self.assertEqual(data, b"eggs")

    def test_read_exact_not_enough_data(self):
        self.reader.feed_data(b"spa")
        self.reader.feed_eof()

        gen = self.reader.read_exact(4)
        with self.assertRaises(EOFError) as raised:
            next(gen)
        self.assertEqual(
            str(raised.exception), "stream ends after 3 bytes, expected 4 bytes"
        )

    def test_read_to_eof(self):
        gen = self.reader.read_to_eof()

        self.reader.feed_data(b"spam")
        self.assertGeneratorRunning(gen)

        self.reader.feed_eof()
        data = self.assertGeneratorReturns(gen)
        self.assertEqual(data, b"spam")

    def test_read_to_eof_at_eof(self):
        self.reader.feed_eof()

        gen = self.reader.read_to_eof()
        data = self.assertGeneratorReturns(gen)
        self.assertEqual(data, b"")

    def test_at_eof_after_feed_data(self):
        gen = self.reader.at_eof()
        self.assertGeneratorRunning(gen)
        self.reader.feed_data(b"spam")
        eof = self.assertGeneratorReturns(gen)
        self.assertFalse(eof)

    def test_at_eof_after_feed_eof(self):
        gen = self.reader.at_eof()
        self.assertGeneratorRunning(gen)
        self.reader.feed_eof()
        eof = self.assertGeneratorReturns(gen)
        self.assertTrue(eof)

    def test_feed_data_after_feed_data(self):
        self.reader.feed_data(b"spam")
        self.reader.feed_data(b"eggs")

        gen = self.reader.read_exact(8)
        data = self.assertGeneratorReturns(gen)
        self.assertEqual(data, b"spameggs")
        gen = self.reader.at_eof()
        self.assertGeneratorRunning(gen)

    def test_feed_eof_after_feed_data(self):
        self.reader.feed_data(b"spam")
        self.reader.feed_eof()

        gen = self.reader.read_exact(4)
        data = self.assertGeneratorReturns(gen)
        self.assertEqual(data, b"spam")
        gen = self.reader.at_eof()
        eof = self.assertGeneratorReturns(gen)
        self.assertTrue(eof)

    def test_feed_data_after_feed_eof(self):
        self.reader.feed_eof()
        with self.assertRaises(EOFError) as raised:
            self.reader.feed_data(b"spam")
        self.assertEqual(str(raised.exception), "stream ended")

    def test_feed_eof_after_feed_eof(self):
        self.reader.feed_eof()
        with self.assertRaises(EOFError) as raised:
            self.reader.feed_eof()
        self.assertEqual(str(raised.exception), "stream ended")
