from ..file import load
from ..schema import WebFeatureYMLFile, FeatureEntry, SpecialFileEnum
import io
import unittest
class TestFile(unittest.TestCase):
    def test_load_valid_yml(self):  
        input_buffer = io.StringIO("""
features:
- name: feature1
  files: "**"
                                   """)
        expected_file = WebFeatureYMLFile(
            features=[
                FeatureEntry(name="feature1", files=SpecialFileEnum.RECURSIVE)
            ]
        )
        actual_file = load(input_buffer)
        self.assertEqual(expected_file, actual_file)
if __name__ == '__main__':
    unittest.main()