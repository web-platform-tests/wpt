#!/usr/bin/perl
# pub-css3-conditional
# Script for cleaning up the repository prior to building the CSS Conditional test suite.

use File::Path;

rmtree('dist/css3-conditional');

# approved/ directory is ready already and built automatically


@dirs = (); # extra (unreviewed test) directories

# Prep by Contributor:

###############################################################################
# Adobe

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
push @dirs, 'contributors/mozilla/submitted/css3-conditional';
push @dirs, 'contributors/mozilla/submitted/mozilla-central-reftests/conditional3';
    
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
push @dirs, 'contributors/opera/submitted/css3-conditional';
push @dirs, 'contributors/opera/submitted/css3-conditional/js';

###############################################################################

$dirlist = join ' ', @dirs;
print `python tools/build-css3-conditional.py $dirlist 2>&1`;
print `find dist/css3-conditional -type f -exec chmod 644 {} \\;`;

