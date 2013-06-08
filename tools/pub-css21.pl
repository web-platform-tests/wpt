#!/usr/bin/perl
# prep-css21
# Script for cleaning up the repository prior to building the CSS2.1 test suite.

use File::Path;

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
#  visudet/anonymous-block-not-containing-block-001.xhtml - pending spec changes

#push @dirs, 'contributors/bzbarsky/submitted/css2.1/visuren';
push @dirs, 'contributors/bzbarsky/submitted/css2.1/tables';
push @dirs, 'contributors/bzbarsky/submitted/css2.1/box';
#push @dirs, 'contributors/bzbarsky/submitted/css2.1/run-in';

###############################################################################
# John Daggett
# submitted/fontreftests/

push @dirs, 'contributors/mozilla/submitted/fontreftests';

###############################################################################
# David Baron
# submitted/first-letter-characters/

push @dirs, 'contributors/mozilla/submitted/first-letter-characters';

###############################################################################
# Mozilla
# Managed auto-import from mozilla.org repos

push @dirs, 'contributors/mozilla/submitted/css2.1/*';
push @dirs, 'contributors/mozilla/submitted/mozilla-central-reftests/css21/pagination';

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

#push @dirs, 'contributors/hixie/submitted/css2.1/[bcfgmptuvz]*';
#push @dirs, 'contributors/hixie/submitted/css2.1/selector';
#push @dirs, 'contributors/hixie/submitted/css2.1/syndata';
push @dirs, 'contributors/hixie/submitted/css2.1-reftests/*';

###############################################################################
# i18n WG (Richard Ishida)

push @dirs, 'contributors/i18n/submitted/css2.1/syndata';
push @dirs, 'contributors/i18n/submitted/css2.1/visuren';

###############################################################################
# James Hopkins

push @dirs, 'contributors/jameshopkins/submitted/css2.1/*';

###############################################################################
# Hewlett-Packard

# push @dirs, 'contributors/hp/submitted/css2.1/page';

###############################################################################
# fantasai

# push @dirs, 'contributors/fantasai/submitted/css2.1';
push @dirs, 'contributors/fantasai/submitted/css2.1/backgrounds';

###############################################################################
# CSSWG Issues

push @dirs, 'contributors/csswg-issues/submitted/css2.1';


###############################################################################
# Microsoft

#push @dirs, 'contributors/microsoft/submitted'; # grab support files
#push @dirs, 'contributors/microsoft/submitted/Chapter*';
#print `perl -pi -e 's#\.\./support/#support/#g' contributors/microsoft/submitted/Chapter*/*.xht contributors/microsoft/submitted/support/*.css`;

###############################################################################
# Opera
# push @dirs, 'contributors/gsnedders/submitted/css2.1/reftest.list';

$dirlist = join ' ', @dirs;
print `python tools/build-css21.py $dirlist 2>&1`;
print `find dist/css2.1 -type f -exec chmod 644 {} \\;`;
#print `perl -pi -e 's#support/#\.\./support/#g' contributors/microsoft/submitted/Chapter*/*.xht contributors/microsoft/submitted/support/*.css`;

# Copy .html tests from i18n/specialformats and gtalbot/*.html
