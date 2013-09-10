#!/usr/bin/perl
# prep-css3-multicol
# Script for cleaning up the repository prior to building the CSS3 Multicol test suite.

use File::Path;

rmtree('dist/css3-multicol');

# approved/ directory is ready already and built automatically


@dirs = (); # extra (unreviewed test) directories

# Prep by Contributor:

###############################################################################
# Apple - No CSS2.1 tests

###############################################################################
# Tim Boland - Not used

###############################################################################
# Boris Zbarsky

###############################################################################
# John Daggett

###############################################################################
# David Baron

###############################################################################
# Mozilla
push @dirs, 'contributors/mozilla/submitted/mozilla-central-reftests/multicol3';

###############################################################################
# Eira Monstad

###############################################################################
# Gabriele Romanato

###############################################################################
# Gérard Talbot

push @dirs, 'contributors/gtalbot/submitted';

###############################################################################
# Ian Hickson

###############################################################################
# i18n WG (Richard Ishida)

###############################################################################
# James Hopkins

###############################################################################
# Hewlett-Packard

###############################################################################
# fantasai

###############################################################################
# CSSWG Issues

###############################################################################
# Microsoft

###############################################################################
# Opera
push @dirs, 'contributors/howcome/submitted';
push @dirs, 'contributors/opera/submitted/multicol';

###############################################################################

$dirlist = join ' ', @dirs;
print `python tools/build-css3-multicol.py $dirlist 2>&1`;
print `find dist/css3-multicol -type f -exec chmod 644 {} \\;`;

