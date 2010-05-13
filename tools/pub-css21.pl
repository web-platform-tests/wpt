#!/usr/bin/perl
# prep-css21
# Script for cleaning up the repository prior to building the CSS2.1 test suite.

use File::Path;

rmtree('dist/css2.1');

# approved/ directory is ready already and built automatically


@dirs = (); # extra (unreviewed test) directories

# Prep by Contributor:

###############################################################################
# Apple - No CSS2.1 tests

###############################################################################
# Tim Boland - Not used

###############################################################################
# Boris Zbarsky
# submitted/css2.1/
#  box/ - all reftests
#  run-in/ - all reftests
#  table/ - needs HTML->XHTML conversion
#  visudet/anonymous-block-not-containing-block-001.xhtml - pending spec changes
#  visuren/* - all selftests, but r-

push @dirs, 'contributors/bzbarsky/submitted/css2.1/visuren';
push @dirs, 'contributors/bzbarsky/submitted/css2.1/box/reftest.list';
push @dirs, 'contributors/bzbarsky/submitted/css2.1/run-in/reftest.list';

###############################################################################
# Eira Monstad
# submitted/css2.1/* - all selftests, r=arronei?

push @dirs, 'contributors/eira/submitted/css2.1/*';

###############################################################################
# Gabriele Romanato
# all selftests

push @dirs, 'contributors/gabriele/submitted/basic/sec5';

###############################################################################
# Gérard Talbot
# all selftests

push @dirs, 'contributors/gtalbot/submitted';

###############################################################################
# Ian Hickson
# Pending metadata
# Pending XHTML conversion
# Pending filename conversion


###############################################################################
# James Hopkins

push @dirs, 'contributors/jameshopkins/submitted/css2.1/*';

###############################################################################
# Microsoft

push @dirs, 'contributors/microsoft/submitted'; # grab support files
push @dirs, 'contributors/microsoft/submitted/Chapter*';
#print `perl -pi -e 's#\.\./support/#support/#g' contributors/microsoft/submitted/Chapter*/*.xht contributors/microsoft/submitted/support/*.css`;

$dirlist = join ' ', @dirs;
print `python tools/build-css21.py $dirlist`;
#find -type f | xargs chmod 644
