#!/usr/bin/perl
# prep-css3-regions
# Script for cleaning up the repository prior to building the CSS Regions test suite.

use File::Path;

rmtree('dist/css3-regions');

# approved/ directory is ready already and built automatically


@dirs = (); # extra (unreviewed test) directories

# Prep by Contributor:

###############################################################################
# Adobe
push @dirs, 'contributors/adobe/submitted/regions';
push @dirs, 'contributors/adobe/submitted/regions/counters';
push @dirs, 'contributors/adobe/submitted/regions/interactivity/mouse';
push @dirs, 'contributors/adobe/submitted/regions/interactivity/selection';
push @dirs, 'contributors/adobe/submitted/regions/writing-modes';
push @dirs, 'contributors/adobe/submitted/regions/stacking-context';


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

###############################################################################
# CSSWG Issues

###############################################################################
# Microsoft

###############################################################################
# Opera

###############################################################################

$dirlist = join ' ', @dirs;
print `python tools/build-css3-regions.py $dirlist 2>&1`;
print `find dist/css3-regions -type f -exec chmod 644 {} \\;`;

