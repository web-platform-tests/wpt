#!/usr/bin/perl
# prep-css3-background
# Script for cleaning up the repository prior to building the CSS Backgronds and Borders test suite.

use File::Path;

rmtree('dist/css3-background');

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
push @dirs, 'contributors/mozilla/submitted/css3-background/background-size/vector';
push @dirs, 'contributors/mozilla/submitted/css3-background/box-shadow';

###############################################################################
# Eira Monstad

###############################################################################
# Gabriele Romanato

###############################################################################
# Gérard Talbot

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
push @dirs, 'contributors/fantasai/submitted/css2.1/backgrounds';

###############################################################################
# CSSWG Issues

###############################################################################
# Microsoft

###############################################################################
# Opera

###############################################################################
# Nokia
push @dirs, 'contributors/nokia/submitted/css3-backgrounds';

###############################################################################

$dirlist = join ' ', @dirs;
print `python tools/build-css3-background.py $dirlist 2>&1`;
print `find dist/css3-background -type f -exec chmod 644 {} \\;`;

