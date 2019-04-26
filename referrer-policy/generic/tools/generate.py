#!/usr/bin/env python

import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'common', 'security-features', 'tools'))
import generate


class ReferrerPolicyConfig(object):
  def __init__(self):
    self.selection_pattern = \
      '%(subresource)s/%(source_context)s.%(delivery_method)s/%(delivery_value)s/' + \
      '%(origin)s.%(redirection)s.%(source_protocol)s'

    self.test_file_path_pattern = 'gen/' + self.selection_pattern + '.html'

    self.test_description_template = '''TBD'''

    self.test_page_title_template = 'Referrer-Policy: %s'

    self.helper_js = '/referrer-policy/generic/referrer-policy-test-case-new.js?pipe=sub'

    # For debug target only.
    self.sanity_checker_js = '/referrer-policy/generic/sanity-checker.js'
    self.spec_json_js = '/referrer-policy/spec_json.js'

    self.test_case_name = 'TestCase'

    script_directory = os.path.dirname(os.path.abspath(__file__))
    self.spec_directory = os.path.abspath(os.path.join(script_directory, '..', '..'))


if __name__ == '__main__':
    generate.main(ReferrerPolicyConfig())
