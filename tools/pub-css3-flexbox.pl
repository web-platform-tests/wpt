#!/usr/bin/perl
# pub-css3-flexbox
# Script for cleaning up the repository prior to building the CSS Flexbox test suite.

use File::Path;

rmtree('dist/css3-flexbox');

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
push @dirs, 'contributors/mozilla/submitted/mozilla-central-reftests/flexbox';

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
push @dirs, 'contributors/opera/submitted/css3-flexbox/';
push @dirs, 'contributors/opera/submitted/css3-flexbox/getcomputedstyle/';
push @dirs, 'contributors/opera/submitted/css3-flexbox/interactive/';

###############################################################################
# TTWF
push @dirs, 'contributors/ttwf_bj/haosdent/submitted/';
push @dirs, 'contributors/ttwf_bj/houzhenyu/submitted';
push @dirs, 'contributors/ttwf_bj/keynesqu/submitted/';
push @dirs, 'contributors/ttwf_bj/peter/submitted/';
push @dirs, 'contributors/ttwf_bj/phuangce/submitted/';
push @dirs, 'contributors/ttwf_bj/shuiling/submitted/';
push @dirs, 'contributors/ttwf_bj/ttwfbj_gmail/xiaoxia/submitted/';
push @dirs, 'contributors/ttwf_bj/winter/submitted/';
push @dirs, 'contributors/ttwf_bj/yugang/submitted/css3-flexbox/';
push @dirs, 'contributors/ttwf_bj/zhouli/submitted/';

push @dirs, 'contributors/ttwf_tokyo/ogaoga/submitted';
push @dirs, 'contributors/ttwf_tokyo/tmtysk/submitted/flex-lines';
push @dirs, 'contributors/ttwf_tokyo/tmtysk/submitted/order';



$dirlist = join ' ', @dirs;
print `python tools/build-css3-flexbox.py $dirlist 2>&1`;
print `find dist/css3-flexbox -type f -exec chmod 644 {} \\;`;

