#!/usr/bin/perl
# pub-filter-effects
# Script for cleaning up the repository prior to building the Filter Effects test suite.

use File::Path;

rmtree('dist/filter-effects');

# approved/ directory is ready already and built automatically


@dirs = (); # extra (unreviewed test) directories

# Prep by Contributor:

###############################################################################
# Adobe
push @dirs, 'contributors/adobe/submitted/filter-effects';

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

###############################################################################
push @dirs, 'contributors/ttwf_tokyo/ultimatezen/submitted';
push @dirs, 'contributors/ttwf_tokyo/yomotsu/submitted';
push @dirs, 'contributors/ttwf_tokyo/sparkgene/submitted';
push @dirs, 'contributors/ttwf_tokyo/nakajmg/submitted';
push @dirs, 'contributors/ttwf_tokyo/gunta/submitted';
push @dirs, 'contributors/ttwf_tokyo/takenspc/submitted';
push @dirs, 'contributors/ttwf_tokyo/Tayatt/submitted';


$dirlist = join ' ', @dirs;
print `python tools/build-filter-effects.py $dirlist 2>&1`;
print `find dist/filter-effects -type f -exec chmod 644 {} \\;`;

