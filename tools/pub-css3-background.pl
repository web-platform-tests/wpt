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
push @dirs, 'contributors/mozilla/submitted/css3-background/background-size/vector/empty';
push @dirs, 'contributors/mozilla/submitted/css3-background/box-shadow';

###############################################################################
# Eira Monstad

###############################################################################
# Gabriele Romanato

###############################################################################
# Gérard Talbot

###############################################################################
# Google
push @dirs, 'contributors/google/submitted/';

###############################################################################
# Ian Hickson

###############################################################################
# i18n WG (Richard Ishida)

###############################################################################
# Intel
push @dirs, 'contributors/intel/submitted/css3-background';

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
# Nokia
push @dirs, 'contributors/nokia/submitted/css3-backgrounds';

###############################################################################
# Opera

###############################################################################
# rwalker
# push @dirs, 'contributors/rwalker/submitted'; - build error

###############################################################################
# TTWF
push @dirs, 'contributors/ttwf/emalasky/submitted/css3-background';
push @dirs, 'contributors/ttwf/jeffreyatw/submitted/css3-background/background-repeat';
push @dirs, 'contributors/ttwf/jeffreyatw/submitted/css3-background/background-size';
push @dirs, 'contributors/ttwf/mejarc/submitted';
push @dirs, 'contributors/ttwf/silverma/submitted';

###############################################################################

$dirlist = join ' ', @dirs;
print `python tools/build-css3-background.py $dirlist 2>&1`;
print `find dist/css3-background -type f -exec chmod 644 {} \\;`;

