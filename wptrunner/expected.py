# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import os


def expected_path(metadata_path, test_path):
    args = list(test_path.split("/"))
    args[-1] += ".ini"
    return os.path.join(metadata_path, *args)
