#!/usr/bin/perl -w

use strict;
use utf8;
use lib '../CSS2.1-test-suite/lib';
use indexer;

indexer::init("http://www.w3.org/TR/2003/CR-css3-color-20030514", "data/section-index.xht", "css3-color Test Suite: ");

foreach my $file (@ARGV) {
    $file =~ m/^tests\/(.+)\.xht$/os;
    my $root = $1;
    indexer::index($file, $root);
}

indexer::save("tests/by-section.xht");
