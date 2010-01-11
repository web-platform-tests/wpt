#!/usr/bin/python

# This file is licensed under CC Zero

import os
from os.path import join
import shutil
import filecmp

# Files to not sync across support/ directories
excludes = ('README')

def propagate(source, dest, errors):
  """Compare each file and copy from source to destination.
     Do nothing and flag an error if the destination already exists
     but is different. Recurse.
     source and dest are both directory paths.
     errors is a list of 2-element tuples, the first being a
       source filepath and the second a destination filepath,
       of file pairs where the destination isdifferent from
  """

  # Get the file and directory lists for source
  root, dirs, files = os.walk(source).next()
  # Copy over the file if it needs copying
  for name in files:
    if name in excludes:
      continue;
    origin = join(source, name)
    copy = join(dest, name)
    if not os.path.exists(copy): # file missing
      shutil.copy2(origin, copy) # copy it over
    elif not filecmp.cmp(origin, copy): # files differ
      if not filecmp.cmp(origin, copy, True): # contents equal, stats differ
        shutil.copystat(origin, copy) # update stats so they match for next time
      else: # contents differ
        errors.append((origin, copy))
  # Duplicate the directory structure and propagate the subtree
  for name in dirs:
    origin = join(source, name)
    copy = join(dest, name)
    if not os.path.exists(copy):
      os.mkdirs(copy)
    propagate(origin, copy, errors)

def waterfall(parentDir, childDir, errors):
  """Copy down support files from parent support to child.
     parentDir is the parent of the parent support directory.
     childDir is the parent of the current support directory,
     that we should copy into.
     waterfall recurses into childDir's children."""
  assert os.path.exists(join(parentDir, 'support')), join(parentDir, 'support') + " doesn't exist\n"
  if os.path.exists(join(childDir, 'support')):
    dirs = os.walk(join(dir, 'support')).next()[1]
    for child in dirs:
      if child == 'support':
        propagate(join(parentDir, 'support'), join(childDir, 'support'), errors)
      else:
        waterfall(childDir, child, errors)

def outline(source, dest, errors):
  """Copy over directory structure and all files under any support/ directories
     source and dest are both directory paths.
     errors is a list of 2-element tuples, the first being a
       source filepath and the second a destination filepath,
       of support file pairs where the destination copy is
       different from the source
  """
  # Get the directory list for source
  dirs = os.walk(source).next()[1]
  # Copy directory structure
  for name in dirs:
    origin = join(source, name)
    copy = join(dest, name)
    if not os.path.exists(copy):
      os.mkdirs(copy)
    if name == 'support':
      # Copy support files
      propagate(origin, copy, errors)
    else:
      outline(origin, copy, errors)

def copySupport(source, dest, errors):
  """For each support directory in dest, propagate the corresponding support
     files from source.
     source and dest are both directory paths.
     errors is a list of 2-element tuples, the first being a
       source filepath and the second a destination filepath,
       of support file pairs where the destination copy is
       different from the source
  """
  # Get the directory list for est
  dirs = os.walk(dest).next()[1]
  # Scan directory structure, building support dirs as necessary
  for name in dirs:
    master = join(source, name)
    slave  = join(dest, name)
    if name == 'support':
      # Copy support files
      propagate(master, slave, errors)
    else:
      copySupport(master, slave, errors)

def main():
  # Part I: Propagate support files through approved/

  errors = []
  root, dirs, _ = os.walk('.').next()
  if 'approved' in dirs:
    suites = os.walk('approved').next()[1]
    for suite in suites:
      waterfall(root, join(root, suite, 'src'), errors)
  else:
    print "Failed to find approved/ directory.\n"
    exit();

  # Part II: Propagate test suite support files into contributors/

  if 'contributors' in dirs:
    contribRoot, contribs, _ = os.walk('contributors').next()
    for contrib in contribs:
      dirs = os.walk(join(contribRoot, contrib)).next()[1]
      for dir in dirs:
        if dir in suites: # contributor has a directory name matching one of our suites
          suiteRoot = join(root, 'approved', dir, 'src')
          if os.path.exists(suiteRoot):
            copySupport(join(contribRoot, dir), suiteRoot)
  else:
    print "Failed to find contributors/ directory.\n"

  # Print all errors

  for error in errors:
    print "Mismatch: " + error[0] + " vs " + error [1] + " Copy failed.\n"

if __name__ == "__main__":
  main()
