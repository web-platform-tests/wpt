#!/usr/bin/perl
# prep-css3-shapes
# Script for cleaning up the repository prior to building the CSS Shapes test suite.

use File::Path;

rmtree('dist/css3-shapes');

# approved/ directory is ready already and built automatically


@dirs = (); # extra (unreviewed test) directories

# Prep by Contributor:

###############################################################################
# Adobe
push @dirs, 'contributors/adobe/submitted/shapes';
push @dirs, 'contributors/adobe/submitted/shapes/shape-outside';
push @dirs, 'contributors/adobe/submitted/shapes/shape-outside/values';
push @dirs, 'contributors/adobe/submitted/shapes/shape-outside/supported-shapes';
push @dirs, 'contributors/adobe/submitted/shapes/shape-outside/supported-shapes/circle';
push @dirs, 'contributors/adobe/submitted/shapes/shape-outside/supported-shapes/ellipse';
push @dirs, 'contributors/adobe/submitted/shapes/shape-outside/supported-shapes/inset';
push @dirs, 'contributors/adobe/submitted/shapes/shape-outside/supported-shapes/polygon';
push @dirs, 'contributors/adobe/submitted/shapes/shape-outside/shape-image';
push @dirs, 'contributors/adobe/submitted/shapes/shape-outside/shape-image/gradients';

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
# TestTWF
push @dirs, 'contributors/ttwf_shenzhen/css-shapes/biqing/submitted';
push @dirs, 'contributors/ttwf_shenzhen/css-shapes/noonnightstorm/submitted';
push @dirs, 'contributors/ttwf_shenzhen/css-shapes/sherlock/submitted';

###############################################################################

$dirlist = join ' ', @dirs;
print `python tools/build-css3-shapes.py $dirlist 2>&1`;
print `find dist/css3-shapes -type f -exec chmod 644 {} \\;`;

