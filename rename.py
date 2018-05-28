import sys
import os

path = sys.argv[1]
path_minus_owner = path.split('/')[:-1]
path_minus_owner.append('REVIEWERS')
new_path = '/'.join(path_minus_owner)

os.rename(path, new_path)