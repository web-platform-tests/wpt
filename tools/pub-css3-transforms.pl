#!/usr/bin/perl
# pub-css3-transforms
# Script for cleaning up the repository prior to building the CSS Transforms test suite.

use File::Path;

rmtree('dist/css3-transforms');

# approved/ directory is ready already and built automatically


@dirs = (); # extra (unreviewed test) directories

# Prep by Contributor:

###############################################################################
# Adobe
push @dirs, 'contributors/adobe/submitted/svg-transform/patternTransform';
push @dirs, 'contributors/adobe/submitted/svg-transform/rotate';
push @dirs, 'contributors/adobe/submitted/svg-transform/scale';
push @dirs, 'contributors/adobe/submitted/svg-transform/skewX';
push @dirs, 'contributors/adobe/submitted/svg-transform/skewY';
push @dirs, 'contributors/adobe/submitted/svg-transform/transform-list-separation';
push @dirs, 'contributors/adobe/submitted/svg-transform/transform-origin';
push @dirs, 'contributors/adobe/submitted/svg-transform/translate';
push @dirs, 'contributors/adobe/submitted/svg-transform/translateX';
push @dirs, 'contributors/adobe/submitted/svg-transform/translateY';

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
push @dirs, 'contributors/aryehgregor/submitted';
    
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
print `python tools/build-css3-transforms.py $dirlist 2>&1`;
print `find dist/css3-transforms -type f -exec chmod 644 {} \\;`;

