#!/usr/bin/perl -w

use strict;
use utf8;
use lib 'lib';
use indexer;

indexer::init("http://www.w3.org/TR/CSS21/", "data/section-index.xht", "CSS 2.1 Test Suite: ");

foreach my $file (@ARGV) {
    $file =~ m/^tests\/(.+)\.xht$/os;
    my $root = $1;
    indexer::index($file, $root);
}

indexer::save("tests/by-section.xht");
