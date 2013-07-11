#!/usr/bin/perl
# pub-css3-fonts
# Script for cleaning up the repository prior to building the CSS Fonts test suite.

use File::Path;

rmtree('dist/css3-fonts');

@dirs = (); # extra directories


# approved/ directory is ready already and built automatically

# other approved directories with tests
push @dirs, 'approved/css2.1/src/backgrounds/';
push @dirs, 'approved/css2.1/src/css1/';
push @dirs, 'approved/css2.1/src/fonts/';
push @dirs, 'approved/css3-box/src/';



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
push @dirs, 'contributors/mozilla/submitted/fontreftests/';
    
###############################################################################
# Eira Monstad

###############################################################################
# Gabriele Romanato

###############################################################################
# Gérard Talbot
push @dirs, 'contributors/gtalbot/submitted/';

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

###############################################################################
# TTWF


$dirlist = join ' ', @dirs;
print `python tools/build-css3-fonts.py $dirlist 2>&1`;
print `find dist/css3-fonts -type f -exec chmod 644 {} \\;`;

